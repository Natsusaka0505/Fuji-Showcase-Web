/**
 * Shared parameter state.
 *
 * Both engines run synchronously — 0.5 ms to sweep all 65 536 states, 2 ms for
 * 10 000 Monte Carlo scenarios — so results are derived with useMemo during
 * render rather than pushed through effects or a worker. Dragging a slider stays
 * frame-accurate and every panel updates together.
 */
"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Q9Model, decomposeScores, scoresForLambda, type SolveResult } from "@/engine/model";
import { RiskEngine, DEFAULT_RISK_PARAMS, type RiskParams, type RiskResult } from "@/engine/risk";
import { meta, edgeData, ports, cvar } from "@/data";

/** Built once per browser session; construction sweeps the state space (~20 ms). */
export const defaultModel = new Q9Model(meta, edgeData);
export const riskEngine = new RiskEngine(ports, cvar.mc_model);

/** score = dist + λ·risk_dest + market, per the upstream generator; λ ships at 0.4. */
export const scoreDecomposition = decomposeScores(edgeData.edges, ports, meta.risk_lambda_default);

/** One model per endpoint pair, built lazily (~20 ms each) and kept for the session. */
const modelCache = new Map<string, Q9Model>([
  [`${meta.source_port}→${meta.target_port}`, defaultModel],
]);
export function getModel(source: string, target: string): Q9Model {
  const key = `${source}→${target}`;
  let m = modelCache.get(key);
  if (!m) {
    m = new Q9Model(meta, edgeData, { source, target });
    modelCache.set(key, m);
  }
  return m;
}

export interface Params {
  penaltyA: number;
  blockedPorts: string[];
  /** Risk weight λ in the edge scores. The competition instance ships at 0.4. */
  riskLambda: number;
  /** Endpoint pair. Anything but the default SIN→LAX is a browser-derived instance. */
  source: string;
  target: string;
  risk: RiskParams;
}

export const DEFAULT_PARAMS: Params = {
  penaltyA: meta.penalty_A_default,
  blockedPorts: [],
  riskLambda: meta.risk_lambda_default,
  source: meta.source_port,
  target: meta.target_port,
  risk: {
    ...DEFAULT_RISK_PARAMS,
    nScenarios: cvar.n_scenarios,
    horizonDays: cvar.horizon_days,
    dailyDelayCostUsd: cvar.daily_delay_cost_usd,
  },
};

export interface Store {
  params: Params;
  setParams: (fn: (p: Params) => Params) => void;
  setRisk: (patch: Partial<RiskParams>) => void;
  togglePort: (iso: string) => void;
  /** Toggle a port in/out of the escalated typhoon or earthquake scenario. */
  toggleHazardPort: (kind: "typhoon" | "quake", iso: string) => void;
  reset: () => void;
  isDefault: boolean;
  /** Engine for the selected endpoint pair. */
  model: Q9Model;
  /**
   * True when the pair differs from the competition instance. Every published
   * number (−97.4936, A* = 0.74, the sweep) belongs to SIN→LAX only, so derived
   * pairs must be flagged wherever those are shown.
   */
  derivedPair: boolean;
  /** Derived instance overall: non-default pair OR non-default λ. Gates published-number displays. */
  derived: boolean;
  /** Edge scores at the current λ; undefined at the shipped λ (use the baked scores). */
  scores: Float64Array | undefined;
  solution: SolveResult;
  /** Risk of the currently optimal route, under the live parameters. */
  routeRisk: RiskResult | null;
  /** The four published comparison routes, under the live parameters. */
  benchmarkRisks: (RiskResult & { name: string })[];
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}

export function useStoreValue(): Store {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);

  const model = getModel(params.source, params.target);
  const derivedPair = params.source !== DEFAULT_PARAMS.source || params.target !== DEFAULT_PARAMS.target;

  const scores = useMemo(
    () =>
      params.riskLambda === DEFAULT_PARAMS.riskLambda
        ? undefined
        : scoresForLambda(scoreDecomposition, params.riskLambda),
    [params.riskLambda],
  );
  const derived = derivedPair || scores !== undefined;

  const solution = useMemo(
    () => model.solve({ penaltyA: params.penaltyA, blockedPorts: params.blockedPorts, scores }),
    [model, params.penaltyA, params.blockedPorts, scores],
  );

  const routeRisk = useMemo(() => {
    const best = solution.bestClean;
    return best ? riskEngine.simulate(best.routeIso, params.risk) : null;
  }, [solution.bestClean, params.risk]);

  const benchmarkRisks = useMemo(
    () => cvar.routes.map((r) => ({ name: r.name, ...riskEngine.simulate(r.route_iso, params.risk) })),
    [params.risk],
  );

  const isDefault = useMemo(() => {
    if (params.penaltyA !== DEFAULT_PARAMS.penaltyA) return false;
    if (params.riskLambda !== DEFAULT_PARAMS.riskLambda) return false;
    if (params.blockedPorts.length > 0) return false;
    if (params.source !== DEFAULT_PARAMS.source || params.target !== DEFAULT_PARAMS.target) return false;
    return (Object.keys(params.risk) as (keyof RiskParams)[]).every((k) => {
      const v = params.risk[k];
      // The escalated-port lists are arrays; "default" means empty, not same ref.
      return Array.isArray(v) ? v.length === 0 : v === DEFAULT_PARAMS.risk[k];
    });
  }, [params]);

  return {
    params,
    setParams,
    setRisk: (patch) => setParams((p) => ({ ...p, risk: { ...p.risk, ...patch } })),
    togglePort: (iso) =>
      setParams((p) => ({
        ...p,
        blockedPorts: p.blockedPorts.includes(iso)
          ? p.blockedPorts.filter((x) => x !== iso)
          : [...p.blockedPorts, iso],
      })),
    toggleHazardPort: (kind, iso) =>
      setParams((p) => {
        const key = kind === "typhoon" ? "typhoonEscalatedPorts" : "quakeEscalatedPorts";
        const cur = p.risk[key];
        const next = cur.includes(iso) ? cur.filter((x) => x !== iso) : [...cur, iso];
        return { ...p, risk: { ...p.risk, [key]: next } };
      }),
    reset: () => setParams(DEFAULT_PARAMS),
    isDefault,
    model,
    derivedPair,
    derived,
    scores,
    solution,
    routeRisk,
    benchmarkRisks,
  };
}

export { StoreContext };
