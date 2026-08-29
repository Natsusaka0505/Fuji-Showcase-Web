/**
 * Cross-checks the TS engine against the Python precompute output.
 * Run: node --experimental-strip-types tools/verify_engine.ts
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Q9Model } from "../src/engine/model.ts";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "../src/data/q9_data");
const read = (f: string) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

const meta = read("meta.json");
const edgeData = read("edges.json");
const baked = read("solutions_16q.json");
const sweep = read("sweep_penalty.json");

const t0 = performance.now();
const model = new Q9Model(meta, edgeData);
const buildMs = performance.now() - t0;

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}${detail ? `   ${detail}` : ""}`);
  if (!ok) failures++;
};

const A = meta.penalty_A_default;
const r = model.solve({ penaltyA: A });

check("clean feasible count", r.ranking.length === baked.n_clean_feasible,
  `ts=${r.ranking.length} py=${baked.n_clean_feasible}`);
check("optimum value", Math.abs(r.bestClean!.cost - baked.optimum) < 1e-9,
  `ts=${r.bestClean!.cost.toFixed(10)} py=${baked.optimum.toFixed(10)}`);
check("optimum route", r.bestClean!.route.join("->") === baked.optimum_route.join("->"),
  r.bestClean!.route.join(" -> "));
check("global min == best clean at shipped A", r.globalMin.z === r.bestClean!.z);

for (const [i, py] of baked.clean_feasible.entries()) {
  const ts = r.ranking[i];
  if (!ts || ts.z !== py.z || Math.abs(ts.cost - py.cost) > 1e-9) {
    check(`ranking[${i}]`, false, `ts z=${ts?.z} py z=${py.z}`);
    break;
  }
}
check(`full ranking of ${baked.n_clean_feasible} routes`, failures === 0);

const st = baked.energy_stats;
check("energy min", Math.abs(r.energyStats.min - st.min) < 1e-9);
check("energy max", Math.abs(r.energyStats.max - st.max) < 1e-9);
check("energy mean", Math.abs(r.energyStats.mean - st.mean) < 1e-9);

// The penalty sweep is the real stress test: it varies A across the feasibility
// transition and compares route, feasibility and cheat-state count at every point.
let sweepBad = 0;
for (const p of sweep.points) {
  const s = model.solve({ penaltyA: p.penalty_A });
  const feasible = s.globalMin.feasible && s.globalMin.complete;
  const route = feasible ? s.globalMin.routeIso.join("->") : "";
  if (
    Math.abs(s.globalMin.cost - p.global_min) > 1e-9 ||
    feasible !== p.global_min_feasible ||
    route !== p.global_min_route.join("->") ||
    Math.abs(s.bestClean!.cost - p.best_clean) > 1e-9 ||
    s.cheatStates !== p.n_below_best_clean
  ) {
    if (sweepBad++ === 0) {
      console.log(`  FAIL  sweep A=${p.penalty_A}: ts min=${s.globalMin.cost} py=${p.global_min}` +
        ` | ts cheat=${s.cheatStates} py=${p.n_below_best_clean} | ts route=${route} py=${p.global_min_route.join("->")}`);
    }
  }
}
check(`penalty sweep, ${sweep.points.length} points`, sweepBad === 0, `${sweepBad} mismatches`);

const hist = model.histogram({ penaltyA: A });
check("histogram total", [...hist.counts].reduce((a, b) => a + b, 0) === model.size);
check("histogram vs baked", baked.histogram.counts.every((c: number, i: number) => c === hist.counts[i]));

const t1 = performance.now();
const N = 30;
for (let i = 0; i < N; i++) model.solve({ penaltyA: 0.5 + i * 0.5 });
const solveMs = (performance.now() - t1) / N;

console.log(`\n  build ${buildMs.toFixed(1)} ms (once)   solve ${solveMs.toFixed(2)} ms/param-change`);
console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
