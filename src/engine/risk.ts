/**
 * Monte Carlo disaster simulation over a shipping route.
 *
 * The baked CVaR table in the notes reports four routes with mean and CVaR95
 * costs. Fitting those four means recovers the underlying model to within 0.2%:
 *
 *     mean_delay_days = w * sum(typhoon_closure_days_per_year)
 *                     + quake_impact_days * w * sum(quake_count / catalog_years)
 *                     + suez_delay_days * [route passes Suez]
 *
 * where w = horizon_days / 365 is the fraction of a year the shipment is exposed.
 * The recovered `suez_delay_days` is 7.4979 against the "7.5 天期望延誤" written
 * independently in 九港災害風險模型.md, which is the check that the structure is
 * real rather than four constants fitted to four numbers.
 *
 * Matching the means does not pin the tail down, so the distribution shapes were
 * fitted separately against the four published CVaR95 figures. Two parameters do
 * it to an RMS of 3.1% (worst route 5.2%): hazard events arrive as Poisson counts
 * over the exposure window with Gamma(shape=2) durations, while the Suez transit
 * delay is deterministic. The Hormuz scenario adds a fixed detour on top.
 */

export interface Port {
  name: string;
  iso: string;
  lat: number;
  lon: number;
  port_risk: number;
  quake_m5_300km: number;
  typhoon_closure_days_per_year: number;
  conflict_multiplier: number;
  usgs_verify_url: string;
}

export interface McModel {
  window_fraction_w: number;
  catalog_years: number;
  quake_impact_days: number;
  suez_delay_days: number;
  /** Gamma shape of a single hazard event's duration; 2 per the tail fit. */
  event_duration_shape_k: number;
  /** Mean days lost per typhoon closure event. */
  typhoon_event_mean_days: number;
  hormuz_extra_days: number;
}

export interface RiskParams {
  /** Trials to draw. 10 000 is the figure quoted in the report. */
  nScenarios: number;
  /** Exposure window; the baked table uses 30 days. */
  horizonDays: number;
  /** USD lost per day of delay. 267 000 in the report (estimate-grade). */
  dailyDelayCostUsd: number;
  /** Tail quantile, 0.95 for the CVaR95 in the report. */
  cvarQuantile: number;
  /**
   * Multiplier on the Suez transit delay. The fitted 7.4979-day mean already
   * reflects the Red Sea crisis, so 1.0 reproduces the published table; the
   * 1.43 conflict coefficient from the notes is what a *further* escalation
   * would look like, not the current baseline.
   */
  suezConflictMultiplier: number;
  /** Strait of Hormuz de-facto blockade: +12 days round the Cape. */
  hormuzBlockade: boolean;
  /** Global scale on typhoon closure days, for what-if exploration. */
  typhoonScale: number;
  /** Global scale on earthquake rates. */
  quakeScale: number;
  /**
   * Ports under an escalated typhoon scenario (ISO codes). Empty reproduces the
   * fitted baseline exactly; verify_risk pins that.
   */
  typhoonEscalatedPorts: readonly string[];
  /** Ports under an escalated earthquake scenario (ISO codes). */
  quakeEscalatedPorts: readonly string[];
  /** Extra multiplier on the escalated ports' rates, on top of the global scales. */
  hazardEscalation: number;
  seed: number;
}

export interface RiskResult {
  routeIso: string[];
  meanUsd: number;
  medianUsd: number;
  cvarUsd: number;
  varUsd: number;
  p05Usd: number;
  p95Usd: number;
  meanDelayDays: number;
  /** Sorted sample of total cost per scenario, for the distribution chart. */
  samples: Float64Array;
}

export const DEFAULT_RISK_PARAMS: RiskParams = {
  nScenarios: 10000,
  horizonDays: 30,
  dailyDelayCostUsd: 267000,
  cvarQuantile: 0.95,
  suezConflictMultiplier: 1,
  hormuzBlockade: false,
  typhoonScale: 1,
  quakeScale: 1,
  typhoonEscalatedPorts: [],
  quakeEscalatedPorts: [],
  hazardEscalation: 3,
  seed: 7,
};

/** mulberry32 — small, fast, and seeded so a given parameter set is reproducible. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Knuth for small means; normal approximation once that would loop too long. */
function poisson(rand: () => number, lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda < 30) {
    const limit = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rand();
    } while (p > limit);
    return k - 1;
  }
  const u1 = Math.max(rand(), 1e-12);
  const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand());
  return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * g));
}

