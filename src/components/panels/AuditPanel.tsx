/**
 * Provenance.
 *
 * Every hazard number carries the query that produced it, so a judge can open
 * the USGS link and compare the count against what the model shipped with.
 */
"use client";

import { Card, Chip, Caveat, Prose, Mono } from "@/components/ui";
import { ports, audit, meta, edgeData } from "@/data";

export function AuditPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card
        title="災害資料可稽核面板"
        subtitle="每港附官方即時查詢連結,可當場比對"
        right={<Chip label="9 港" tone="quantum" />}
        className="xl:col-span-2"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="pb-1 font-normal">港</th>
                <th className="pb-1 font-normal">地震 M5.0+</th>
                <th className="pb-1 text-right font-normal">颱風天/年</th>
                <th className="pb-1 pl-4 text-right font-normal">查證</th>
              </tr>
            </thead>
            <tbody>
              {[...ports].sort((a, b) => b.quake_m5_300km - a.quake_m5_300km).map((p) => (
                <tr key={p.iso} className="border-t border-border">
                  <td className="py-1.5 font-mono text-xs font-bold text-ink">{p.iso}</td>
                  <td className="py-1.5">
                    <span className="font-mono text-sm font-bold tabular-nums text-warn">{p.quake_m5_300km}</span>
                    <span className="ml-2 text-[10px] text-ink-faint">{p.name}</span>
                  </td>
                  <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink-dim">
                    {p.typhoon_closure_days_per_year.toFixed(2)}
                  </td>
                  <td className="py-1.5 pl-4 text-right">
                    <a href={p.usgs_verify_url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-bold text-quantum hover:underline">
                      USGS →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Prose>
          查詢視窗固定 2015-01-01 → 2026-07-04、半徑 300 km、規模 M5.0+。點高雄那條連結,
          USGS 官方回傳 <Mono>243</Mono>,與模型內建數字完全一致 —— 這就是「可稽核」的意義。
        </Prose>
      </Card>

      <Card title="四大官方資料來源" subtitle="每筆已逐一驗證,可寫進論文">
        <ul>
          {audit.sources.map((s) => (
            <li key={s.id} className="border-t border-border py-2">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="group block">
                <span className="text-xs font-bold text-ink group-hover:text-quantum">{s.org}</span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-dim">{s.dataset}</span>
                <span className="mt-1 flex justify-between gap-3">
                  <span className="min-w-0 truncate text-[10px] text-quantum">{s.url}</span>
                  <span className="shrink-0 text-[10px] text-ink-faint">{s.accessed}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="模型出處" subtitle="網站內每個數字怎麼來的">
        <dl>
          {[
            ["問題實例", meta.problem_name],
            ["Pauli 項", `${meta.num_pauli_terms}（${meta.num_linear_terms} linear + ${meta.num_quadratic_terms} quadratic）`],
            ["penalty_A", meta.penalty_A_default.toFixed(6)],
            ["ising_offset", meta.ising_offset.toFixed(6)],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 border-t border-border py-1.5">
              <dt className="text-xs text-ink-dim">{k}</dt>
              <dd className="font-mono text-xs text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-2 font-mono text-[10px] leading-relaxed text-quantum">
          {meta.model_formula}
        </pre>
        <Prose>
          此式由 {meta.num_pauli_terms} 個 Pauli 項逆向還原,與平台 <Mono>cost_of_z</Mono> 的最大誤差為{" "}
          <Mono>{meta.model_verified_max_abs_err.toExponential(1)}</Mono>(浮點極限)。
          網站因此能在瀏覽器端即時重算,而不是查表播放。
        </Prose>
        <Caveat>{meta.caveat}</Caveat>
      </Card>

      <Card title="尚未驗證的推測" subtitle="誠實標註" className="xl:col-span-2">
        <p className="text-xs leading-relaxed text-ink-dim">{edgeData.hypothesis_note}</p>
        <Caveat>
          α/β/γ 權重滑桿(cost / time / geo / port / weather 分項)需要
          QLogistics_Champion_ProposalAligned.csv 才能做成真的。該檔不在 repo 內,
          目前只提供有真實資料支撐的參數。
        </Caveat>
      </Card>
    </div>
  );
}
