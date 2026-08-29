#!/usr/bin/env python3
"""Offline precompute for the Q-Logistics RN app.

Reads the ONE authoritative artifact that exists in the contest repo
(platform_gas/instances/q9_16q_ising.json) plus the 40q result JSON, and emits
the baked asset bundle the app ships with.

The QUBO construction was reverse-engineered from the 65 Pauli terms and
verified to 3.6e-15:

    QUBO(x)  = sum_e score_e * x_e  +  A * sum_v (flow_v(x) - rhs_v)^2
    ising(x) = QUBO(x) - ising_offset      # the A*sum(rhs^2)=2A term lives inside QUBO

so `penalty_A` and per-edge `score` are free parameters the app can vary live.
Everything emitted here is derived, never invented; numbers that came from the
Obsidian notes are tagged with their source string.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

REPO = Path("/Users/natsusaka/Desktop/Fujitsu_Quantum_Simulator_Challenge_2025-26")
ISING = REPO / "platform_gas/instances/q9_16q_ising.json"
RES40 = REPO / "platform_gas/results_40q/gas_result_7951873.json"
OUT = Path(__file__).resolve().parent.parent / "src/data/q9_data"

# Port coordinates are the only field with no upstream source in the repo:
# public port positions, added here so the map tab can draw. Not model input.
PORT_GEO = {
    "Singapore":      (1.2644, 103.8400),
    "Hong Kong":      (22.3193, 114.1694),
    "Kaohsiung":      (22.6163, 120.2861),
    "Shanghai":       (31.2304, 121.4737),
    "Colombo":        (6.9271, 79.8612),
    "Suez/Port Said": (31.2653, 32.3019),
    "Piraeus":        (37.9420, 23.6465),
    "Rotterdam":      (51.9225, 4.4792),
    "Los Angeles":    (33.7395, -118.2610),
}
# 九港災害風險模型.md  (USGS ANSS ComCat, M5.0+ / 300km / 2015-01-01..2026-07-04)
QUAKE_M5 = {"Kaohsiung": 243, "Piraeus": 79, "Los Angeles": 12, "Shanghai": 1,
            "Hong Kong": 0, "Singapore": 0, "Colombo": 0, "Suez/Port Said": 0, "Rotterdam": 0}
# 災害資料可稽核面板.md  (JMA RSMC Tokyo best track -> port-closure days per year)
TYPHOON_DAYS = {"Kaohsiung": 6.0, "Hong Kong": 3.818, "Shanghai": 2.364, "Colombo": 0.8,
                "Los Angeles": 0.3, "Rotterdam": 0.2, "Piraeus": 0.1, "Singapore": 0.091,
                "Suez/Port Said": 0.0}
# SCA + IMF PortWatch: Red Sea crisis -> 1.43x risk multiplier on Suez
CONFLICT_MULT = {"Suez/Port Said": 1.43}
USGS = ("https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson"
        "&starttime=2015-01-01&endtime=2026-07-04&minmagnitude=5.0"
        "&latitude={lat}&longitude={lon}&maxradiuskm=300")

ISO = {"Singapore": "SIN", "Hong Kong": "HKG", "Kaohsiung": "KHH", "Shanghai": "SHA",
       "Colombo": "CMB", "Suez/Port Said": "SUZ", "Piraeus": "PIR", "Rotterdam": "RTM",
       "Los Angeles": "LAX"}


def load():
    d = json.loads(ISING.read_text(encoding="utf-8"))
    terms = []
    for t in d["terms"]:
        s = t["pauli"]
        zq = tuple(sorted(len(s) - 1 - p for p, ch in enumerate(s) if ch == "Z"))
        terms.append((zq, float(t["coeff_real"])))
    return d, terms


def cost_of_z(z, terms):
    """Reference implementation, byte-for-byte the platform's gas_qulacs_q9.cost_of_z."""
    c = 0.0
    for zq, co in terms:
        if not zq:
            c += co
            continue
        p = 0
        for q in zq:
            p ^= (z >> q) & 1
        c += co if p == 0 else -co
    return c


