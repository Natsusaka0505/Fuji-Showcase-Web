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

/** Feasibility collapses below this penalty weight; used across several views. */
export const CRITICAL_A =
  penaltySweep.points.find((p) => p.n_below_best_clean === 0)?.penalty_A ?? 0.74;

export const fmtUsd = (v: number) =>
  v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v.toFixed(0)}`;

export const fmtCost = (v: number) => (Number.isFinite(v) ? v.toFixed(4) : "—");

export const fmtHours = (sec: number) => `${(sec / 3600).toFixed(1)} h`;

export type { Port };
