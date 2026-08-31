/**
 * i18n completeness gate.
 *
 * Scans every component for t("...") keys and collects the display strings the
 * data JSONs carry, then asserts: each key has an EN entry, every {placeholder}
 * survives translation, and no dictionary entry is orphaned.
 * Run: node --experimental-strip-types tools/verify_i18n.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { EN } from "../src/lib/i18n-en.ts";
import { JA } from "../src/lib/i18n-ja.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src/data/q9_data");
const read = (f: string) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

const keys = new Set<string>();
for (const f of walk(join(ROOT, "src/components"))) {
  for (const m of readFileSync(f, "utf8").matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) {
    keys.add(m[1]);
  }
}
// Strings rendered through t(variable): tab labels, component labels, data text.
for (const k of ["地圖", "排行", "演算法", "風險", "聯運", "30港", "40q", "稽核"]) keys.add(k);
for (const k of ["α 成本", "β 時間", "γ₁ 地緣", "γ₂ 港口", "γ₃ 天氣"]) keys.add(k);
// report_40q.json ships display strings rendered through t(variable).
const rep = read("report_40q.json");
for (const sc of rep.flagship.scenarios) keys.add(sc.name_zh);
for (const side of [rep.flip.off, rep.flip.on]) {
  keys.add(side.label_zh);
  keys.add(side.corridor_zh);
}
const cvar = read("cvar.json");
for (const r of cvar.routes) keys.add(r.name);
const algo = read("algo_compare.json");
for (const r of algo.rows) {
  keys.add(r.algo);
  if (r.note) keys.add(r.note);
}
keys.add(read("meta.json").caveat);
for (const s of read("showcase.json").scenarios) keys.add(s.label);

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}${detail ? `   ${detail}` : ""}`);
  if (!ok) failures++;
};

for (const [name, dict] of [["EN", EN], ["JA", JA]] as const) {
  const missing = [...keys].filter((k) => !(k in dict));
  check(`every used key has a ${name} entry (${keys.size} keys)`, missing.length === 0);
  for (const k of missing) console.log(`        missing: ${k.slice(0, 60)}`);

  const phBad: string[] = [];
  for (const k of keys) {
    const tr = dict[k];
    if (!tr) continue;
    for (const m of k.matchAll(/\{(\w+)\}/g)) {
      if (!tr.includes(`{${m[1]}}`)) phBad.push(`${m[0]} lost in: ${k.slice(0, 40)}`);
    }
  }
  check(`every {placeholder} survives ${name} translation`, phBad.length === 0);
  for (const p of phBad) console.log(`        ${p}`);

  const orphans = Object.keys(dict).filter((k) => !keys.has(k));
  check(`no orphaned ${name} entries`, orphans.length === 0, `${orphans.length} orphans`);
  for (const o of orphans) console.log(`        orphan: ${o.slice(0, 60)}`);
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
