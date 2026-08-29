/**
 * Checks the browser-side solvers against the known 16q optimum.
 * Run: node --experimental-strip-types tools/verify_algos.ts
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Q9Model } from "../src/engine/model.ts";
import { runQaoa, runSa, DEFAULT_QAOA_PARAMS, DEFAULT_SA_PARAMS } from "../src/engine/qaoa.ts";
import { runGas, amplificationCurve, DEFAULT_GAS_PARAMS } from "../src/engine/grover.ts";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "../src/data/q9_data");
const read = (f: string) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

const meta = read("meta.json");
const baked = read("solutions_16q.json");
const model = new Q9Model(meta, read("edges.json"));
const E = model.energies({ penaltyA: meta.penalty_A_default });
const OPT = baked.optimum;

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}${detail ? `   ${detail}` : ""}`);
  if (!ok) failures++;
};

console.log(`optimum = ${OPT.toFixed(6)}   states = ${model.size}\n`);

// --- Grover: amplification must actually concentrate probability ------------
console.log("Grover amplitude amplification");
const y = -96;
// Enough rotations to pass the peak and come back down again.
const curve = amplificationCurve(E, y, 140);
const peak = Math.max(...curve.probs);
const peakAt = curve.probs.indexOf(peak);
console.log(`  threshold ${y}: ${curve.nMarked} marked of ${model.size}` +
  `   p0=${curve.probs[0].toExponential(2)}  peak=${peak.toFixed(4)} @ r=${peakAt}` +
  `   theory r=${curve.optimalR}`);
check("amplification raises marked probability", peak > curve.probs[0] * 10);
check("peak near the sqrt(N/M) estimate", Math.abs(peakAt - curve.optimalR) <= Math.max(2, curve.optimalR * 0.35),
  `measured ${peakAt} vs theory ${curve.optimalR}`);
check("probability is conserved (<=1)", peak <= 1.0000001);
// Over-rotation must be visible: probability comes back down past the peak.
check("over-rotation degrades the peak", curve.probs[Math.min(curve.probs.length - 1, peakAt * 2)] < peak * 0.6);

// A tighter threshold marks fewer states and needs more rotations.
const tight = amplificationCurve(E, -97.4, 200);
console.log(`  threshold -97.4: ${tight.nMarked} marked   theory r=${tight.optimalR}` +
  `   peak=${Math.max(...tight.probs).toFixed(4)}`);
check("tighter threshold needs more rotations", tight.optimalR > curve.optimalR);

// --- GAS end to end ---------------------------------------------------------
console.log("\nGrover adaptive search (BBHT)");
let gasHits = 0;
const RUNS = 8;
for (let s = 0; s < RUNS; s++) {
  const r = runGas(E, { ...DEFAULT_GAS_PARAMS, seed: s + 1 });
  if (r.hitOptimum) gasHits++;
}
const oneRun = runGas(E, { ...DEFAULT_GAS_PARAMS, seed: 1 });
console.log(`  best=${oneRun.bestEnergy.toFixed(4)}  rotations=${oneRun.totalRotations}` +
  `  trail=${oneRun.trail.length}  hit ${gasHits}/${RUNS} seeds`);
check("GAS reaches the optimum on most seeds", gasHits >= RUNS * 0.6, `${gasHits}/${RUNS}`);
check("GAS never reports below the true optimum", oneRun.bestEnergy >= OPT - 1e-9);
check("threshold decreases monotonically", oneRun.trail.every((s, i, a) => i === 0 || s.y <= a[i - 1].y + 1e-9));

// Warm start at -96, as the platform ran it.
const warm = runGas(E, { ...DEFAULT_GAS_PARAMS, warmStartY0: -96, seed: 3 });
console.log(`  warm-start -96: best=${warm.bestEnergy.toFixed(4)}  hit=${warm.hitOptimum}`);
check("warm start never returns worse than its threshold", warm.bestEnergy <= -96 + 1e-9 || !warm.trail.some((s) => s.improved));

// --- QAOA -------------------------------------------------------------------
console.log("\nQAOA");
for (const p of [1, 2, 3]) {
  const r = runQaoa(E, meta.n_qubits, { ...DEFAULT_QAOA_PARAMS, p, maxIter: 60 });
  const first = r.convergence[0];
  const last = r.convergence[r.convergence.length - 1];
  console.log(`  p=${p}: <C> ${first.toFixed(2)} -> ${last.toFixed(2)}` +
    `   sampled=${r.bestSampledEnergy.toFixed(4)}  P(opt)=${r.optimumProbability.toExponential(2)}` +
    `   evals=${r.evaluations}`);
  check(`p=${p} energy decreases`, last < first, `${first.toFixed(2)} -> ${last.toFixed(2)}`);
  check(`p=${p} expectation above the true minimum`, last >= OPT - 1e-6);
  check(`p=${p} convergence is monotone`, r.convergence.every((v, i, a) => i === 0 || v <= a[i - 1] + 1e-9));
  check(`p=${p} beats the uniform average`, last < 0);
}

// --- SA ---------------------------------------------------------------------
console.log("\nSimulated annealing");
const sa = runSa(E, meta.n_qubits, DEFAULT_SA_PARAMS);
console.log(`  best=${sa.bestEnergy.toFixed(4)}  ratio=${(sa.bestEnergy / OPT).toFixed(4)}` +
  `  accepted=${sa.accepted}/${DEFAULT_SA_PARAMS.iterations}`);
check("SA gets within 2% of the optimum", sa.bestEnergy <= OPT * 0.98, sa.bestEnergy.toFixed(4));
check("SA never beats the true optimum", sa.bestEnergy >= OPT - 1e-9);
check("SA trace is non-increasing", sa.trace.every((v, i, a) => i === 0 || v <= a[i - 1] + 1e-9));

// --- Timing -----------------------------------------------------------------
console.log("\nTiming");
for (const [name, fn] of [
  ["QAOA p=2, 60 iters", () => runQaoa(E, meta.n_qubits, { ...DEFAULT_QAOA_PARAMS, p: 2, maxIter: 60 })],
  ["GAS budget=60", () => runGas(E, { ...DEFAULT_GAS_PARAMS })],
  ["SA 4000 iters", () => runSa(E, meta.n_qubits, DEFAULT_SA_PARAMS)],
] as const) {
  const t = performance.now();
  fn();
  console.log(`  ${name.padEnd(22)} ${(performance.now() - t).toFixed(1)} ms`);
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
