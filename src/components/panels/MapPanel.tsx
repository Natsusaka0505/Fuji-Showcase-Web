"use client";

import { WorldMap } from "@/components/WorldMap";
import { SweepChart } from "@/components/charts";
import { Card, Stat, Chip, Route, Caveat, Prose, Mono } from "@/components/ui";
import { useStore } from "@/lib/store";
import { ports, penaltySweep, solutions, meta, CRITICAL_A, fmtCost } from "@/data";

export function MapPanel() {
  const { params, togglePort, solution, model, derived } = useStore();
  const best = solution.bestClean;
  const cheating = solution.cheatStates > 0;
  const atOptimum = best ? Math.abs(best.cost - solutions.optimum) < 1e-9 : false;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card
        title="九港路網"
        subtitle={`${model.source} → ${model.target}｜16 條候選航段 = 16 qubits`}
        right={<Chip label={`${solution.ranking.length} 條可行`} tone="quantum" />}
        className="xl:col-span-2"
      >
        <WorldMap route={best} blockedPorts={params.blockedPorts} onPortClick={togglePort} />
        <p className="mt-2 text-center text-[10px] text-ink-faint">點港口可切換封鎖,航線即時重算</p>
      </Card>

      <Card
        title={cheating ? "最佳解不可行" : "最佳航線"}
        subtitle={cheating ? "penalty 太低,演算法找到了作弊解" : undefined}
        right={<Chip label={cheating ? "違規" : "可行"} tone={cheating ? "bad" : "good"} filled />}
      >
        {best ? (
          <>
            <Route iso={best.routeIso} className="mb-4" />
            <div className="flex gap-3">
              <Stat label="成本" value={fmtCost(best.cost)} tone="gold" />
              <Stat label="航段" value={String(best.nEdges)} unit="段" />
              <Stat label="轉運" value={String(best.route.length - 2)} unit="港" />
              {!derived && (
                <Stat
                  label="vs 最佳"
                  value={atOptimum ? "命中" : `+${(best.cost - solutions.optimum).toFixed(3)}`}
                  tone={atOptimum ? "good" : "warn"}
                />
              )}
            </div>
            {derived && (
              <Caveat>
                衍生情境(自訂起終點或 λ):不與已發表最優 −97.4936 對比(該數字僅屬出貨實例)。
              </Caveat>
            )}
          </>
        ) : (
          <p className="py-6 text-center text-sm text-bad">所有可行航線都被封鎖了</p>
        )}
      </Card>

      <Card
        title="Penalty 為什麼必要"
        subtitle="拖動側欄 penalty_A,看約束何時失效"
        right={
          <Chip
            label={cheating ? `${solution.cheatStates} 個作弊態` : "0 作弊態"}
            tone={cheating ? "bad" : "good"}
          />
        }
      >
        <SweepChart points={penaltySweep.points} current={params.penaltyA} />
        <Prose>
          縱軸 = 能量比最佳合法航線更低的狀態數(對數)。這些是量子會選、但根本不是一條連貫航線的「作弊解」。
          A 低於 <Mono>{CRITICAL_A.toFixed(2)}</Mono> 時作弊態出現,A=0 時多達{" "}
          <Mono>{penaltySweep.points[0].n_below_best_clean}</Mono> 個 —— 演算法會選「什麼都不選」拿 0 分。
        </Prose>
        <div className="mt-3 flex gap-3">
          <Stat label="臨界 A*" value={CRITICAL_A.toFixed(2)} tone="good" />
          <Stat label="出貨值" value={meta.penalty_A_default.toFixed(2)} tone="gold" />
          <Stat label="安全邊際" value={`${(meta.penalty_A_default / CRITICAL_A).toFixed(1)}×`} />
        </div>
        {derived && (
          <Caveat>
            掃描曲線、臨界 A* 與安全邊際為出貨實例(SIN→LAX、λ=0.4)的預算資料;
            卡片右上的作弊態計數則依目前設定即時計算。
          </Caveat>
        )}
      </Card>

      <Card title="港口風險" subtitle="點列可切換封鎖" className="xl:col-span-2">
        <ul className="space-y-1">
          {[...ports].sort((a, b) => b.port_risk - a.port_risk).map((p) => {
            const blocked = params.blockedPorts.includes(p.iso);
            const onRoute = best?.routeIso.includes(p.iso) ?? false;
            return (
              <li key={p.iso}>
                <button
                  type="button"
                  onClick={() => togglePort(p.iso)}
                  aria-pressed={blocked}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface-alt"
                >
                  <span className={`w-9 shrink-0 font-mono text-xs font-bold ${onRoute ? "text-gold" : "text-ink"} ${blocked ? "text-ink-faint line-through" : ""}`}>
                    {p.iso}
                  </span>
                  <span className={`w-28 shrink-0 truncate text-xs text-ink-dim ${blocked ? "line-through" : ""}`}>
                    {p.name}
                  </span>
                  <span className="h-[5px] min-w-0 flex-1 overflow-hidden rounded bg-surface-alt">
                    <span className="block h-full rounded bg-warn" style={{ width: `${(p.port_risk / 53) * 100}%` }} />
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-ink-dim">
                    {p.port_risk.toFixed(1)}
                  </span>
                  {blocked && <Chip label="封鎖" tone="bad" />}
                </button>
              </li>
            );
          })}
        </ul>
        <Caveat>
          風險分數為 QUBO 模型輸入值。地震與颱風原始數字見「稽核」分頁,每港可對 USGS 官方即時查證。
        </Caveat>
      </Card>
    </div>
  );
}
