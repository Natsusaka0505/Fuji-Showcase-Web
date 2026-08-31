/**
 * Baked data bundle. Imported statically so it is bundled at build time — the
 * site has no API and no loading state; everything is in memory on first paint.
 *
 * Regenerate with `npm run precompute` after changing anything upstream.
 */
import type { EdgeData, Meta } from "@/engine/model";
import type { McModel, Port } from "@/engine/risk";

import metaJson from "./q9_data/meta.json";
import edgesJson from "./q9_data/edges.json";
import portsJson from "./q9_data/ports.json";
import solutionsJson from "./q9_data/solutions_16q.json";
import sweepJson from "./q9_data/sweep_penalty.json";
import cvarJson from "./q9_data/cvar.json";
import algoJson from "./q9_data/algo_compare.json";
import auditJson from "./q9_data/audit.json";
import result40Json from "./q9_data/result_40q.json";
import report40Json from "./q9_data/report_40q.json";
import showcaseJson from "./q9_data/showcase.json";
import hazardsV2Json from "./q9_data/port_hazards_v2.json";
import showcaseNetworkJson from "./q9_data/showcase_network.json";
import v2Json from "./q9_data/app_data_v2.json";

export const meta = metaJson as Meta & {
  problem_name: string;
  num_pauli_terms: number;
  num_linear_terms: number;
  num_quadratic_terms: number;
  model_formula: string;
  model_verified_max_abs_err: number;
  caveat: string;
};

export const edgeData = edgesJson as EdgeData & { hypothesis_note: string };
export const ports = portsJson as Port[];

export const solutions = solutionsJson as {
  optimum: number;
  optimum_route: string[];
  n_clean_feasible: number;
  clean_feasible: { z: number; cost: number; route: string[]; route_iso: string[]; n_edges: number }[];
  energy_stats: { min: number; max: number; mean: number; std: number };
};

export const penaltySweep = sweepJson as {
  default: number;
  points: {
    penalty_A: number;
    global_min: number;
    global_min_feasible: boolean;
    global_min_route: string[];
    best_clean: number;
    n_below_best_clean: number;
  }[];
};

export const cvar = cvarJson as {
  source: string;
  n_scenarios: number;
  horizon_days: number;
  daily_delay_cost_usd: number;
  cost_basis: string;
  mc_model: McModel & { formula: string; tail_fit_rms_err_pct: number };
  routes: { name: string; route_iso: string[]; mean_usd: number; cvar95_usd: number; cvar95_hormuz_usd: number }[];
};

export const algoCompare = algoJson as {
  anchor_cost: number;
  rows: { algo: string; best_cost: number; ratio: number | null; seconds: number; feasible: boolean; note?: string }[];
  convergence_16q: { iters: number; start: number; end: number; note: string };
};

export const audit = auditJson as {
  sources: { id: string; org: string; dataset: string; url: string; accessed: string }[];
};

export const result40 = result40Json as {
  algorithm: string;
  n_key: number;
  n_val: number;
  total_qubits: number;
  mpi_processes: number;
  budget: number;
  iters_run: number;
  shots: number;
  warm_start_y0: number;
  best_objective: number;
  best_x: number[];
  feasible: boolean;
  route: string[];
  route_complete: boolean;
  n_edges: number;
  clean_route: boolean;
  wallclock_sec: number;
  complete: boolean;
  trail: { t: number; r: number; sampled: number; y: number; best: number; m_rot: number; sec: number }[];
  corridor: string;
};

export const showcase = showcaseJson as {
  source: string;
  instance: { name: string; variant: string; n_vars: number; n_pauli_terms: number; n_combinations: number };
  reduced_instance: { name: string; n_vars: number; n_pauli_terms: number };
  corridor: string[];
  pairs: string[];
  published_optimum: number;
  published_rank_totals: number[];
  weights_note: string;
  edges: {
    pair: string; mode: string; score: number;
    alpha: number; beta: number; gamma1: number; gamma2: number; gamma3: number;
    distance_km: number; lead_time_days: number;
  }[];
  scenarios: { name: string; label: string; best_objective: number; instance: string; note: string }[];
  algos: {
    label: string; runs: number; feasible_rate: number; hit_rate: number;
    best: number | null; median: number | null; std: number | null;
    depth: number | null; two_qubit_gates: number | null;
  }[];
};

