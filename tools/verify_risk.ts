/**
 * Checks the Monte Carlo engine reproduces the published CVaR table.
 * Run: node --experimental-strip-types tools/verify_risk.ts
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { RiskEngine, DEFAULT_RISK_PARAMS } from "../src/engine/risk.ts";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "../src/data/q9_data");
const read = (f: string) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

const ports = read("ports.json");
const cvar = read("cvar.json");
const engine = new RiskEngine(ports, cvar.mc_model);
const P = { ...DEFAULT_RISK_PARAMS, nScenarios: cvar.n_scenarios, horizonDays: cvar.horizon_days,
            dailyDelayCostUsd: cvar.daily_delay_cost_usd };

let failures = 0;
const M = (v: number) => (v / 1e6).toFixed(2) + "M";

console.log("closed-form expected delay vs published mean cost");
console.log(`  ${"route".padEnd(16)} ${"published".padStart(9)} ${"model".padStart(9)} ${"err".padStart(7)}`);
for (const r of cvar.routes) {
  const days = engine.expectedDelayDays(r.route_iso, P);
  const usd = days * P.dailyDelayCostUsd;
  const err = (100 * (usd - r.mean_usd)) / r.mean_usd;
  if (Math.abs(err) > 0.5) failures++;
  console.log(`  ${r.name.padEnd(16)} ${M(r.mean_usd).padStart(9)} ${M(usd).padStart(9)} ${(err.toFixed(2) + "%").padStart(7)}`);
}

console.log("\nsimulated mean / CVaR95 vs published");
console.log(`  ${"route".padEnd(16)} ${"mean pub".padStart(9)} ${"mean sim".padStart(9)} ${"cvar pub".padStart(9)} ${"cvar sim".padStart(9)}`);
for (const r of cvar.routes) {
  const s = engine.simulate(r.route_iso, P);
  const meanErr = (100 * (s.meanUsd - r.mean_usd)) / r.mean_usd;
  const cvarErr = (100 * (s.cvarUsd - r.cvar95_usd)) / r.cvar95_usd;
  if (Math.abs(meanErr) > 2) failures++;
  if (Math.abs(cvarErr) > 6) failures++;
  console.log(`  ${r.name.padEnd(16)} ${M(r.mean_usd).padStart(9)} ${M(s.meanUsd).padStart(9)} ${M(r.cvar95_usd).padStart(9)} ${M(s.cvarUsd).padStart(9)}`);
}

// The report's headline claim: the Mediterranean route has the lowest tail risk.
const sims = cvar.routes.map((r: any) => ({ name: r.name, ...engine.simulate(r.route_iso, P) }));
const lowest = sims.reduce((a: any, b: any) => (b.cvarUsd < a.cvarUsd ? b : a));
const ok = lowest.name === "地中海線";
console.log(`\n  ${ok ? "ok  " : "FAIL"}  lowest CVaR95 route = ${lowest.name} (report: 地中海線)`);
if (!ok) failures++;

const suez = sims.find((s: any) => s.name === "蘇伊士線")!;
const ratio = lowest.cvarUsd / suez.cvarUsd;
const ratioOk = Math.abs(100 * ratio - 46) <= 3;
if (!ratioOk) failures++;
console.log(`  ${ratioOk ? "ok  " : "FAIL"}  地中海 / 蘇伊士 CVaR95 ratio = ${(100 * ratio).toFixed(0)}%  (report: 46%)`);

const t0 = performance.now();
for (const r of cvar.routes) engine.simulate(r.route_iso, P);
console.log(`\n  ${((performance.now() - t0) / 4).toFixed(1)} ms per route @ ${P.nScenarios} scenarios`);
console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
