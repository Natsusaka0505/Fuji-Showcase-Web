/**
 * 16-qubit Q-Logistics QUBO solver.
 *
 * The model was reverse-engineered from the 65 Pauli terms of `q9_16q_ising.json`
 * and agrees with the platform's `cost_of_z` to 2.3e-13:
 *
 *     ising(x) = sum_e score_e * x_e + A * sum_v (flow_v(x) - rhs_v)^2 - offset
 *
 * `flow_v` is the signed incidence of the selected edges at port v and `rhs_v` is
 * +1 at the source, -1 at the target, 0 elsewhere. So the second term is exactly
 * the flow-balance penalty, and a selection is flow-balanced iff its penalty is 0.
 * That equivalence is what keeps this cheap: the penalty vector is built once and
 * only the score sum is rebuilt per parameter change, and route decoding runs on
 * the handful of zero-penalty states rather than all 65536.
 */

export interface Edge {
  index: number;
  var_name: string;
  origin: string;
  destination: string;
  origin_iso: string;
  destination_iso: string;
  score: number;
  risk_norm_hypothesis: number;
  cost_norm_hypothesis: number;
}

export interface EdgeData {
  edges: Edge[];
  incidence_ports: string[];
  incidence: number[][];
  rhs: number[];
}

export interface Meta {
  source_port: string;
  target_port: string;
  n_qubits: number;
  penalty_A_default: number;
  ising_offset: number;
  risk_lambda_default: number;
}

export interface RouteSolution {
  z: number;
  cost: number;
  route: string[];
  routeIso: string[];
  nEdges: number;
  /** Flow-balanced: every port has as many outgoing as incoming picks. */
  feasible: boolean;
  /** The successor walk from the source actually reaches the target. */
  complete: boolean;
}

export interface SolveResult {
  /** Lowest energy over the whole space, feasible or not. */
  globalMin: RouteSolution;
  /** Best clean route; null only if every clean route is blocked. */
  bestClean: RouteSolution | null;
  /** Clean routes, cheapest first. */
  ranking: RouteSolution[];
  /** States beating the best clean route — what the optimiser could cheat with. */
  cheatStates: number;
  energyStats: { min: number; max: number; mean: number };
}

export interface SolveParams {
  /** Flow-balance penalty weight. Feasibility collapses below A* ~ 0.74. */
  penaltyA: number;
  /** Per-edge scores; defaults to the baked `edges.json` values. */
  scores?: Float64Array;
  /** ISO codes of ports taken offline (blockade, closure). */
  blockedPorts?: readonly string[];
}

export class Q9Model {
  readonly n: number;
  readonly size: number;
  readonly meta: Meta;
  /** Endpoint pair this instance is built for; defaults to the competition's. */
  readonly source: string;
  readonly target: string;
  /** +1 at the source, -1 at the target, 0 elsewhere; derived from the pair. */
  readonly rhs: readonly number[];
  readonly edges: Edge[];
  readonly defaultScores: Float64Array;

  /** sum_v (flow_v - rhs_v)^2 per state; independent of scores and of A. */
  private readonly penalty: Float64Array;
  /** Zero-penalty states that also reach the target, cached with their routes. */
  private readonly cleanRoutes: readonly RouteSolution[];
  private readonly isoOf: ReadonlyMap<string, string>;
  private readonly edgeMask: ReadonlyMap<string, number>;

  constructor(meta: Meta, data: EdgeData, endpoints?: { source: string; target: string }) {
    this.meta = meta;
    this.source = endpoints?.source ?? meta.source_port;
    this.target = endpoints?.target ?? meta.target_port;
    // Deriving rhs from the endpoints (rather than reading data.rhs) is what makes
    // them selectable. The default pair must reproduce data.rhs exactly;
    // verify_engine checks that, plus the clean set of every reachable pair.
    this.rhs = data.incidence_ports.map((p) => (p === this.source ? 1 : p === this.target ? -1 : 0));
    this.edges = data.edges;
    this.n = meta.n_qubits;
    this.size = 1 << this.n;
    this.defaultScores = Float64Array.from(data.edges, (e) => e.score);

    const isoOf = new Map<string, string>();
    const edgeMask = new Map<string, number>();
    for (const e of data.edges) {
      isoOf.set(e.origin, e.origin_iso);
      isoOf.set(e.destination, e.destination_iso);
      for (const iso of [e.origin_iso, e.destination_iso]) {
        edgeMask.set(iso, (edgeMask.get(iso) ?? 0) | (1 << e.index));
      }
    }
    this.isoOf = isoOf;
    this.edgeMask = edgeMask;

    // Flow imbalance is additive over edges, so walk states in Gray-free order and
    // reuse the imbalance of z-without-its-lowest-bit. Cheaper: accumulate directly.
    const nPorts = data.incidence_ports.length;
    this.penalty = new Float64Array(this.size);
    const flow = new Int16Array(nPorts);
    for (let z = 0; z < this.size; z++) {
      flow.fill(0);
      for (let i = 0; i < this.n; i++) {
        if ((z >> i) & 1) {
          const col = data.incidence;
          for (let v = 0; v < nPorts; v++) flow[v] += col[v][i];
        }
      }
      let p = 0;
      for (let v = 0; v < nPorts; v++) {
        const d = flow[v] - this.rhs[v];
        p += d * d;
      }
      this.penalty[z] = p;
    }

    // Feasibility is structural, so the clean set is fixed for the app's lifetime.
    const clean: RouteSolution[] = [];
    for (let z = 1; z < this.size; z++) {
      if (this.penalty[z] !== 0) continue;
      const r = this.decode(z);
      if (r.complete) clean.push(r);
    }
    this.cleanRoutes = clean;
  }