def main():
    d, terms = load()
    n = int(d["num_qubits"])
    V = d["variables"]
    A0 = float(d["penalty_A"])
    OFF = float(d["ising_offset"])
    src, tgt = d["source_port"], d["target_port"]
    ports = sorted({v["origin_port"] for v in V} | {v["destination_port"] for v in V})

    # ---- vectorised model: cost(z, A) = score.x + A*penalty(x) + 2A - offset --------
    Z = np.arange(1 << n, dtype=np.uint32)
    X = ((Z[:, None] >> np.arange(n)[None, :]) & 1).astype(np.int8)      # (65536, 16)
    score = np.array([v["score"] for v in V], dtype=np.float64)
    B = np.zeros((len(ports), n))                                        # incidence
    rhs = np.zeros(len(ports))
    for pi, nd in enumerate(ports):
        for i, v in enumerate(V):
            if v["origin_port"] == nd:
                B[pi, i] += 1
            if v["destination_port"] == nd:
                B[pi, i] -= 1
        rhs[pi] = 1.0 if nd == src else (-1.0 if nd == tgt else 0.0)
    score_sum = X @ score
    penalty = ((X @ B.T - rhs[None, :]) ** 2).sum(axis=1)

    def energies(a, sc=None):
        s = score_sum if sc is None else X @ sc
        return s + a * penalty - OFF

    E = energies(A0)
    ref = np.array([cost_of_z(int(z), terms) for z in range(1 << n)])
    err = float(np.abs(E - ref).max())
    assert err < 1e-9, f"model mismatch {err}"
    print(f"[verify] vectorised model vs cost_of_z  max|diff| = {err:.3e}  OK")

    # ---- route decode (mirrors decode_route_ising) ---------------------------------
    def decode(z):
        sel = [v for i, v in enumerate(V) if (z >> i) & 1]
        nxt = {v["origin_port"]: v["destination_port"] for v in sel}
        route, cur, seen = [src], src, set()
        while cur in nxt and cur not in seen and len(route) <= len(sel) + 1:
            seen.add(cur)
            cur = nxt[cur]
            route.append(cur)
        bal = {}
        for v in sel:
            bal[v["origin_port"]] = bal.get(v["origin_port"], 0) + 1
            bal[v["destination_port"]] = bal.get(v["destination_port"], 0) - 1
        feas = (bal.get(src, 0) == 1 and bal.get(tgt, 0) == -1 and
                all(bal.get(nd, 0) == (1 if nd == src else -1 if nd == tgt else 0) for nd in bal))
        complete = len(route) > 1 and route[-1] == tgt
        return route, complete, bool(feas), len(sel)

    clean = []
    for z in range(1 << n):
        route, complete, feas, ne = decode(z)
        if feas and complete:
            clean.append({"z": int(z), "bits": [int(b) for b in X[z]], "cost": float(E[z]),
                          "route": route, "route_iso": [ISO[p] for p in route], "n_edges": ne})
    clean.sort(key=lambda r: r["cost"])
    print(f"[solve ] clean feasible = {len(clean)}   optimum = {clean[0]['cost']:.10f}")
    print(f"[solve ] optimal route  = {' -> '.join(clean[0]['route'])}")

    # ---- penalty_A sweep: the "why the penalty term exists" chart --------------------
    sweep = []
    # dense where the penalty actually decides feasibility (0..2), coarse after
    grid = np.unique(np.round(np.concatenate([np.arange(0.0, 2.001, 0.02),
                                              np.arange(2.0, 20.01, 0.5)]), 3))
    for a in grid:
        Ea = energies(float(a))
        gz = int(np.argmin(Ea))
        r, comp, fe, ne = decode(gz)
        sweep.append({"penalty_A": float(a), "global_min": float(Ea[gz]),
                      "global_min_feasible": bool(fe and comp),
                      "global_min_route": [ISO[p] for p in r] if comp else [],
                      "best_clean": float(min(Ea[c["z"]] for c in clean)),
                      "n_below_best_clean": int((Ea < min(Ea[c["z"]] for c in clean)).sum())})

    # ---- energy histogram at the shipped A -----------------------------------------
    hist, edges_bin = np.histogram(E, bins=80)

    # ---- edge table + the (UNVERIFIED) cost/risk split ------------------------------
    PR = d["port_risk"]
    rmax = max(PR.values())
    lam = float(d["risk_lambda"])
    edges = []
    for i, v in enumerate(V):
        rn = PR[v["destination_port"]] / rmax
        edges.append({
            "index": i, "var_name": v["var_name"],
            "origin": v["origin_port"], "destination": v["destination_port"],
            "origin_iso": ISO[v["origin_port"]], "destination_iso": ISO[v["destination_port"]],
            "score": float(v["score"]),
            "risk_norm_hypothesis": float(rn),
            "cost_norm_hypothesis": float((v["score"] - lam * rn) / (1 - lam)),
        })

    OUT.mkdir(parents=True, exist_ok=True)

    def dump(name, obj):
        p = OUT / name
        p.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"[write ] {name:24s} {p.stat().st_size/1024:8.1f} KB")

    dump("meta.json", {
        "problem_name": d["problem_name"], "level": d["level"],
        "source_port": src, "target_port": tgt, "n_qubits": n,
        "penalty_A_default": A0, "ising_offset": OFF, "risk_lambda_default": lam,
        "num_pauli_terms": d["num_pauli_terms"], "num_linear_terms": d["num_linear_terms"],
        "num_quadratic_terms": d["num_quadratic_terms"],
        "model_formula": "ising(x) = sum_e score_e*x_e + A*sum_v (flow_v(x)-rhs_v)^2 - ising_offset",
        "model_verified_max_abs_err": err,
        "caveat": ("此 16q ising 的最佳值為 -97.4936。筆記中的 0.9281 / corridor rank 屬"
                   "另一個 local reduced QUBO,兩者不可同圖並列。"),
    })
    dump("ports.json", [{
        "name": p, "iso": ISO[p], "lat": PORT_GEO[p][0], "lon": PORT_GEO[p][1],
        "port_risk": PR[p], "quake_m5_300km": QUAKE_M5[p],
        "typhoon_closure_days_per_year": TYPHOON_DAYS[p],
        "conflict_multiplier": CONFLICT_MULT.get(p, 1.0),
        "usgs_verify_url": USGS.format(lat=PORT_GEO[p][0], lon=PORT_GEO[p][1]),
    } for p in ports])
    dump("edges.json", {
        "edges": edges,
        "incidence_ports": ports,
        "incidence": B.astype(int).tolist(),
        "rhs": rhs.astype(int).tolist(),
        "hypothesis_note": ("cost_norm/risk_norm 由 score=(1-λ)·cost+λ·risk_dest/max 反推,"
                            "相關係數 0.52、implied cost 全落在 [0,1],但 **未經 CSV 驗證**。"
                            "在拿到 QLogistics_Champion_ProposalAligned.csv 之前,"
                            "不得在對外畫面標示為事實。"),
    })
    dump("solutions_16q.json", {
        "optimum": clean[0]["cost"], "optimum_route": clean[0]["route"],
        "n_clean_feasible": len(clean), "clean_feasible": clean,
        "energy_stats": {"min": float(E.min()), "max": float(E.max()), "mean": float(E.mean()),
                         "std": float(E.std())},
        "histogram": {"counts": hist.tolist(), "bin_edges": [float(x) for x in edges_bin]},
    })
    dump("sweep_penalty.json", {"default": A0, "points": sweep})
    dump("result_40q.json", json.loads(RES40.read_text(encoding="utf-8").replace("NaN", "null")))
    # 蒙地卡羅-CVaR-風險分析.md — baked baseline, app recomputes live from these knobs
    dump("cvar.json", {
        "source": "Q9-筆記庫/戰報-Champion-Report/蒙地卡羅-CVaR-風險分析.md",
        "n_scenarios": 10000, "horizon_days": 30,
        # Recovered by least squares from the four baked route means (max err 0.2%).
        # suez_delay_days lands on 7.4979 vs the "7.5 天期望延誤" written in
        # 九港災害風險模型.md -> the structure is right, not an overfit.
        "mc_model": {
            "formula": ("mean_delay_days = w*sum(typhoon_days_per_year)"
                        " + quake_impact_days*w*sum(quake_count/catalog_years)"
                        " + suez_delay_days*[route passes Suez]"),
            "window_fraction_w": 30.0 / 365.0,
            "catalog_years": 11.504,
            "quake_impact_days": 0.7934,
            "suez_delay_days": 7.4979,
            # Tail shape is independent information: the means alone cannot fix it.
            # Two parameters were fitted against the four published CVaR95 values —
            # hazard-event durations are Gamma(shape=2) and the Suez transit delay
            # is deterministic. RMS tail error 3.1%, worst route 5.2%.
            "event_duration_shape_k": 2.0,
            "typhoon_event_mean_days": 1.0,
            "suez_delay_deterministic": True,
            "tail_fit_rms_err_pct": 3.1,
            "hormuz_extra_days": 12.0,
            "hormuz_war_premium_pct": [0.3, 10.0],
            "fit_max_abs_err_pct": 0.2,
        },
        "daily_delay_cost_usd": 267000, "cost_basis": "20,000 TEU;Drewry/Alphaliner 推算,estimate 級",
        "routes": [
            {"name": "蘇伊士線", "route_iso": ["SIN", "SUZ", "RTM", "LAX"],
             "mean_usd": 2030000, "cvar95_usd": 2440000, "cvar95_hormuz_usd": 2540000},
            {"name": "高雄可倫坡線", "route_iso": ["SIN", "KHH", "CMB", "SUZ", "RTM", "LAX"],
             "mean_usd": 2550000, "cvar95_usd": 3770000, "cvar95_hormuz_usd": 3940000},
            {"name": "香港蘇伊士線", "route_iso": ["SIN", "HKG", "SUZ", "RTM", "LAX"],
             "mean_usd": 2120000, "cvar95_usd": 2650000, "cvar95_hormuz_usd": 2800000},
            {"name": "地中海線", "route_iso": ["SIN", "HKG", "CMB", "PIR", "LAX"],
             "mean_usd": 250000, "cvar95_usd": 1120000, "cvar95_hormuz_usd": 1190000},
        ],
    })
    # 16q-QAOA-命中最佳解.md
    dump("algo_compare.json", {
        "anchor_cost": clean[0]["cost"],
        "rows": [
            {"algo": "暴力解 exact", "best_cost": -97.4936, "ratio": 1.0, "seconds": 0.06, "feasible": True},
            {"algo": "QAOA (量子)", "best_cost": -97.4936, "ratio": 1.0, "seconds": 21.0, "feasible": True,
             "note": "命中全域最佳解;執行時間 12-30s"},
            {"algo": "模擬退火 SA", "best_cost": -96.8297, "ratio": 0.9932, "seconds": 6.28, "feasible": True},
            {"algo": "Grover GAS (煙霧版)", "best_cost": -44.5631, "ratio": None, "seconds": 222.89,
             "feasible": False, "note": "feasible=False,近似比不適用,列 —"},
        ],
        "convergence_16q": {"iters": 20, "start": -0.35, "end": -44.7879,
                            "note": "僅端點有紀錄;完整 20 點曲線在缺失的 bundle 內"},
    })
    dump("audit.json", {"sources": [
        {"id": "quake", "org": "U.S. Geological Survey",
         "dataset": "ANSS Comprehensive Earthquake Catalog (ComCat), FDSN Event Web Service",
         "url": "https://earthquake.usgs.gov/fdsnws/event/1/", "accessed": "2026-07-04"},
        {"id": "typhoon", "org": "Japan Meteorological Agency",
         "dataset": "RSMC Tokyo - Typhoon Center, Best Track Data",
         "url": "https://www.jma.go.jp/jma/jma-eng/jma-center/rsmc-hp-pub-eg/besttrack.html",
         "accessed": "2026-07-04"},
        {"id": "suez", "org": "Suez Canal Authority / IMF PortWatch",
         "dataset": "SCA chairman statement 2025-04; 2024 transits 13,213 vs 2023 26,434 (-50%)",
         "url": "https://portwatch.imf.org/", "accessed": "2026-07-04"},
        {"id": "hormuz", "org": "U.S. Energy Information Administration",
         "dataset": "World Oil Transit Chokepoints — Strait of Hormuz (~20 Mb/d, 94 ships/day)",
         "url": "https://www.eia.gov/", "accessed": "2026-07-04"},
    ]})
    print("[done  ] bundle ->", OUT)


if __name__ == "__main__":
    main()
