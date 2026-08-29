#!/usr/bin/env python3
"""Extract the 0.9281-family full network from the Colab bundle's graph_q9
artifacts into src/data/q9_data/showcase_network.json.

Source of truth: mode_edge_table.csv (256 mode edges, five Hamiltonian
components each) and corridor_paths.json (the published 6-path ranking).
The absolute weights (0.30/0.20/0.20/0.15/0.15) come from
README_QLogistics_Champion_ProposalAligned.txt in the same directory.

Asserts before writing: components sum to edge_score_q9 on every edge, and
summing each corridor path's best-mode pair scores reproduces the published
path ranking.
"""
import csv, json, math, pathlib, sys

GRAPH_Q9 = pathlib.Path.home() / (
    "Desktop/Fujitsu_Quantum_Simulator_Challenge_2025-26-main/outputs/q9_qarp_exports/work/"
    "Fujitsu_Quantum_Simulator_Challenge_2025_26_Grover_adaptive_search/"
    "Fujitsu_Quantum_Simulator_Challenge_2025-26-Grover_adaptive_search/graph_q9"
)
OUT = pathlib.Path(__file__).resolve().parent.parent / "src/data/q9_data/showcase_network.json"
COMPS = ["alpha_cost_component_q9_mean", "beta_time_component_q9_mean",
         "gamma1_geo_component_q9_mean", "gamma2_port_component_q9_mean",
         "gamma3_weather_component_q9_mean"]

def main():
    art = GRAPH_Q9 / "artifacts/q9_graph"
    nodes = [
        {"port": r["node_port"], "country": r["node_country"], "iso3": r["node_iso3"]}
        for r in csv.DictReader(open(art / "node_table.csv"))
    ]
    edges = []
    worst = 0.0
    for r in csv.DictReader(open(art / "mode_edge_table.csv")):
        comp = [float(r[c]) for c in COMPS]
        score = float(r["edge_score_q9"])
        worst = max(worst, abs(sum(comp) - score))
        edges.append({
            "pair": r["pair_key"],
            "origin": r["origin_port"],
            "destination": r["destination_port"],
            "mode": r["transport_mode"],
            "score": round(score, 9),
            "alpha": round(comp[0], 9),
            "beta": round(comp[1], 9),
            "gamma1": round(comp[2], 9),
            "gamma2": round(comp[3], 9),
            "gamma3": round(comp[4], 9),
            "distance_km": round(float(r["distance_km_mean"]), 3),
            "lead_time_days": round(float(r["lead_time_days_mean"]), 3),
        })
    assert worst < 1e-9, f"component sum mismatch: {worst}"

    # The documented absolute weights, checked against the unweighted columns:
    # α and β are exact; the γ raw columns aggregate slightly differently, so
    # they are only pinned to the documented value within 5%.
    ratio_checks = [
        ("alpha_cost_component_q9_mean", "cost_term_norm_mean", 0.30, 1e-12),
        ("beta_time_component_q9_mean", "time_term_norm_mean", 0.20, 1e-12),
        ("gamma1_geo_component_q9_mean", "geo_component_q9_mean", 0.20, 0.05),
        ("gamma2_port_component_q9_mean", "port_component_q9_mean", 0.15, 0.05),
        ("gamma3_weather_component_q9_mean", "weather_component_q9_mean", 0.15, 0.05),
    ]
    rows = list(csv.DictReader(open(art / "mode_edge_table.csv")))
    for comp_col, raw_col, w, tol in ratio_checks:
        for r in rows:
            x = float(r[raw_col])
            if x > 1e-12:
                assert abs(float(r[comp_col]) / x - w) <= tol, \
                    f"{comp_col}: ratio off {w} beyond {tol}"

    paths = json.load(open(art / "corridor_paths.json"))["paths"]
    # Reproduce each path score as the sum of best-mode scores over its pairs.
    best = {}
    for e in edges:
        if e["pair"] not in best or e["score"] < best[e["pair"]]:
            best[e["pair"]] = e["score"]
    for p in paths:
        s = sum(best[k] for k in p["pair_keys"])
        assert abs(s - p["path_score"]) < 1e-9, f"path {p['path_rank']}: {s} vs {p['path_score']}"

    out = {
        "source": "graph_q9 artifacts(Colab bundle):mode_edge_table.csv + corridor_paths.json",
        "score_column": "edge_score_q9(= qubo_energy_q9_consistency_mean)",
        "weights": {"alpha": 0.30, "beta": 0.20, "gamma1": 0.20, "gamma2": 0.15, "gamma3": 0.15},
        "weights_source": "README_QLogistics_Champion_ProposalAligned.txt(絕對權重,官方文件明載)",
        "nodes": nodes,
        "edges": edges,
        "corridor_paths": [
            {"rank": p["path_rank"], "path": p["node_path"], "pairs": p["pair_keys"],
             "score": round(p["path_score"], 9)}
            for p in paths
        ],
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"wrote {OUT} — {len(nodes)} nodes, {len(edges)} mode edges, "
          f"{len(paths)} corridor paths; worst |Σcomp−score| = {worst:.2e}")

if __name__ == "__main__":
    sys.exit(main())
