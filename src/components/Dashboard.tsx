/**
 * Dashboard shell.
 *
 * Desktop keeps the parameter column docked beside the content so a slider and
 * the chart it moves are visible at once — the point of the site is watching the
 * two react together. Below `lg` that column becomes a collapsible drawer above
 * the content, since side-by-side stops fitting.
 */
"use client";

import { useMemo, useState } from "react";
import { StoreContext, useStoreValue, useStore, DEFAULT_PARAMS } from "@/lib/store";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { Slider, Toggle, Chip, Select } from "@/components/ui";
import { reachableTargets } from "@/engine/model";
import { MapPanel } from "@/components/panels/MapPanel";
import { RankingPanel } from "@/components/panels/RankingPanel";
import { RiskPanel } from "@/components/panels/RiskPanel";
import { AlgoPanel } from "@/components/panels/AlgoPanel";
import { QuantumPanel } from "@/components/panels/QuantumPanel";
import { AuditPanel } from "@/components/panels/AuditPanel";
import { ShowcasePanel } from "@/components/panels/ShowcasePanel";
import { V2Panel } from "@/components/panels/V2Panel";
import { meta, edgeData, ports, CRITICAL_A, fmtUsd, report40, v2Corridors } from "@/data";

const TABS = [
  { key: "map", label: "地圖", Panel: MapPanel },
  { key: "rank", label: "排行", Panel: RankingPanel },
  { key: "algo", label: "演算法", Panel: AlgoPanel },
  { key: "risk", label: "風險", Panel: RiskPanel },
  { key: "modal", label: "聯運", Panel: ShowcasePanel },
  { key: "v2", label: "30港", Panel: V2Panel },
  { key: "q40", label: "40q", Panel: QuantumPanel },
  { key: "audit", label: "稽核", Panel: AuditPanel },
] as const;

