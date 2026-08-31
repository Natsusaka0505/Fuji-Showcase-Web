/**
 * The 40-qubit results.
 *
 * Nothing here is recomputed — 2^40 is a 16 TiB statevector — so this panel
 * plays back platform runs and keeps their claims apart. The August QAOA
 * flagship and the Figure 2 route flip are the report's actual 40q headlines;
 * the July Grover run is kept because it failed, and showing that honestly is
 * worth more than hiding it.
 */
"use client";

import { QubitScale } from "@/components/charts";
import { Card, Stat, Chip, Route, Caveat, Prose, Mono } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { RouteFlipMap } from "@/components/RouteFlipMap";
import { useState } from "react";
import { result40, report40, solutions, fmtHours } from "@/data";

const ISO: Record<string, string> = {
  Singapore: "SIN",
  "Suez/Port Said": "SUZ",
  Rotterdam: "RTM",
  "Los Angeles": "LAX",
};

export function QuantumPanel() {
  const { t } = useI18n();
  const [warOn, setWarOn] = useState(true);
  const F = report40.flagship;
  const P = report40.flip;

  const scaleRows = [
    ["qubits", "16", `${result40.total_qubits}（16 key + 24 val）`],
    [t("態向量"), "1 MB", "16 TiB"],
    [t("執行環境"), t("你的瀏覽器"), `1024 ${t("節點")} / ${result40.mpi_processes.toLocaleString()} MPI`],
    [t("單輪耗時"), "~2 ms", fmtHours(result40.wallclock_sec)],
    [t("BBHT 輪次"), t("可調至 120"), String(result40.budget)],
    [t("結果"), t("命中 -97.4936"), t("{v}(不可行)", { v: result40.best_objective.toFixed(2) })],
  ] as const;

  const costRows = [
    [t("AutoRebase 後 native 閘"), "73,577"],
    [t("optimize_light 融合後"), "20,105"],
    [t("融合比"), "-3.66×"],
    [t("瓶頸:iQFT 全域 all-to-all 閘"), t("~100 s/閘")],
    [t("尾段速率"), "0.15 gate/s"],
  ] as const;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card
        title={t("40q QAOA 旗艦實驗")}
        subtitle={t("{s} → {tg}｜{e} 條航段｜{n} 節點｜報告 {sec}", {
          s: F.source, tg: F.target, e: String(F.edges), n: String(F.nodes), sec: F.report_section })}
        right={<Chip label={`job ${F.job}`} tone="quantum" />}
        className="xl:col-span-2"
      >
        <div className="flex flex-wrap gap-3">
          <Stat label={t("qubits")} value={String(F.qubits)} tone="gold" />
          <Stat label={t("抽樣次數")} value={F.shots.toLocaleString()} />
          <Stat label={t("抽中最佳解")} value={F.optimum_hits.toLocaleString()} unit={t("次")} tone="good" />
          <Stat label={t("佔合法樣本")} value={`${(F.share_of_feasible * 100).toFixed(1)}%`} tone="good" />
        </div>
        <Chip label={t("以上為 tier-1 純量子抽樣")} tone="quantum" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="pb-1 font-normal">{t("情境")}</th>
                <th className="pb-1 font-normal">{t("推薦航線是否改變")}</th>
                <th className="pb-1 text-right font-normal">{t("與精確解差距")}</th>
                <th className="pb-1 pl-3 text-right font-normal">job</th>
              </tr>
            </thead>
            <tbody>
              {F.scenarios.map((sc) => (
                <tr key={sc.job} className="border-t border-border">
                  <td className="py-1.5 text-xs text-ink">{t(sc.name_zh)}</td>
                  <td className="py-1.5">
                    {sc.route_changed
                      ? <Chip label={t("改變")} tone="warn" />
                      : <span className="text-[11px] text-ink-faint">{t("基準")}</span>}
                  </td>
                  <td className="py-1.5 text-right font-mono text-xs tabular-nums text-good">{sc.gap}</td>
                  <td className="py-1.5 pl-3 text-right font-mono text-[11px] text-ink-dim">{sc.job}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Prose>
          {t("四個情境的抽樣最佳解全部等於窮舉驗證的精確解,差距為 0;而推薦航線每次都隨風險改變。這說明 40 qubit 不只是「跑得動」,而是「答案正確、且會隨情境變動」。")}
        </Prose>
      </Card>

      <Card
        title={t("戰爭風險一開,航線就翻轉")}
        subtitle={t("{s} → {tg}｜{q} qubits｜報告 {f}", {
          s: P.source, tg: P.target, q: String(P.qubits), f: P.figure })}
        right={<Chip label={`job ${P.job}`} tone="quantum" />}
        className="xl:col-span-2"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setWarOn(false)} aria-pressed={!warOn}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
              !warOn ? "border-quantum bg-quantum text-bg" : "border-border text-ink-dim hover:text-ink"}`}>
            {t("戰爭風險項關閉")}
          </button>
          <button type="button" onClick={() => setWarOn(true)} aria-pressed={warOn}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
              warOn ? "border-bad bg-bad text-bg" : "border-border text-ink-dim hover:text-ink"}`}>
            {t("戰爭風險項開啟")}
          </button>
          <span className="text-[11px] text-ink-dim">
            {warOn ? t(P.on.corridor_zh) : t(P.off.corridor_zh)}
          </span>
        </div>
        <RouteFlipMap off={P.off.route} on={P.on.route} showOn={warOn}
          labels={{ off: t(P.off.label_zh), on: t(P.on.label_zh) }} />
        <div className="mt-3 flex flex-wrap gap-3">
          <Stat label={t("tier-1 純量子(戰爭開啟)")} value={P.tier1_ratio.toFixed(6)} tone="quantum" />
          <Stat label={t("tier-2 hybrid(top-512 修補)")} value={P.tier2_ratio.toFixed(6)} tone="quantum" />
        </div>
        <Prose>
          {t("戰爭風險項關閉時,最佳航線走可倫坡 / 蘇伊士走廊;開啟後整條翻到跨太平洋經洛杉磯、紐約、安特衛普。權重不是憑空設的 —— 以蘇伊士運河 2024 年通行量崩跌校準,等效 10 天延誤。這重現了 2024 年航運業真實的改道決策。")}
        </Prose>
        <Caveat>
          {t("兩個近似比皆為「戰爭風險開啟」那個實例的數值(報告 §5.2);tier-2 為 top-512 修補。平台獨立列舉的基準真值與建置期列舉一致到小數第四位(皆為 {c},full-QUBO 口徑)。", { c: P.ground_truth_cost.toFixed(4) })}
        </Caveat>
      </Card>

      <Card
        title={t("40-qubit 規模里程碑(七月 Grover,誠實保留的失敗案例)")}
        subtitle={`job 7951873｜${result40.algorithm}`}
        right={<Chip label="COMPLETED" tone="good" filled />}
      >
        <div className="flex gap-3">
          <Stat label={t("總 qubits")} value={String(result40.total_qubits)} tone="gold" />
          <Stat label={t("MPI 行程")} value={result40.mpi_processes.toLocaleString()} tone="quantum" />
          <Stat label={t("單輪牆鐘")} value={fmtHours(result40.wallclock_sec)} tone="warn" />
        </div>
        <div className="mt-4 flex gap-3">
          <Stat label="key / val" value={`${result40.n_key} / ${result40.n_val}`} />
          <Stat label={t("取樣數")} value={String(result40.shots)} />
          <Stat label={t("迭代")} value={`${result40.iters_run} / ${result40.budget}`} />
        </div>
        <Prose>
          {t("2^40 個振幅 × 16 bytes =")} <Mono>16 TiB</Mono>{" "}
          {t("狀態向量,動用 1024 節點、4096 個 MPI 行程,單輪端到端跑完花了")}{" "}
          <Mono>{fmtHours(result40.wallclock_sec)}</Mono>
          {t("。這是規模與工程管線的里程碑。")}
        </Prose>
      </Card>

      <Card
        title={t("解的品質")}
        subtitle={t("誠實對標:規模做得到,優化做不到")}
        right={<Chip label={t("不可行")} tone="bad" filled />}
      >
        <div className="flex gap-3">
          <Stat label={t("採樣最佳")} value={result40.best_objective.toFixed(2)} tone="bad" />
          <Stat label={t("已知最優")} value={solutions.optimum.toFixed(2)} tone="gold" />
          <Stat label="warm-start" value={result40.warm_start_y0.toFixed(0)} />
        </div>
        <div className="mt-4">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-faint">{t("採樣航線(未到終點)")}</div>
          <Route iso={result40.route.map((r) => ISO[r] ?? r)} />
        </div>
        <Prose>
          {t("採樣值")} <Mono>{result40.best_objective.toFixed(2)}</Mono>{" "}
          {t("比 warm-start 門檻")} <Mono>{result40.warm_start_y0}</Mono>{" "}
          {t("還差,航線只走到 Rotterdam 就斷了、選了 {n} 條邊(退化解)。原因是 GAS 靠 BBHT 多輪逐步加大 r 才收斂,", { n: result40.n_edges })}
          <Mono> budget=1 </Mono>
          {t("只做了一次極弱放大,接近亂數。40q 要逼近最優需要很多個 44 小時輪次 = 數週,不切實際。")}
        </Prose>
        <Caveat>
          {t("對外定位必須精準:40q 是規模/管線/牆鐘里程碑,不是「40q Grover 命中最優」。乾淨最優的 Grover 證據掛在 30q(-97.4936);品質看 16q、規模看 40q。")}
        </Caveat>
        <Prose>
          {t("同一個演算法在「演算法」分頁跑得動 —— 那裡是 16 qubit、真的振幅放大,毫秒級收斂。把那邊的")}
          <Mono> budget </Mono>
          {t("調到 1,就會重現這裡看到的失敗模式。")}
        </Prose>
      </Card>

      <Card title={t("記憶體隨 qubit 指數成長")} subtitle={t("每多一個 qubit,狀態向量翻倍")}>
        <QubitScale points={[16, 20, 25, 30, 35, 39, 40]} />
        <div className="mt-2 flex gap-3">
          <Stat label={t("16q 驗證規模")} value="1 MB" tone="quantum" />
          <Stat label={t("2024 冠軍")} value="39q" />
          <Stat label={t("本隊")} value="40q" tone="gold" />
        </div>
        <Prose>
          {t("Fujitsu 模擬器上限 40 qubit。2024 冠軍 TU Delft 用 39q,本隊用滿上限。")}
        </Prose>
      </Card>

      <Card title={t("16q 即時 vs 40q 播放")} subtitle={t("同一個 GAS 演算法,規模差 24 個 qubit")} className="xl:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="pb-1 font-normal">{t("項目")}</th>
                <th className="pb-1 text-right font-normal">{t("16q(本站即時)")}</th>
                <th className="pb-1 text-right font-normal">{t("40q(平台播放)")}</th>
              </tr>
            </thead>
            <tbody>
              {scaleRows.map(([k, a, b]) => (
                <tr key={k} className="border-t border-border">
                  <td className="py-1.5 text-xs text-ink-dim">{k}</td>
                  <td className="py-1.5 text-right font-mono text-xs tabular-nums text-quantum">{a}</td>
                  <td className="py-1.5 text-right font-mono text-xs tabular-nums text-gold">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Prose>
          {t("規模每加一個 qubit,態向量翻倍;16q 的 1 MB 可以在瀏覽器裡每秒重算好幾次,40q 的 16 TiB 需要 1024 個節點、單輪 44 小時。演算法沒變,能做的事完全不同 —— 這就是「規模做得到、優化做不到」的具體意思。")}
        </Prose>
      </Card>

      <Card title={t("成本剖析")} subtitle={t("逐閘 ETA 實測")}>
        <dl>
          {costRows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 border-t border-border py-1.5">
              <dt className="min-w-0 text-xs text-ink-dim">{k}</dt>
              <dd className="shrink-0 font-mono text-xs font-bold tabular-nums text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <Prose>
          {t("瓶頸是 iQFT 高位 value qubit 之間的全域閘 —— 每個要對 16 TiB 做一次 all-to-all,約 100 秒。少數這種閘吃掉大半牆鐘。這是通訊 bound,加算力或 OMP 都救不了。")}
        </Prose>
      </Card>
    </div>
  );
}
