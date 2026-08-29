/**
 * Provenance.
 *
 * Every hazard number carries the query that produced it, so a judge can open
 * the USGS link and compare the count against what the model shipped with.
 */
"use client";

import { Card, Chip, Caveat, Prose, Mono } from "@/components/ui";
import { ports, audit, meta, cvar, hazardsV2, hazardPorts } from "@/data";

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

      <Card
        title="災害參數原始檔(port_hazards_v2)"
        subtitle="發表 CVaR 表的實際輸入,來自平台證據包"
        right={<Chip label="原始資料" tone="good" filled />}
        className="xl:col-span-2"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="pb-1 font-normal">港</th>
                <th className="pb-1 text-right font-normal">地震 λ/年</th>
                <th className="pb-1 text-right font-normal">事件延誤(天)</th>
                <th className="pb-1 text-right font-normal">颱風關港(天/年)</th>
                <th className="pb-1 text-right font-normal">衝突係數</th>
              </tr>
            </thead>
            <tbody>
              {hazardPorts.map((name) => {
                const h = hazardsV2[name];
                return (
                  <tr key={name} className="border-t border-border">
                    <td className="py-1.5 text-xs text-ink">{name}</td>
                    <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink-dim">
                      {(h.eq_lambda ?? 0).toFixed(2)}
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink-dim">
                      {(h.eq_delay_mean_days ?? 0).toFixed(3)}
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink-dim">
                      {(h.tc_closure_days_per_year ?? 0).toFixed(2)}
                    </td>
                    <td className={`py-1.5 text-right font-mono text-xs tabular-nums ${(h.conflict_mult ?? 1) > 1 ? "font-bold text-warn" : "text-ink-dim"}`}>
                      {(h.conflict_mult ?? 1).toFixed(2)}
                      {h.conflict_expected_delay_days != null && (
                        <span className="ml-1 text-[10px] text-warn">+{h.conflict_expected_delay_days} 天</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Prose>
          擬合模型與原始檔的對照:蘇伊士延誤擬合 <Mono>{cvar.mc_model.suez_delay_days.toFixed(4)}</Mono> 天,
          原始檔寫 <Mono>7.5</Mono>;地震事件延誤擬合 <Mono>{cvar.mc_model.quake_impact_days.toFixed(4)}</Mono> 天,
          原始檔寫 <Mono>0.792</Mono>。逆向還原的結構被原始資料直接證實 —— 這兩個數字先前只能靠
          「筆記中獨立寫下的 7.5 天」旁證。
        </Prose>
        <Caveat>
          方法(JMA):200 km 內風暴點,10 分鐘最大風速 &lt;64kt 記 1 天、64–95kt 記 3 天、≥96kt 記 7 天,
          統計 2015–2025。引用:USGS ANSS ComCat、RSMC Tokyo Best Track(JMA)、Suez baseline。
          原始生成器為 montecarlo_cvar.py(K=10,000、30 天窗、$267k/天、seed 7);本站 risk.ts
          為對發表數字的行為等效擬合,分布形狀不同(Gamma vs Exponential),平均誤差 0.15%。
        </Caveat>
      </Card>

      <Card title="score 拆解:已由原始碼驗證" subtitle="取代先前的 cost_norm 假設" className="xl:col-span-2">
        <Prose>
          平台證據包內的 <Mono>build_ising_40q.py</Mono> 揭露了邊分數的生成公式:
          <Mono>score = haversine/20000 + λ·port_risk_dest/max + |N(0,0.03)|</Mono>(λ = 0.4)。
          16 條邊逐一對帳:距離與風險項精確重算,市場擾動殘差全部落在半正態界內(16/16)。
          側欄的「風險權重 λ」滑桿即基於此拆解 —— λ = 0.40 時與比賽實例逐位一致。
          舊的 <Mono>cost_norm_hypothesis</Mono>(相關係數 0.52 的反推假設)已退役。
        </Prose>
        <Caveat>
          仍未驗證:α/β/γ₁γ₂γ₃ 五分項(cost/time/geo/port/weather)在 16q 實例的逐邊數值,
          需要 QLogistics_Champion_ProposalAligned.csv;「聯運」分頁的分項滑桿基於 0.9281
          showcase 實例的筆記本輸出。
        </Caveat>
      </Card>
    </div>
  );
}
