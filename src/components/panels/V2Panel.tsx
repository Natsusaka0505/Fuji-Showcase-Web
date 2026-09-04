/**
 * The v2 platform campaign: 30 ports, 15 corridors × 7 hazard sets, 105 jobs
 * run on the Fujitsu 1024× FX700 cluster (30–33 qubits each).
 *
 * Everything on this tab is a replay of platform results — the QUBO inputs
 * never left the cluster, so nothing recomputes in the browser. Per the data's
 * own convention, costs are full-QUBO energies with per-instance offsets and
 * must never be compared across instances; ratios are always against the same
 * instance's classical optimum.
 */
"use client";

import { useMemo } from "react";
import { Card, Stat, Chip, Caveat, Prose, Mono } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { v2, type V2Instance } from "@/data";
import { LandLayer } from "@/components/LandLayer";
import { placeLabels, arcPath } from "@/components/labelLayout";

const MAP_W = 360;
const MAP_H = 190;
const PAD = 12;
const LAT0 = 62;
const LAT1 = -12;

const project = (lat: number, lon: number) => ({
  x: PAD + ((lon + 180) / 360) * (MAP_W - 2 * PAD),
  y: PAD + ((LAT0 - lat) / (LAT0 - LAT1)) * (MAP_H - 2 * PAD),
});

type Pt = { x: number; y: number };

/** Split a leg crossing the antimeridian so it wraps instead of sweeping back. */
function legs(a: Pt, b: Pt): [Pt, Pt][] {
  const span = MAP_W - 2 * PAD;
  if (Math.abs(b.x - a.x) <= span / 2) return [[a, b]];
  const goingRight = a.x > b.x;
  const dx = goingRight ? MAP_W - a.x + b.x : a.x + (MAP_W - b.x);
  const t = (goingRight ? MAP_W - a.x : a.x) / dx;
  const yMid = a.y + (b.y - a.y) * t;
  return goingRight
    ? [[a, { x: MAP_W, y: yMid }], [{ x: 0, y: yMid }, b]]
    : [[a, { x: 0, y: yMid }], [{ x: MAP_W, y: yMid }, b]];
}

const SHORT: Record<string, string> = {
  "New York/New Jersey": "NY/NJ",
  "Ningbo-Zhoushan": "Ningbo",
  "Tanjung Pelepas": "T.Pelepas",
  "Tanjung Priok": "T.Priok",
  "Los Angeles": "LA",
  "Long Beach": "L.Beach",
  "Ho Chi Minh": "HCMC",
  "Laem Chabang": "L.Chabang",
  "Port Klang": "P.Klang",
  "Jebel Ali": "J.Ali",
  "Beibu Gulf": "Beibu",
  "Tanger-Med": "Tanger",
};
const short = (p: string) => SHORT[p] ?? p;

const HAZ = ["earthquake", "typhoon", "war"] as const;
const HAZ_LABEL: Record<string, string> = { earthquake: "地震", typhoon: "颱風", war: "戰爭" };

