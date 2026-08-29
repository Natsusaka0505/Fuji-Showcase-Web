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
import { meta, edgeData, ports, CRITICAL_A, fmtUsd } from "@/data";

const TABS = [
  { key: "map", label: "地圖", Panel: MapPanel },
  { key: "rank", label: "排行", Panel: RankingPanel },
  { key: "algo", label: "演算法", Panel: AlgoPanel },
  { key: "risk", label: "風險", Panel: RiskPanel },
  { key: "modal", label: "聯運", Panel: ShowcasePanel },
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
  const { solution, isDefault, reset, derived } = useStore();
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
          <button type="button" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            aria-label={locale === "zh" ? "Switch to English" : "切換為中文"}
            className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-bold text-ink-dim transition-colors hover:border-ink-dim hover:text-ink">
            {locale === "zh" ? "EN" : "中"}
          </button>
          <button type="button" onClick={() => setDrawerOpen((o) => !o)}
            aria-expanded={drawerOpen}
            className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-ink-dim transition-colors hover:text-ink lg:hidden">
            {t("參數")} {drawerOpen ? "▲" : "▼"}
          </button>
        </div>
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
    </div>
  );
}

/** The parameters every panel reacts to. */
function ParamColumn() {
  const { params, setParams, setRisk, solution, derived } = useStore();
  const { t } = useI18n();
  const cheating = solution.cheatStates > 0;

  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-faint">{t("共用參數")}</h2>
      <PairPicker />
      <Slider
        label="penalty_A"
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
        label={t("每日延誤成本")}
        value={params.risk.dailyDelayCostUsd}
        min={50000}
        max={600000}
        step={1000}
        onChange={(v) => setRisk({ dailyDelayCostUsd: v })}
        format={fmtUsd}
        tone="quantum"
      />
      <Toggle
        label={t("荷莫茲海峽封鎖")}
        value={params.risk.hormuzBlockade}
        onChange={(v) => setRisk({ hormuzBlockade: v })}
        hint={t("繞好望角 +12 天")}
      />
      {params.blockedPorts.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-ink-faint">
            {t("已封鎖 {n} 港", { n: params.blockedPorts.length })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {params.blockedPorts.map((iso) => (
              <button key={iso} type="button"
                onClick={() => setParams((p) => ({ ...p, blockedPorts: p.blockedPorts.filter((x) => x !== iso) }))}
                className="rounded-full border border-bad px-2 py-0.5 font-mono text-[10px] font-bold text-bad transition-colors hover:bg-bad hover:text-bg">
                {iso} ✕
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-ink-faint">
        {t("全部運算在你的瀏覽器即時執行:每次調整重掃 65,536 個量子態(~0.5 ms)並重跑 10,000 次蒙地卡羅情境(~2 ms)。")}
      </p>
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
