/**
 * Checks the 0.9281 multimodal showcase data against the notebook outputs.
 * Run: node --experimental-strip-types tools/verify_showcase.ts
 *
 * The edges and rank totals were transcribed by hand from the embedded outputs
 * of q9_benchmark_champion_colab_ok.ipynb (cells 12/14), so this script guards
 * the two claims the panel makes: components sum to the score, and the default
 * weighting reproduces the published combination ranking exactly.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "../src/data/q9_data");
const sc = JSON.parse(readFileSync(join(DATA, "showcase.json"), "utf8"));

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}${detail ? `   ${detail}` : ""}`);
  if (!ok) failures++;
};

// 1. Additive decomposition: the 6-decimal display truncation bounds the error.
let worst = 0;
for (const e of sc.edges) {
  const sum = e.alpha + e.beta + e.gamma1 + e.gamma2 + e.gamma3;
  worst = Math.max(worst, Math.abs(sum - e.score));
}
// 6 values each truncated to 6 decimals -> up to 6 × 5e-7 = 3e-6 of rounding.
check(`components sum to edge_score on all ${sc.edges.length} edges`, worst <= 3e-6,
  `worst |Σ−score| = ${worst.toExponential(1)}`);

// 2. Default weights reproduce the published combination ranking.
const [pairA, pairB] = sc.pairs;
const legA = sc.edges.filter((e: any) => e.pair === pairA);
const legB = sc.edges.filter((e: any) => e.pair === pairB);
const combos = legA.flatMap((a: any) => legB.map((b: any) => ({
  modes: [a.mode, b.mode] as const,
  total: a.score + b.score,
}))).sort((x: any, y: any) => x.total - y.total);

check("4×4 modes give 16 combinations", combos.length === sc.instance.n_combinations);

let rankWorst = 0;
for (const [i, pub] of sc.published_rank_totals.entries()) {
  rankWorst = Math.max(rankWorst, Math.abs(combos[i].total - pub));
}
check(`top ${sc.published_rank_totals.length} totals match the published ranking`, rankWorst <= 3e-6,
  `worst diff = ${rankWorst.toExponential(1)}`);

check("rank 1 is the published optimum 0.928146",
  Math.abs(combos[0].total - sc.published_optimum) <= 2e-6,
  `${combos[0].modes.join(" + ")} = ${combos[0].total.toFixed(6)}`);
check("rank 1 modes are Road + Rail",
  combos[0].modes[0] === "Road" && combos[0].modes[1] === "Rail");

// 3. Scenario sanity: shocks move the optimum up and off the base route.
const base = sc.scenarios.find((s: any) => s.name === "base");
for (const s of sc.scenarios) {
  if (s.name === "base") continue;
  check(`${s.name} optimum above base`, s.best_objective > base.best_objective,
    `${base.best_objective} -> ${s.best_objective}`);
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