export interface ShowcaseEdge {
  pair: string;
  origin: string;
  destination: string;
  mode: string;
  score: number;
  alpha: number;
  beta: number;
  gamma1: number;
  gamma2: number;
  gamma3: number;
  distance_km: number;
  lead_time_days: number;
}

/** The 0.9281 family's full network, extracted from the Colab bundle's graph_q9 artifacts. */
export const showcaseNetwork = showcaseNetworkJson as {
  source: string;
  score_column: string;
  weights: { alpha: number; beta: number; gamma1: number; gamma2: number; gamma3: number };
  weights_source: string;
  nodes: { port: string; country: string; iso3: string }[];
  edges: ShowcaseEdge[];
  corridor_paths: { rank: number; path: string[]; pairs: string[]; score: number }[];
};

export interface V2Instance {
  source: string;
  target: string;
  hazards: string[];
  qubits: number;
  classical_top5: { route: string[]; cost: number }[];
  quantum: {
    tier1_ratio: number | null;
    tier1_route: string[] | null;
    tier2_ratio: number | null;
    tier2_route: string[] | null;
    feasible_rate: number;
    q_routes: { route: string[]; q_count: number }[];
  };
  n_feasible_paths: number;
  evidence_job: string;
}

/** The v2 platform campaign: 30 ports, 15 corridors × 7 hazard sets, 105 jobs. */
export const v2 = v2Json as {
  version: string;
  generated: string;
  convention: string;
  disclaimer: string;
  ports: { [name: string]: { lat: number; lon: number; region: string; teu_rank_2024: number } };
  hazard_sources: { [hazard: string]: string };
  instances: V2Instance[];
};

export interface HazardSource {
  dataset?: string;
  publisher?: string;
  url?: string;
  method?: string;
  citation?: string;
  access_date?: string;
}

/** The raw hazard parameter file the published CVaR table was generated from. */
export const hazardsV2 = hazardsV2Json as unknown as {
  [port: string]: {
    eq_lambda?: number;
    eq_delay_mean_days?: number;
    eq_events_11y?: number;
    tc_closure_days_per_year?: number;
    tc_storms_2015_2025?: number;
    conflict_mult?: number;
    conflict_expected_delay_days?: number;
    sources?: { [hazard: string]: HazardSource };
    scenario_name?: string;
  };
};

export const hazardPorts = Object.keys(hazardsV2).filter((k) => !k.startsWith("_"));

/** Feasibility collapses below this penalty weight; used across several views. */
export const CRITICAL_A =
  penaltySweep.points.find((p) => p.n_below_best_clean === 0)?.penalty_A ?? 0.74;

export const fmtUsd = (v: number) =>
  v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v.toFixed(0)}`;

export const fmtCost = (v: number) => (Number.isFinite(v) ? v.toFixed(4) : "—");

export const fmtHours = (sec: number) => `${(sec / 3600).toFixed(1)} h`;

/**
 * The written report's own 40-qubit headlines, transcribed rather than derived:
 * the §5.1 flagship QAOA run with its three perturbation scenarios, and the
 * Figure 2 route flip. Job ids are the platform's.
 */
export const report40 = report40Json as {
  provenance: string;
  tier_note: string;
  flagship: {
    job: string; title_zh: string; source: string; target: string;
    qubits: number; edges: number; nodes: number; shots: number;
    optimum_hits: number; share_of_feasible: number; report_section: string;
    hits_tier: string;
    scenarios: { name_zh: string; job: string; route_changed: boolean; gap: number }[];
  };
  report_quote: { section: string; en: string; zh: string; url: string };
  flip: {
    job: string; figure: string; source: string; target: string; qubits: number;
    war_penalty_note_zh: string; calibration: string;
    tier1_ratio: number; tier2_ratio: number; ratio_note: string;
    ratio_scenario: string; ground_truth_cost: number;
    off: { label_zh: string; corridor_zh: string; route: string[] };
    on: { label_zh: string; corridor_zh: string; route: string[] };
  };
};

export type { Port };
