/**
 * Sanity gate for the v2 platform campaign data (app_data_v2.json).
 * Run: node --experimental-strip-types tools/verify_v2.ts
 *
 * No recomputation is possible — the QUBO inputs stayed on the platform — so
 * this checks internal consistency: complete corridor×hazard grid, routes that
 * start/end where they claim and only visit known ports, sorted classical
 * rankings, ratios in a sane band, and one evidence job per instance.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "../src/data/q9_data");
const v2 = JSON.parse(readFileSync(join(DATA, "app_data_v2.json"), "utf8"));

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}${detail ? `   ${detail}` : ""}`);
  if (!ok) failures++;
};

const ports = new Set(Object.keys(v2.ports));
check("30 ports", ports.size === 30);

// The corridor count grows as more scans land; the invariant is the complete
// 7-hazard-set grid per corridor, not a fixed corridor count.
const grid = new Map<string, Set<string>>();
for (const i of v2.instances) {
  const pair = `${i.source}->${i.target}`;
  if (!grid.has(pair)) grid.set(pair, new Set());
  grid.get(pair)!.add([...i.hazards].sort().join("+"));
}
check(`every corridor carries all 7 hazard sets (${grid.size} corridors)`,
  [...grid.values()].every((s) => s.size === 7));
check("instance count = corridors × 7", v2.instances.length === grid.size * 7);

const routeOk = (r: string[] | null, src: string, tgt: string) =>
  r === null || (r.length >= 2 && r[0] === src && r[r.length - 1] === tgt && r.every((p) => ports.has(p)));

let bad = 0;
let ratioBad = 0;
let sortBad = 0;
let zeroBad = 0;
const jobs = new Set<string>();
for (const i of v2.instances) {
  jobs.add(i.evidence_job);
  for (const c of i.classical_top5) if (!routeOk(c.route, i.source, i.target)) bad++;
  if (!routeOk(i.quantum.tier1_route, i.source, i.target)) bad++;
  if (!routeOk(i.quantum.tier2_route, i.source, i.target)) bad++;
  for (const q of i.quantum.q_routes) if (!routeOk(q.route, i.source, i.target)) bad++;
  for (let k = 1; k < i.classical_top5.length; k++) {
    if (i.classical_top5[k].cost < i.classical_top5[k - 1].cost - 1e-9) sortBad++;
  }
  for (const r of [i.quantum.tier1_ratio, i.quantum.tier2_ratio]) {
    if (r !== null && (r < 0.99 || r > 1.0 + 1e-9)) ratioBad++;
  }
  const fr = i.quantum.feasible_rate;
  if (fr < 0 || fr > 0.01) ratioBad++;
  if ((fr === 0) !== (i.quantum.q_routes.length === 0)) zeroBad++;
}
check("every route starts/ends correctly and visits only known ports", bad === 0, `${bad} bad`);
check("classical_top5 sorted ascending in every instance", sortBad === 0);
check("tier ratios in (0.99, 1] and feasible_rate in [0, 1%]", ratioBad === 0);
check("feasible_rate 0 ⟺ empty quantum route list", zeroBad === 0);
check("one unique evidence job per instance", jobs.size === v2.instances.length);

const zeros = v2.instances.filter((i: { quantum: { feasible_rate: number } }) => i.quantum.feasible_rate === 0).length;
console.log(`        note: ${zeros} instances sampled no feasible state (shown honestly in the UI)`);

console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