export function Dashboard() {
  const store = useStoreValue();
  return (
    <I18nProvider>
      <StoreContext.Provider value={store}>
        <Shell />
      </StoreContext.Provider>
    </I18nProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("map");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { solution, isDefault, reset, derived, dev, setDev, advancedDeviates, resetAdvanced } = useStore();
  const { locale, setLocale, t } = useI18n();
  const Panel = TABS.find((t) => t.key === tab)!.Panel;
  const cheating = solution.cheatStates > 0;

  return (
    <div className="mx-auto max-w-[1600px] overflow-x-clip">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-wide text-gold">Q-Logistics</h1>
            <p className="text-[10px] text-ink-faint">
              {t("風險感知全球供應鏈路徑優化｜Fujitsu Quantum Simulator Challenge 2025-26")}
            </p>
          </div>
          {derived && <Chip label={t("衍生情境")} tone="warn" filled />}
          {cheating && <Chip label={t("約束失效")} tone="bad" filled />}
          {!isDefault && (
            <button type="button" onClick={reset}
              className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-ink-dim transition-colors hover:border-ink-dim hover:text-ink">
              {t("重設")}
            </button>
          )}
          <div className="flex shrink-0 overflow-hidden rounded-full border border-border" role="group" aria-label="Language">
            {(["zh", "en", "ja"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLocale(l)} aria-pressed={locale === l}
                className={`px-2 py-1 text-xs font-bold transition-colors ${
                  locale === l ? "bg-gold text-bg" : "text-ink-dim hover:text-ink"
                }`}>
                {l === "zh" ? "中" : l === "en" ? "EN" : "日"}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setDev(!dev)} aria-pressed={dev}
            title={t("展開會改變實例的旋鈕;預設關閉")}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
              dev ? "border-warn bg-warn font-bold text-bg" : "border-border text-ink-dim hover:text-ink"
            }`}>
            {t("進階")}
          </button>
          <button type="button" onClick={() => setDrawerOpen((o) => !o)}
            aria-expanded={drawerOpen}
            className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-ink-dim transition-colors hover:text-ink lg:hidden">
            {t("參數")} {drawerOpen ? "▲" : "▼"}
          </button>
        </div>
        {advancedDeviates && (
          // A screenshot of a derived landscape must not travel as the published one.
          <div className="mx-3 mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-warn bg-warn/10 px-3 py-1.5">
            <span className="text-xs font-bold text-warn">{t("已偏離比賽實例")}</span>
            <span className="min-w-0 flex-1 text-[10px] text-ink-dim">
              {t("進階旋鈕已被調整,畫面上的 9 港數字不再對應報告與證據。30 港平台結果不受影響。")}
            </span>
            <button type="button" onClick={resetAdvanced}
              className="shrink-0 rounded-full border border-warn px-2.5 py-0.5 text-[10px] font-bold text-warn transition-colors hover:bg-warn hover:text-bg">
              {t("一鍵還原")}
            </button>
          </div>
        )}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label={t("分頁")}>
          {TABS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                tab === key ? "bg-gold font-bold text-bg" : "text-ink-dim hover:bg-surface hover:text-ink"
              }`}>
              {t(label)}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex flex-col lg:flex-row lg:items-start">
        <aside className={`border-b border-border px-4 py-4 lg:sticky lg:top-[92px] lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r ${drawerOpen ? "block" : "hidden lg:block"}`}>
          <ParamColumn />
        </aside>
        <main className="min-w-0 flex-1 p-4">
          <Panel />
        </main>
      </div>
      <footer className="border-t border-border px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-2 text-center">
          <p className="text-[10px] leading-relaxed text-ink-faint">
            {t("本站所有量子結果均為富士通 1024×FX700 無雜訊古典態向量模擬,非量子實機,不宣稱量子優勢。")}
          </p>
          {/* The report says what this site is for; quoting it is more honest than
              paraphrasing, so §8's own sentence stands here verbatim. */}
          <blockquote className="border-t border-border pt-2 text-[10px] leading-relaxed text-ink-faint">
            <span className="font-mono text-ink-dim">{t("報告 {s}", { s: report40.report_quote.section })}</span>
            {" — "}
            {t(report40.report_quote.zh)}
          </blockquote>
          <p className="text-[10px] text-ink-faint">
            <a href={report40.report_quote.url} target="_blank" rel="noopener noreferrer"
              className="text-quantum hover:underline">
              {report40.report_quote.url.replace("https://", "")}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

/** The parameters every panel reacts to. */
function ParamColumn() {
  const { t } = useI18n();
  const { params, setParams, toggleV2Hazard, dev } = useStore();

  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-faint">{t("情境")}</h2>

      <CorridorPicker />
      <p className="mb-4 text-[10px] leading-snug text-ink-faint">
        {t("起訖與風險套用於「30 港」分頁;其餘分頁為固定實例。")}
      </p>

      <div className="mb-4">
        <span className="mb-1.5 block text-xs text-ink">{t("風險項")}</span>
        <div className="flex flex-wrap gap-1.5">
          {SIDEBAR_HAZARDS.map(({ key, label, tone }) => {
            const on = params.v2Hazards.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleV2Hazard(key)}
                aria-pressed={on}
                className={`rounded-full border px-2.5 py-1 text-xs font-bold transition-colors ${
                  on ? tone : "border-border text-ink-dim hover:text-ink"
                }`}
              >
                {t(label)}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[10px] text-ink-faint">{t("至少保留一項")}</p>
      </div>

      <div className="mb-4 border-t border-border pt-3">
        <span className="mb-1.5 block text-xs text-ink">{t("港口封鎖")}</span>
        {params.blockedPorts.length === 0 ? (
          <p className="text-[10px] leading-snug text-ink-faint">{t("點地圖或港口列表上的港口即可封鎖")}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {params.blockedPorts.map((iso) => (
              <button key={iso} type="button"
                onClick={() => setParams((p) => ({ ...p, blockedPorts: p.blockedPorts.filter((x) => x !== iso) }))}
                className="rounded-full border border-bad px-2 py-0.5 font-mono text-[10px] font-bold text-bad transition-colors hover:bg-bad hover:text-bg">
                {iso} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      {dev && <AdvancedColumn />}
    </div>
  );
}

const SIDEBAR_HAZARDS = [
  { key: "earthquake", label: "地震", tone: "border-quantum bg-quantum text-bg" },
  { key: "typhoon", label: "颱風", tone: "border-warn bg-warn text-bg" },
  { key: "war", label: "戰爭", tone: "border-bad bg-bad text-bg" },
] as const;

/**
 * Everything that can move the app off the competition instance. Hidden until
 * asked for, because a visitor who drags these gets a screen that disagrees
 * with the report and looks like a bug rather than an experiment.
 */
function AdvancedColumn() {
  const { t } = useI18n();
  const { params, setParams, setRisk, solution, derived, advancedDeviates, resetAdvanced } = useStore();
  const cheating = solution.cheatStates > 0;

  return (
    <div className="border-t border-warn/40 pt-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-warn">{t("進階")}</h2>
        {advancedDeviates && (
          <button type="button" onClick={resetAdvanced}
            className="rounded-full border border-warn px-2 py-0.5 text-[10px] font-bold text-warn transition-colors hover:bg-warn hover:text-bg">
            {t("還原比賽值")}
          </button>
        )}
      </div>
      <p className="mb-3 text-[10px] leading-snug text-ink-faint">
        {t("這些旋鈕會產生衍生實例。30 港分頁的 33 qubit 結果是平台預先算好的,不受影響。")}
      </p>

      <Slider
        label={t("penalty_A")}
        value={params.penaltyA}
        min={0}
        max={20}
        step={0.01}
        onChange={(v) => setParams((p) => ({ ...p, penaltyA: v }))}
        hint={
          cheating
            ? derived
              ? t("有 {n} 個作弊態勝過最佳合法航線", { n: solution.cheatStates })
              : t("低於臨界 {a}:有 {n} 個作弊態勝過最佳合法航線", { a: CRITICAL_A, n: solution.cheatStates })
            : derived
              ? t("流量守恆約束強度｜臨界 A* 與出貨值僅對出貨實例校準")
              : t("流量守恆約束強度｜臨界 {a}、出貨值 {d}", { a: CRITICAL_A, d: meta.penalty_A_default.toFixed(2) })
        }
        tone={cheating ? "bad" : "gold"}
      />
      <Slider
        label={t("風險權重 λ")}
        value={params.riskLambda}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setParams((p) => ({ ...p, riskLambda: v }))}
        tone="quantum"
        hint={
          params.riskLambda === meta.risk_lambda_default
            ? t("score = 距離 + λ·目的港風險 + 市場項｜出貨值 0.40,公式與上游 build_ising_40q.py 逐邊對帳")
            : t("非出貨 λ = 衍生能量地貌;−97.4936 等已發表數字不適用")
        }
      />
      <Slider
        label={t("每日延誤成本(estimate)")}
        value={params.risk.dailyDelayCostUsd}
        min={50000}
        max={600000}
        step={1000}
        onChange={(v) => setRisk({ dailyDelayCostUsd: v })}
        format={fmtUsd}
        tone="quantum"
      />
      <p className="mt-2 border-t border-border pt-3 text-[10px] leading-relaxed text-ink-faint">
        {t("9 港實例的運算在你的瀏覽器即時執行:每次調整重掃 65,536 個量子態(~0.5 ms)。")}
      </p>
    </div>
  );
}

/**
 * Origin / destination for the 30-port tab. The platform ran exactly fifteen
 * corridors, so both lists show every measured port and a pick that has no
 * measured partner snaps the other side to a corridor that exists — the
 * sidebar can never point at an instance the platform did not run.
 */
function CorridorPicker() {
  const { t } = useI18n();
  const { params, setV2Corridor } = useStore();
  const sources = useMemo(() => Array.from(new Set(v2Corridors.map((c) => c.source))), []);
  const targets = useMemo(() => Array.from(new Set(v2Corridors.map((c) => c.target))), []);
  const has = (s: string, d: string) => v2Corridors.some((c) => c.source === s && c.target === d);
  const partners = (s: string) => v2Corridors.filter((c) => c.source === s).map((c) => c.target);
  const opt = (names: string[]) => names.map((n) => ({ value: n, label: n }));
  const pickSource = (source: string) => {
    const ok = partners(source);
    setV2Corridor(source, ok.includes(params.v2Target) ? params.v2Target : ok[0]);
  };
  const pickTarget = (target: string) => {
    if (has(params.v2Source, target)) return setV2Corridor(params.v2Source, target);
    const c = v2Corridors.find((c) => c.target === target)!;
    setV2Corridor(c.source, c.target);
  };
  return (
    <div className="mb-2">
      <Select label={t("起點")} value={params.v2Source} options={opt(sources)} onChange={pickSource} />
      <Select label={t("終點")} value={params.v2Target} options={opt(targets)} onChange={pickTarget}
        hint={t("平台實測 {n} 條走廊;選到未配對的港會自動跳到有實測的組合", { n: v2Corridors.length })} />
      <div className="mb-1 flex flex-wrap gap-1">
        {partners(params.v2Source).map((d) => (
          <button key={d} type="button" onClick={() => setV2Corridor(params.v2Source, d)}
            aria-pressed={d === params.v2Target}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
              d === params.v2Target ? "border-gold bg-gold font-bold text-bg" : "border-border text-ink-dim hover:text-ink"
            }`}>
            {params.v2Source} → {d}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Endpoint pair picker. Only pairs joined by a directed path are offered. */
function PairPicker() {
  const { params, setParams, derivedPair } = useStore();
  const { t } = useI18n();
  const sources = useMemo(
    () => edgeData.incidence_ports.filter((p) => reachableTargets(edgeData, p).length > 0),
    [],
  );
  const targets = useMemo(() => reachableTargets(edgeData, params.source), [params.source]);
  const isoByName = useMemo(() => new Map(ports.map((p) => [p.name, p.iso])), []);
  const opt = (names: string[]) =>
    names.map((n) => ({ value: n, label: `${isoByName.get(n) ?? n} · ${n}` }));

  const pickSource = (source: string) => {
    const ok = reachableTargets(edgeData, source);
    const target = ok.includes(params.target)
      ? params.target
      : ok.includes(DEFAULT_PARAMS.target)
        ? DEFAULT_PARAMS.target
        : ok[0];
    setParams((p) => ({ ...p, source, target }));
  };

  return (
    <div className="mb-4">
      <Select label={t("起點")} value={params.source} options={opt(sources)} onChange={pickSource} />
      <Select label={t("終點")} value={params.target} options={opt(targets)}
        onChange={(target) => setParams((p) => ({ ...p, target }))}
        hint={t("只列出有向路網可達的港口")} />
      {derivedPair && (
        <p className="rounded-lg border-l-[3px] border-warn bg-surface-alt p-2 text-[10px] leading-relaxed text-ink-dim">
          {t("非預設起終點為瀏覽器端衍生實例,未在比賽平台驗證;−97.4936、A* = 0.74 等已發表數字僅屬 Singapore → Los Angeles。")}
        </p>
      )}
    </div>
  );
}