  /** Clean complete routes for this endpoint pair, before any blockade filter. */
  get nCleanRoutes(): number {
    return this.cleanRoutes.length;
  }

  /** Walk the successor map from the source, exactly as `decode_route_ising` does. */
  decode(z: number): RouteSolution {
    const src = this.source;
    const tgt = this.target;
    const next = new Map<string, string>();
    let nEdges = 0;
    for (const e of this.edges) {
      if (!((z >> e.index) & 1)) continue;
      nEdges++;
      next.set(e.origin, e.destination);
    }

    const route = [src];
    const seen = new Set<string>();
    let cur = src;
    while (next.has(cur) && !seen.has(cur) && route.length <= nEdges + 1) {
      seen.add(cur);
      cur = next.get(cur)!;
      route.push(cur);
    }

    return {
      z,
      cost: NaN,
      route,
      routeIso: route.map((p) => this.isoOf.get(p) ?? p),
      nEdges,
      feasible: this.penalty[z] === 0,
      complete: route.length > 1 && route[route.length - 1] === tgt,
    };
  }

  /** Energy of every state under the given parameters. ~1 ms for n=16. */
  energies({ penaltyA, scores = this.defaultScores }: SolveParams): Float64Array {
    const { size, penalty } = this;
    const offset = this.meta.ising_offset;
    // scoreSum[z] = scoreSum[z without lowest bit] + score of that edge.
    const out = new Float64Array(size);
    const scoreSum = new Float64Array(size);
    out[0] = penaltyA * penalty[0] - offset;
    for (let z = 1; z < size; z++) {
      const low = z & -z;
      const rest = z ^ low;
      scoreSum[z] = scoreSum[rest] + scores[31 - Math.clz32(low)];
      out[z] = scoreSum[z] + penaltyA * penalty[z] - offset;
    }
    return out;
  }

  solve(params: SolveParams): SolveResult {
    const E = this.energies(params);
    let blockedMask = 0;
    for (const iso of params.blockedPorts ?? []) blockedMask |= this.edgeMask.get(iso) ?? 0;

    let gz = 0;
    let gv = Infinity;
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let z = 0; z < this.size; z++) {
      const v = E[z];
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
      if (v < gv && (z & blockedMask) === 0) {
        gv = v;
        gz = z;
      }
    }

    const ranking = this.cleanRoutes
      .filter((r) => (r.z & blockedMask) === 0)
      .map((r) => ({ ...r, cost: E[r.z] }))
      .sort((a, b) => a.cost - b.cost);

    const bestClean = ranking[0] ?? null;
    let cheatStates = 0;
    if (bestClean) {
      for (let z = 0; z < this.size; z++) {
        if (E[z] < bestClean.cost && (z & blockedMask) === 0) cheatStates++;
      }
    }

    return {
      globalMin: { ...this.decode(gz), cost: gv },
      bestClean,
      ranking,
      cheatStates,
      energyStats: { min, max, mean: sum / this.size },
    };
  }

  /** Energy landscape histogram, for the distribution chart. */
  histogram(params: SolveParams, bins = 80): { counts: Int32Array; binEdges: Float64Array } {
    const E = this.energies(params);
    let min = Infinity;
    let max = -Infinity;
    for (let z = 0; z < this.size; z++) {
      if (E[z] < min) min = E[z];
      if (E[z] > max) max = E[z];
    }
    const width = (max - min) / bins || 1;
    const counts = new Int32Array(bins);
    for (let z = 0; z < this.size; z++) {
      counts[Math.min(bins - 1, Math.floor((E[z] - min) / width))]++;
    }
    const binEdges = Float64Array.from({ length: bins + 1 }, (_, i) => min + i * width);
    return { counts, binEdges };
  }
}

/**
 * Ports reachable from `source` along directed edges — the valid target choices.
 * A simple directed path is automatically flow-balanced, so a pair has at least
 * one clean route iff a path exists.
 */
export function reachableTargets(data: EdgeData, source: string): string[] {
  const adj = new Map<string, string[]>();
  for (const e of data.edges) {
    const l = adj.get(e.origin) ?? [];
    l.push(e.destination);
    adj.set(e.origin, l);
  }
  const seen = new Set<string>();
  const stack = [source];
  while (stack.length) {
    for (const q of adj.get(stack.pop()!) ?? []) {
      if (!seen.has(q)) {
        seen.add(q);
        stack.push(q);
      }
    }
  }
  seen.delete(source); // a round trip is not a corridor
  return data.incidence_ports.filter((p) => seen.has(p));
}