/** Marsaglia-Tsang; k is small here so the rejection loop exits almost at once. */
function gamma(rand: () => number, k: number, scale: number): number {
  if (k <= 0 || scale <= 0) return 0;
  if (k < 1) return gamma(rand, k + 1, scale) * Math.pow(Math.max(rand(), 1e-12), 1 / k);
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      const u1 = Math.max(rand(), 1e-12);
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand());
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.max(rand(), 1e-12);
    if (u < 1 - 0.0331 * x * x * x * x) return d * v * scale;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
  }
}

export class RiskEngine {
  private readonly ports: ReadonlyMap<string, Port>;
  private readonly model: McModel;

  constructor(ports: readonly Port[], model: McModel) {
    this.ports = new Map(ports.map((p) => [p.iso, p]));
    this.model = model;
  }

  simulate(routeIso: readonly string[], params: RiskParams): RiskResult {
    const m = this.model;
    const w = params.horizonDays / 365;
    const rand = rng(params.seed);

    // Per-route hazard rates, expressed as expected events in the exposure window.
    let typhoonDays = 0;
    let quakeRate = 0;
    let suezDelay = 0;
    for (const iso of routeIso) {
      const p = this.ports.get(iso);
      if (!p) continue;
      const tEsc = params.typhoonEscalatedPorts.includes(iso) ? params.hazardEscalation : 1;
      const qEsc = params.quakeEscalatedPorts.includes(iso) ? params.hazardEscalation : 1;
      typhoonDays += p.typhoon_closure_days_per_year * params.typhoonScale * tEsc;
      quakeRate += (p.quake_m5_300km / m.catalog_years) * params.quakeScale * qEsc;
      if (iso === "SUZ") suezDelay = m.suez_delay_days * params.suezConflictMultiplier;
    }
    // Closure days are split into Poisson-many events of random duration; that
    // split, not the totals, is what gives the tail its shape.
    const k = m.event_duration_shape_k;
    const typhoonMeanDur = m.typhoon_event_mean_days;
    const typhoonLambda = (typhoonDays * w) / typhoonMeanDur;
    const quakeLambda = quakeRate * w;
    const hormuz = params.hormuzBlockade ? m.hormuz_extra_days : 0;

    const n = Math.max(1, params.nScenarios);
    const samples = new Float64Array(n);
    let totalDays = 0;
    let totalUsd = 0;
    for (let i = 0; i < n; i++) {
      let days = suezDelay + hormuz;
      const nTyphoon = poisson(rand, typhoonLambda);
      if (nTyphoon > 0) days += gamma(rand, k * nTyphoon, typhoonMeanDur / k);
      const nQuake = poisson(rand, quakeLambda);
      if (nQuake > 0) days += gamma(rand, k * nQuake, m.quake_impact_days / k);
      totalDays += days;
      const usd = days * params.dailyDelayCostUsd;
      totalUsd += usd;
      samples[i] = usd;
    }
    samples.sort();

    const at = (q: number) => samples[Math.min(n - 1, Math.max(0, Math.floor(q * n)))];
    const tailStart = Math.min(n - 1, Math.floor(params.cvarQuantile * n));
    let tail = 0;
    for (let i = tailStart; i < n; i++) tail += samples[i];

    return {
      routeIso: [...routeIso],
      meanUsd: totalUsd / n,
      medianUsd: at(0.5),
      cvarUsd: tail / (n - tailStart),
      varUsd: samples[tailStart],
      p05Usd: at(0.05),
      p95Usd: at(0.95),
      meanDelayDays: totalDays / n,
      samples,
    };
  }

  /** Closed-form expected delay — the quantity the baked table was fitted against. */
  expectedDelayDays(routeIso: readonly string[], params: RiskParams): number {
    const m = this.model;
    const w = params.horizonDays / 365;
    let days = params.hormuzBlockade ? m.hormuz_extra_days : 0;
    for (const iso of routeIso) {
      const p = this.ports.get(iso);
      if (!p) continue;
      const tEsc = params.typhoonEscalatedPorts.includes(iso) ? params.hazardEscalation : 1;
      const qEsc = params.quakeEscalatedPorts.includes(iso) ? params.hazardEscalation : 1;
      days += p.typhoon_closure_days_per_year * params.typhoonScale * tEsc * w;
      days += (p.quake_m5_300km / m.catalog_years) * params.quakeScale * qEsc * w * m.quake_impact_days;
      if (iso === "SUZ") days += m.suez_delay_days * params.suezConflictMultiplier;
    }
    return days;
  }
}
