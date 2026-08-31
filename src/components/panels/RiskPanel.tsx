"use client";

import { TailChart, Bar } from "@/components/charts";
import { Card, Stat, Chip, Route, Slider, Toggle, Caveat, Prose, Est } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { cvar, fmtUsd, ports } from "@/data";

export function RiskPanel() {
  const { params, setRisk, routeRisk, benchmarkRisks, solution, togglePort, toggleHazardPort, dev } = useStore();
  const { t } = useI18n();
  const R = params.risk;

  const maxCvar = Math.max(...benchmarkRisks.map((r) => r.cvarUsd));
  const lowest = benchmarkRisks.reduce((a, b) => (b.cvarUsd < a.cvarUsd ? b : a));
  const suez = benchmarkRisks.find((r) => r.name === "蘇伊士線");
  const ratio = suez ? lowest.cvarUsd / suez.cvarUsd : NaN;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {routeRisk && solution.bestClean && (
        <Card
          title={t("目前航線的風險")}
          subtitle={t("{n} 次情境模擬｜{d} 天航程窗口", { n: R.nScenarios.toLocaleString(), d: R.horizonDays })}
          right={<Chip label={`CVaR${(R.cvarQuantile * 100).toFixed(0)}`} tone="bad" />}
        >
          <Route iso={solution.bestClean.routeIso} className="mb-3" />
          <TailChart samples={routeRisk.samples} cvar={routeRisk.cvarUsd} mean={routeRisk.meanUsd} />
          <div className="mt-2 flex gap-3">
            <Stat label={t("平均成本")} value={fmtUsd(routeRisk.meanUsd)} tone="gold" est />
            <Stat label="CVaR" value={fmtUsd(routeRisk.cvarUsd)} tone="bad" est />
            <Stat label={t("平均延誤")} value={routeRisk.meanDelayDays.toFixed(2)} unit={t("天")} />
          </div>
          <Prose>
            {t("紅色是最壞 {p}% 的情境。CVaR 回答的不是「平均要花多少」,而是「運氣最差時我會慘到什麼程度」—— 壓垮船公司的通常是極端事件,不是平均。", { p: ((1 - R.cvarQuantile) * 100).toFixed(0) })}
          </Prose>
        </Card>
      )}

      <Card
        title={t("四條航線對比")}
        subtitle={t("同一組參數下即時重算")}
        right={<Chip label={t("最低 {name}", { name: t(lowest.name) })} tone="good" />}
      >
        {benchmarkRisks.map((r) => (
          <Bar
            key={r.name}
            label={t(r.name)}
            value={r.cvarUsd}
            max={maxCvar}
            color={r.name === lowest.name ? "var(--color-good)" : "var(--color-bad)"}
            caption={fmtUsd(r.cvarUsd)}
            highlight={r.name === lowest.name}
          />
        ))}
        <div className="mt-3 flex gap-3">
          <Stat label={t("最低 / 蘇伊士")} value={`${(ratio * 100).toFixed(0)}%`} tone="good" />
          <Stat label={t("風險降幅")} value={`${((1 - ratio) * 100).toFixed(0)}%`} tone="good" />
        </div>
        <Prose>
          {t("加入真實災害資料後,避開蘇伊士的地中海線尾部風險最低。真實資料直接改變了航線的風險排序 —— 這正是「災害感知最佳化」的商業價值。")}
        </Prose>
      </Card>

      <Card
        title={t("成本怎麼算出來的")}
        subtitle={t("所有金額皆為 estimate 級,非官方統計")}
        right={<Chip label="estimate" tone="warn" />}
        className="xl:col-span-2"
      >
        <ol className="space-y-2">
          {[
            [t("船型基準"), t("20,000 TEU 貨櫃輪")],
            [t("租船營運"), t("約 每日 15 萬美元")],
            [t("貨物庫存持有"), t("約 每日 11 萬美元")],
            [t("合計 每延誤一天"), t("約 26.7 萬美元 — 本站滑桿預設值")],
            [t("來源"), t("Drewry / Alphaliner 產業基準推算")],
          ].map(([k, v], i, arr) => (
            <li key={k} className={`flex items-baseline justify-between gap-3 ${i > 0 ? "border-t border-border pt-2" : ""}`}>
              <span className="text-xs text-ink-dim">{k}</span>
              <span className={`shrink-0 font-mono text-xs tabular-nums ${i === arr.length - 2 ? "font-bold text-gold" : "text-ink"}`}>
                {v}
              </span>
            </li>
          ))}
        </ol>
        <Prose>
          {t("模型只把「延誤天數」換算成金額,不含運價、保費、違約金或商譽損失。荷莫茲封鎖的「繞好望角 +12 天」同樣是情境假設,不是觀測值 —— 兩者都標")}
          <Est />
          {t("。跨實例的量子成本(cost)是 full-QUBO 能量,與這裡的美金無關、不可換算。")}
        </Prose>
      </Card>

      <Card title={t("風險參數")} subtitle={t("調整後上方圖表即時更新")} className="xl:col-span-2">
        {dev && (
          <div className="grid gap-x-8 md:grid-cols-2 xl:grid-cols-3">
            <Slider label={t("每日延誤成本(estimate)")} value={R.dailyDelayCostUsd} min={50000} max={600000} step={1000}
              onChange={(v) => setRisk({ dailyDelayCostUsd: v })} format={fmtUsd}
              hint={t("20,000 TEU 貨櫃輪;Drewry/Alphaliner 推算,estimate 級")} />
            <Slider label={t("航程窗口")} value={R.horizonDays} min={7} max={90} step={1}
              onChange={(v) => setRisk({ horizonDays: v })} format={(v) => t("{n} 天", { n: v.toFixed(0) })}
              hint={t("暴露在災害風險下的時間長度")} />
            <Slider label={t("CVaR 分位")} value={R.cvarQuantile} min={0.8} max={0.99} step={0.01}
              onChange={(v) => setRisk({ cvarQuantile: v })} format={(v) => `${(v * 100).toFixed(0)}%`}
              hint={t("看最壞的百分之幾")} tone="bad" />
            <Slider label={t("蘇伊士衝突係數")} value={R.suezConflictMultiplier} min={1} max={3} step={0.01}
              onChange={(v) => setRisk({ suezConflictMultiplier: v })} format={(v) => `${v.toFixed(2)}×`}
              hint={t("1.00 = 現況(已含紅海危機);1.43 = 進一步升級")} tone="warn" />
            <Slider label={t("颱風強度")} value={R.typhoonScale} min={0} max={3} step={0.05}
              onChange={(v) => setRisk({ typhoonScale: v })} format={(v) => `${v.toFixed(2)}×`}
              hint={t("JMA 關港天數的縮放")} />
            <Slider label={t("地震頻率")} value={R.quakeScale} min={0} max={3} step={0.05}
              onChange={(v) => setRisk({ quakeScale: v })} format={(v) => `${v.toFixed(2)}×`}
              hint={t("USGS 地震年率的縮放")} />
            <Slider label={t("情境數")} value={R.nScenarios} min={1000} max={50000} step={1000}
              onChange={(v) => setRisk({ nScenarios: v })} format={(v) => v.toLocaleString()}
              hint={t("越多越穩定;50,000 仍在 10 ms 內")} tone="quantum" />
            <div className="self-end">
              <Toggle label={t("荷莫茲海峽封鎖")} value={R.hormuzBlockade}
                onChange={(v) => setRisk({ hormuzBlockade: v })}
                hint={t("繞好望角 +12 天(estimate);2026-02 事實封鎖情境")} />
            </div>
          </div>
        )}
        {!dev && (
          <p className="text-[11px] leading-relaxed text-ink-dim">{t("風險倍率、情境數與 CVaR 分位屬進階旋鈕,預設鎖定在報告設定。開啟頁首「進階」即可調整。")}</p>
        )}
        <Caveat>
          {t("模型結構由報告的四條航線 CVaR 表回歸還原:平均延誤誤差 0.15%,尾部形狀以 2 個參數擬合、RMS {r}%。每日延誤成本為 estimate 級,非官方統計。", { r: cvar.mc_model.tail_fit_rms_err_pct })}
        </Caveat>
      </Card>

      <Card
        title={t("災害情境")}
        subtitle={t("圈選受災港口:封鎖直接改變可行航線,颱風/地震改變風險排序")}
        className="xl:col-span-2"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="pb-1 font-normal">{t("港")}</th>
                <th className="pb-1 text-center font-normal">{t("颱風")}</th>
                <th className="pb-1 text-center font-normal">{t("地震")}</th>
                <th className="pb-1 text-center font-normal">{t("封鎖(戰爭)")}</th>
              </tr>
            </thead>
            <tbody>
              {ports.map((p) => {
                const typhoonOn = R.typhoonEscalatedPorts.includes(p.iso);
                const quakeOn = R.quakeEscalatedPorts.includes(p.iso);
                const blocked = params.blockedPorts.includes(p.iso);
                return (
                  <tr key={p.iso} className="border-t border-border">
                    <td className="py-1.5">
                      <span className="font-mono text-xs font-bold text-ink">{p.iso}</span>
                      <span className="ml-2 text-[10px] text-ink-faint">{p.name}</span>
                    </td>
                    <td className="py-1.5 text-center">
                      <button type="button" onClick={() => toggleHazardPort("typhoon", p.iso)}
                        aria-pressed={typhoonOn}
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold transition-colors ${
                          typhoonOn ? "border-warn bg-warn text-bg" : "border-border text-ink-faint hover:text-ink"
                        }`}>
                        {typhoonOn ? `${R.hazardEscalation.toFixed(1)}×` : "—"}
                      </button>
                    </td>
                    <td className="py-1.5 text-center">
                      {p.quake_m5_300km === 0 ? (
                        <span className="text-[10px] text-ink-faint" title={t("目錄期內無 M5+ 地震,無基線可升級")}>{t("無基線")}</span>
                      ) : (
                        <button type="button" onClick={() => toggleHazardPort("quake", p.iso)}
                          aria-pressed={quakeOn}
                          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold transition-colors ${
                            quakeOn ? "border-quantum bg-quantum text-bg" : "border-border text-ink-faint hover:text-ink"
                          }`}>
                          {quakeOn ? `${R.hazardEscalation.toFixed(1)}×` : "—"}
                        </button>
                      )}
                    </td>
                    <td className="py-1.5 text-center">
                      <button type="button" onClick={() => togglePort(p.iso)}
                        aria-pressed={blocked}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors ${
                          blocked ? "border-bad bg-bad text-bg" : "border-border text-ink-faint hover:text-ink"
                        }`}>
                        {blocked ? t("封鎖中") : "—"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {dev && (
          <div className="mt-3 md:max-w-sm">
            <Slider label={t("災害升級倍率")} value={R.hazardEscalation} min={1} max={10} step={0.5}
              onChange={(v) => setRisk({ hazardEscalation: v })} format={(v) => `${v.toFixed(1)}×`}
              hint={t("套用在被圈選港口的颱風/地震年率上,與全域縮放相乘;1.0× 即回到基線")} tone="warn" />
          </div>
        )}
        <Prose>
          {t("封鎖作用在 QUBO 可行集,最佳航線即時換路(與「地圖」分頁的點港封鎖同一件事);颱風與地震進蒙地卡羅,到「排行」分頁切「風險 CVaR」看災害如何改寫路線排序。基線災害率(JMA/USGS)永遠生效 —— 這裡圈的是「進一步升級」情境。")}
        </Prose>
      </Card>
    </div>
  );
}