function RouteLine({ names, tone = "ink" }: { names: string[]; tone?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
      {names.map((p, i) => (
        <span key={`${p}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span className="text-[10px] text-ink-faint">→</span>}
          <span className={`font-mono text-[11px] font-bold ${tone}`}>{short(p)}</span>
        </span>
      ))}
    </span>
  );
}

export function V2Panel() {
  const { t } = useI18n();
  // Corridor and hazards live in the shared sidebar, so every tab agrees on
  // what scenario is being looked at.
  const { params } = useStore();
  const hazards = new Set(params.v2Hazards);

  const inst: V2Instance | undefined = useMemo(() => {
    const want = [...params.v2Hazards].sort().join("+");
    return v2.instances.find(
      (i) => i.source === params.v2Source && i.target === params.v2Target &&
        [...i.hazards].sort().join("+") === want,
    );
  }, [params.v2Source, params.v2Target, params.v2Hazards]);

  if (!inst) return null;
  const Q = inst.quantum;
  const classicalBest = inst.classical_top5[0];

  const routePorts = new Set<string>([
    ...classicalBest.route,
    ...(Q.tier1_route ?? []),
    ...(Q.tier2_route ?? []),
  ]);

  // Each route gets its own bulge so shared legs fan out instead of stacking:
  // classical optimum straight, tier-1 bowed one way, tier-2 the other. The
  // offset is floored at 5 viewBox units so short corridors still separate.
  const drawRoute = (route: string[] | null, color: string, width: number, bulge: number, dash?: string) =>
    route?.slice(0, -1).flatMap((from, i) => {
      const a = project(v2.ports[from].lat, v2.ports[from].lon);
      const b = project(v2.ports[route[i + 1]].lat, v2.ports[route[i + 1]].lon);
      return legs(a, b).map(([p, q], j) => (
        <path key={`${color}-${i}-${j}`} d={arcPath(p, q, bulge, 5)} fill="none"
          stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" opacity={bulge === 0 ? 1 : 0.9} />
      ));
    });

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card
        title={t("30 港平台實測")}
        subtitle={t("TEU 前 30 大港｜15 走廊 × 7 災害組合 = 105 個 30–33 qubit 平台實例")}
        right={<Chip label={`${inst.qubits} qubits`} tone="quantum" filled />}
        className="xl:col-span-2"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono font-bold text-ink">{params.v2Source} → {params.v2Target}</span>
          {HAZ.filter((h) => hazards.has(h)).map((h) => (
            <span key={h} className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-bg ${
              h === "war" ? "bg-bad" : h === "typhoon" ? "bg-warn" : "bg-quantum"}`}>
              {t(HAZ_LABEL[h])}
            </span>
          ))}
          <span className="text-ink-faint">{t("在左側切換")}</span>
        </div>

        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full" role="img" aria-label={t("30 港航線網路圖")}>
          <rect x={0} y={0} width={MAP_W} height={MAP_H} rx={8} fill="var(--color-bg)" />
          <LandLayer project={project} width={MAP_W} opacity={0.85} />
          {[1, 2, 3].map((i) => (
            <line key={`h${i}`} x1={0} y1={(MAP_H / 4) * i} x2={MAP_W} y2={(MAP_H / 4) * i}
              stroke="var(--color-grid)" strokeWidth={0.5} />
          ))}
          {[1, 2, 3, 4, 5].map((i) => (
            <line key={`v${i}`} x1={(MAP_W / 6) * i} y1={0} x2={(MAP_W / 6) * i} y2={MAP_H}
              stroke="var(--color-grid)" strokeWidth={0.5} />
          ))}
          {/* Paint order: classical solid underneath, tier-1 dashed, tier-2 dashed on top. */}
          {drawRoute(classicalBest.route, "var(--color-gold)", 1.5, 0)}
          {drawRoute(Q.tier1_route, "var(--color-quantum)", 1.1, 0.09, "4 2")}
          {drawRoute(Q.tier2_route, "var(--color-good)", 1.0, -0.09, "1.5 2.5")}
          {Object.entries(v2.ports).map(([name, p]) => {
            const { x, y } = project(p.lat, p.lon);
            const onRoute = routePorts.has(name);
            const isEnd = name === inst.source || name === inst.target;
            return (
              <g key={name}>
                <title>{`${name}｜TEU #${p.teu_rank_2024}`}</title>
                {isEnd && <circle cx={x} cy={y} r={4.5} fill="var(--color-gold)" opacity={0.25} />}
                <circle cx={x} cy={y} r={onRoute ? 2.6 : 1.8}
                  fill={onRoute ? "var(--color-gold)" : "var(--color-ink-faint)"}
                  stroke="var(--color-bg)" strokeWidth={1} opacity={onRoute ? 1 : 0.75} />
              </g>
            );
          })}
          {/* Labels placed after all dots so the collision pass sees every port. */}
          {placeLabels(
            Object.entries(v2.ports)
              .filter(([name]) => routePorts.has(name))
              .map(([name, p]) => ({ ...project(p.lat, p.lon), text: short(name) })),
            { fontSize: 4.2, dotR: 2.6, width: MAP_W, height: MAP_H },
          ).map((l) => (
            <text key={l.text} x={l.x} y={l.y} fontSize={4.2} fontWeight="700" textAnchor={l.anchor}
              fill="var(--color-gold)" stroke="var(--color-bg)" strokeWidth={2} paintOrder="stroke"
              className="pointer-events-none select-none">
              {l.text}
            </text>
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ background: "var(--color-gold)" }} /><span className="text-[10px] text-ink-faint">{t("古典最優")}</span></span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ background: "var(--color-quantum)" }} /><span className="text-[10px] text-ink-faint">{t("量子 tier-1")}</span></span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ background: "var(--color-good)" }} /><span className="text-[10px] text-ink-faint">{t("量子 tier-2")}</span></span>
        </div>
        <p className="mt-1 text-center text-[10px] leading-snug text-ink-faint">
          {t("三條線是同一題的三層答案:金色 = 窮舉出的古典最優;藍色 = 純量子抽樣抽到的最佳合法航線;綠色 = 量子樣本經 top-512 古典修補後的最佳航線(hybrid)。共用的航段各彎一邊以便分辨;綠線與金線同路 = 修補後精確命中,藍線與金線同路 = 純量子直接命中。")}
        </p>
        <Prose>
          {t("切換災害組合看路線翻轉:Busan → Hamburg 在地震情境走 Mundra 線、颱風情境走馬六甲線、戰爭情境(蘇伊士/紅海封鎖)整條翻到跨太平洋、經美東港口再到漢堡。這批是富士通 1024 節點 FX700 平台的實測結果 —— 不是本站瀏覽器模擬;距離模型為 v3.1(巴拿馬修正前),詳見報告 §3.4。")}
        </Prose>
      </Card>

      <Card
        title={t("量子 vs 古典")}
        subtitle={t("同一實例內對比;cost 為 full-QUBO 能量,跨實例不可比")}
        right={
          // tier-1 and tier-2 are different claims, so they never share a chip.
          Q.tier1_ratio === 1.0
            ? <Chip label={t("純量子命中古典最優")} tone="good" filled />
            : Q.tier2_ratio === 1.0
              ? <Chip label={t("hybrid 命中古典最優")} tone="good" />
              : Q.tier1_ratio !== null
                ? <Chip label={t("純量子近似比 {r}", { r: Q.tier1_ratio.toFixed(6) })} tone="warn" />
                : <Chip label={t("純量子抽樣無合法樣本")} tone="warn" />
        }
      >
        <div className="flex gap-3">
          <Stat label={t("tier-1 純量子")} value={Q.tier1_ratio === null ? "—" : Q.tier1_ratio.toFixed(6)}
            tone={Q.tier1_ratio === 1.0 ? "good" : Q.tier1_ratio === null ? "faint" : "quantum"} />
          <Stat label={t("tier-2 hybrid")} value={Q.tier2_ratio === null ? "—" : Q.tier2_ratio.toFixed(6)}
            tone={Q.tier2_ratio === 1.0 ? "good" : Q.tier2_ratio === null ? "faint" : "quantum"} />
          <Stat label={t("可行採樣率")} value={Q.feasible_rate === 0 ? "0" : Q.feasible_rate.toExponential(1)}
            tone={Q.feasible_rate === 0 ? "bad" : "ink"} />
        </div>
        <div className="mt-3 space-y-2">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-faint">{t("古典最優")}</div>
            <RouteLine names={classicalBest.route} tone="text-gold" />
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-faint">{t("tier-1 純量子")}</div>
            {Q.tier1_ratio !== null && Q.tier1_route
              ? <RouteLine names={Q.tier1_route} tone="text-quantum" />
              : <p className="text-xs text-ink-faint">{t("純量子抽樣無合法樣本")}</p>}
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-faint">{t("tier-2 hybrid(量子 + 古典修補)")}</div>
            {Q.tier2_ratio !== null && Q.tier2_route
              ? <RouteLine names={Q.tier2_route} tone="text-good" />
              : <p className="text-xs text-ink-faint">{t("無")}</p>}
          </div>
        </div>
        {Q.feasible_rate === 0 && (
          <Caveat>{t("此實例的量子採樣沒有抽到任何可行態(105 個實例中有 10 個如此)—— 誠實列出,不遮醜。tier-2 結果來自後處理管線。")}</Caveat>
        )}
        <Caveat>
          {t("tier-1 = 純量子抽樣的最佳合法航線;tier-2 = 量子抽樣再經古典修補的 hybrid 結果,兩者分開列示,不併入同一排行。近似比 = 平台回報的 terms-only Ising 能量比(古典最優 ÷ 該解,未含每實例常數 offset),故比值接近 1 不代表路線成本接近;排行中的 cost 才是 full-QUBO 路線成本。1.0 表示命中古典精確解。")}
        </Caveat>
      </Card>

      <Card title={t("古典 top 5")} subtitle={t("窮舉 {n} 條可行路徑後的排行", { n: inst.n_feasible_paths })}>
        <ol>
          {inst.classical_top5.map((c, i) => (
            <li key={i} className={`flex items-start gap-3 py-1.5 ${i > 0 ? "border-t border-border" : ""}`}>
              <span className={`w-4 shrink-0 font-mono text-xs ${i === 0 ? "text-gold" : "text-ink-faint"}`}>{i + 1}</span>
              <span className="min-w-0 flex-1"><RouteLine names={c.route} tone={i === 0 ? "text-gold" : "text-ink"} /></span>
              <span className={`shrink-0 font-mono text-xs tabular-nums ${i === 0 ? "font-bold text-gold" : "text-ink-dim"}`}>
                {c.cost.toFixed(4)}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card
        title={t("量子採樣到的可行航線")}
        subtitle={t("q_count = 該航線在量子採樣中出現的次數")}
        right={<Chip label={`job ${inst.evidence_job}`} tone="faint" />}
      >
        {Q.q_routes.length === 0 ? (
          <p className="py-6 text-center text-sm text-bad">{t("此實例未採樣到可行態")}</p>
        ) : (
          <ol>
            {Q.q_routes.map((q, i) => (
              <li key={i} className={`flex items-start gap-3 py-1.5 ${i > 0 ? "border-t border-border" : ""}`}>
                <span className="min-w-0 flex-1"><RouteLine names={q.route} /></span>
                <Chip label={`×${q.q_count}`} tone="quantum" />
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title={t("口徑與出處")} subtitle={t("整批資料的誠實聲明,原文照錄")} className="xl:col-span-2">
        <dl className="space-y-2">
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-ink-faint">convention</dt>
            <dd className="font-mono text-[11px] leading-relaxed text-ink-dim">{v2.convention}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-ink-faint">disclaimer</dt>
            <dd className="font-mono text-[11px] leading-relaxed text-ink-dim">{v2.disclaimer}</dd>
          </div>
          {Object.entries(v2.hazard_sources).map(([h, src]) => (
            <div key={h}>
              <dt className="text-[10px] uppercase tracking-wide text-ink-faint">{t(HAZ_LABEL[h])}</dt>
              <dd className="font-mono text-[11px] leading-relaxed text-ink-dim">{src}</dd>
            </div>
          ))}
        </dl>
        <Prose>
          {t("105 個實例各自對應一個平台 job(7956384–7956556),逐實例可稽核。無雜訊古典態向量模擬、非量子硬體、不宣稱量子優勢 —— 資料自帶的聲明,本站照錄。產生時間:{d}。", { d: v2.generated })}
        </Prose>
        <Caveat>
          {t("本分頁為平台實測結果瀏覽器:QUBO 輸入(邊分數)留在平台上,瀏覽器不做重算。與「地圖/排行/演算法」分頁的 16q 即時引擎是兩套體系。")}
        </Caveat>
      </Card>
    </div>
  );
}
