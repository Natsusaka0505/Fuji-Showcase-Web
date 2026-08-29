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
import { Q9Model, type SolveResult } from "@/engine/model";
import { RiskEngine, DEFAULT_RISK_PARAMS, type RiskParams, type RiskResult } from "@/engine/risk";
import { meta, edgeData, ports, cvar } from "@/data";

/** Built once per browser session; construction sweeps the state space (~20 ms). */
export const model = new Q9Model(meta, edgeData);
export const riskEngine = new RiskEngine(ports, cvar.mc_model);

export interface Params {
  penaltyA: number;
  blockedPorts: string[];
  risk: RiskParams;
}

export const DEFAULT_PARAMS: Params = {
  penaltyA: meta.penalty_A_default,
  blockedPorts: [],
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
  reset: () => void;
  isDefault: boolean;
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

  const solution = useMemo(
    () => model.solve({ penaltyA: params.penaltyA, blockedPorts: params.blockedPorts }),
    [params.penaltyA, params.blockedPorts],
  );

  const routeRisk = useMemo(() => {
    const best = solution.bestClean;
    return best ? riskEngine.simulate(best.routeIso, params.risk) : null;
  }, [solution.bestClean, params.risk]);

  const benchmarkRisks = useMemo(
    () => cvar.routes.map((r) => ({ name: r.name, ...riskEngine.simulate(r.route_iso, params.risk) })),
    [params.risk],
  );

  const isDefault = useMemo(
    () =>
      params.penaltyA === DEFAULT_PARAMS.penaltyA &&
      params.blockedPorts.length === 0 &&
      (Object.keys(params.risk) as (keyof RiskParams)[]).every(
        (k) => params.risk[k] === DEFAULT_PARAMS.risk[k],
      ),
    [params],
  );

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
    reset: () => setParams(DEFAULT_PARAMS),
    isDefault,
    solution,
    routeRisk,
    benchmarkRisks,
  };
}

export { StoreContext };
