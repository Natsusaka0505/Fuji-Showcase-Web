"use client";

import { useMemo } from "react";
import { Histogram } from "@/components/charts";
import { Card, Stat, Chip, Route, Caveat, Prose } from "@/components/ui";
import { useStore, model } from "@/lib/store";
import { algoCompare, solutions, meta, fmtCost } from "@/data";

export function RankingPanel() {
  const { params, solution } = useStore();
  const hist = useMemo(() => model.histogram({ penaltyA: params.penaltyA }), [params.penaltyA]);
  const best = solution.bestClean;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card
        title="能量地貌"
        subtitle={`全部 ${model.size.toLocaleString()} 個狀態｜對數縱軸`}
        right={<Chip label={`${meta.num_pauli_terms} Pauli 項`} tone="quantum" />}
      >
        <Histogram
          counts={hist.counts}
          binEdges={hist.binEdges}
          markers={
            best
              ? [
                  { value: best.cost, color: "var(--color-gold)", label: "最佳合法" },
                  { value: solution.globalMin.cost, color: "var(--color-bad)", label: "全域最低" },
                ]
              : []
          }
        />
        <div className="mt-2 flex gap-3">
          <Stat label="最低" value={solution.energyStats.min.toFixed(2)} tone="bad" />
          <Stat label="平均" value={solution.energyStats.mean.toFixed(2)} />
          <Stat label="最高" value={solution.energyStats.max.toFixed(2)} />
        </div>
        <Prose>
          金線是最佳合法航線,紅線是全域最低能量。兩線重合時,penalty 已經強到讓「數學最低點」正好就是
          「一條真的能走的航線」—— 這正是 QUBO 建模要達成的事。
        </Prose>
      </Card>

      <Card
        title="可行航線排行"
        subtitle="flow-balance 通過且能從新加坡走到洛杉磯"
        right={<Chip label={`${solution.ranking.length} / ${solutions.n_clean_feasible}`} tone="quantum" />}
      >
        {solution.ranking.length === 0 ? (
          <p className="py-6 text-center text-sm text-bad">目前封鎖條件下沒有任何可行航線</p>
        ) : (
          <ol className="max-h-[320px] overflow-y-auto">
            {solution.ranking.map((r, i) => (
              <li key={r.z} className={`flex items-center gap-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                <span className={`w-5 shrink-0 font-mono text-xs ${i === 0 ? "text-gold" : "text-ink-faint"}`}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <Route iso={r.routeIso} />
                  <span className="mt-0.5 block text-[10px] text-ink-faint">{r.nEdges} 段</span>
                </span>
                <span className={`shrink-0 font-mono text-xs tabular-nums ${i === 0 ? "font-bold text-gold" : "text-ink-dim"}`}>
                  {fmtCost(r.cost)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card
        title="演算法比較"
        subtitle={`16 qubit｜錨點 = 暴力解 ${solutions.optimum.toFixed(4)}`}
        className="xl:col-span-2"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="pb-1 font-normal">演算法</th>
                <th className="pb-1 text-right font-normal">最佳成本</th>
                <th className="pb-1 text-right font-normal">近似比</th>
                <th className="pb-1 text-right font-normal">秒</th>
                <th className="pb-1 pl-3 font-normal">可行</th>
              </tr>
            </thead>
            <tbody>
              {algoCompare.rows.map((r) => (
                <tr key={r.algo} className="border-t border-border align-top">
                  <td className="py-2 pr-3">
                    <span className="text-xs text-ink">{r.algo}</span>
                    {r.note && <span className="mt-0.5 block text-[10px] text-ink-faint">{r.note}</span>}
                  </td>
                  <td className="py-2 text-right font-mono text-xs tabular-nums text-ink-dim">
                    {r.best_cost.toFixed(4)}
                  </td>
                  <td className={`py-2 text-right font-mono text-xs tabular-nums ${r.ratio === 1 ? "font-bold text-gold" : r.ratio === null ? "text-ink-faint" : "text-ink"}`}>
                    {r.ratio === null ? "—" : r.ratio.toFixed(4)}
                  </td>
                  <td className="py-2 text-right font-mono text-xs tabular-nums text-ink-dim">
                    {r.seconds.toFixed(2)}
                  </td>
                  <td className="py-2 pl-3">
                    <Chip label={r.feasible ? "可行" : "不可行"} tone={r.feasible ? "good" : "bad"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Caveat>
          近似比 = 最佳可行成本 ÷ 暴力解最佳可行成本,且只對可行解有意義。GAS 該列為煙霧版
          (feasible=False),硬算近似比不合法,故列「—」。此表為固定歷史紀錄,不隨參數變動。
        </Caveat>
      </Card>
    </div>
  );
}
