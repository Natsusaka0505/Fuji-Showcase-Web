/**
 * The 40-qubit run.
 *
 * Nothing here is recomputed: 2^40 is a 16 TiB statevector, so this panel plays
 * back the one completed run (job 7951873) and is explicit that the scale claim
 * and the optimisation claim are different claims.
 */
"use client";

import { QubitScale } from "@/components/charts";
import { Card, Stat, Chip, Route, Caveat, Prose, Mono } from "@/components/ui";
import { result40, solutions, fmtHours } from "@/data";

const ISO: Record<string, string> = {
  Singapore: "SIN",
  "Suez/Port Said": "SUZ",
  Rotterdam: "RTM",
  "Los Angeles": "LAX",
};

const SCALE_ROWS = [
  ["qubits", "16", `${result40.total_qubits}（16 key + 24 val）`],
  ["態向量", "1 MB", "16 TiB"],
  ["執行環境", "你的瀏覽器", `1024 節點 / ${result40.mpi_processes.toLocaleString()} MPI`],
  ["單輪耗時", "~2 ms", fmtHours(result40.wallclock_sec)],
  ["BBHT 輪次", "可調至 120", String(result40.budget)],
  ["結果", "命中 -97.4936", `${result40.best_objective.toFixed(2)}（不可行）`],
] as const;

const COST = [
  ["AutoRebase 後 native 閘", "73,577"],
  ["optimize_light 融合後", "20,105"],
  ["融合比", "-3.66×"],
  ["瓶頸:iQFT 全域 all-to-all 閘", "~100 s/閘"],
  ["尾段速率", "0.15 gate/s"],
] as const;

export function QuantumPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card
        title="40-qubit 規模里程碑"
        subtitle={`job 7951873｜${result40.algorithm}`}
        right={<Chip label="COMPLETED" tone="good" filled />}
      >
        <div className="flex gap-3">
          <Stat label="總 qubits" value={String(result40.total_qubits)} tone="gold" />
          <Stat label="MPI 行程" value={result40.mpi_processes.toLocaleString()} tone="quantum" />
          <Stat label="單輪牆鐘" value={fmtHours(result40.wallclock_sec)} tone="warn" />
        </div>
        <div className="mt-4 flex gap-3">
          <Stat label="key / val" value={`${result40.n_key} / ${result40.n_val}`} />
          <Stat label="取樣數" value={String(result40.shots)} />
          <Stat label="迭代" value={`${result40.iters_run} / ${result40.budget}`} />
        </div>
        <Prose>
          2^40 個振幅 × 16 bytes = <Mono>16 TiB</Mono> 狀態向量,動用 1024 節點、4096 個 MPI 行程,
          單輪端到端跑完花了 <Mono>{fmtHours(result40.wallclock_sec)}</Mono>。這是規模與工程管線的里程碑。
        </Prose>
      </Card>

      <Card
        title="解的品質"
        subtitle="誠實對標:規模做得到,優化做不到"
        right={<Chip label="不可行" tone="bad" filled />}
      >
        <div className="flex gap-3">
          <Stat label="採樣最佳" value={result40.best_objective.toFixed(2)} tone="bad" />
          <Stat label="已知最優" value={solutions.optimum.toFixed(2)} tone="gold" />
          <Stat label="warm-start" value={result40.warm_start_y0.toFixed(0)} />
        </div>
        <div className="mt-4">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-faint">採樣航線(未到終點)</div>
          <Route iso={result40.route.map((r) => ISO[r] ?? r)} />
        </div>
        <Prose>
          採樣值 <Mono>{result40.best_objective.toFixed(2)}</Mono> 比 warm-start 門檻{" "}
          <Mono>{result40.warm_start_y0}</Mono> 還差,航線只走到 Rotterdam 就斷了、選了{" "}
          {result40.n_edges} 條邊(退化解)。原因是 GAS 靠 BBHT 多輪逐步加大 r 才收斂,
          <Mono> budget=1</Mono> 只做了一次極弱放大,接近亂數。40q 要逼近最優需要很多個 44 小時輪次 = 數週,
          不切實際。
        </Prose>
        <Caveat>
          對外定位必須精準:40q 是規模/管線/牆鐘里程碑,不是「40q Grover 命中最優」。
          乾淨最優的 Grover 證據掛在 30q(-97.4936);品質看 16q、規模看 40q。
        </Caveat>
        <Prose>
          同一個演算法在「演算法」分頁跑得動 —— 那裡是 16 qubit、真的振幅放大,毫秒級收斂。
          把那邊的 <Mono>budget</Mono> 調到 1,就會重現這裡看到的失敗模式。
        </Prose>
      </Card>

      <Card title="記憶體隨 qubit 指數成長" subtitle="每多一個 qubit,狀態向量翻倍">
        <QubitScale points={[16, 20, 25, 30, 35, 39, 40]} />
        <div className="mt-2 flex gap-3">
          <Stat label="16q 驗證規模" value="1 MB" tone="quantum" />
          <Stat label="2024 冠軍" value="39q" />
          <Stat label="本隊" value="40q" tone="gold" />
        </div>
        <Prose>
          Fujitsu 模擬器上限 40 qubit。2024 冠軍 TU Delft 用 39q,本隊用滿上限 —— 不只超越去年冠軍,
          而是打到模擬器天花板。
        </Prose>
      </Card>

      <Card title="16q 即時 vs 40q 播放" subtitle="同一個 GAS 演算法,規模差 24 個 qubit" className="xl:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="pb-1 font-normal">項目</th>
                <th className="pb-1 text-right font-normal">16q（本站即時）</th>
                <th className="pb-1 text-right font-normal">40q（平台播放）</th>
              </tr>
            </thead>
            <tbody>
              {SCALE_ROWS.map(([k, a, b]) => (
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
          規模每加一個 qubit,態向量翻倍;16q 的 1 MB 可以在瀏覽器裡每秒重算好幾次,
          40q 的 16 TiB 需要 1024 個節點、單輪 44 小時。演算法沒變,能做的事完全不同 ——
          這就是「規模做得到、優化做不到」的具體意思。
        </Prose>
      </Card>

      <Card title="成本剖析" subtitle="逐閘 ETA 實測">
        <dl>
          {COST.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 border-t border-border py-1.5">
              <dt className="min-w-0 text-xs text-ink-dim">{k}</dt>
              <dd className="shrink-0 font-mono text-xs font-bold tabular-nums text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <Prose>
          瓶頸是 iQFT 高位 value qubit 之間的全域閘 —— 每個要對 16 TiB 做一次 all-to-all,約 100 秒。
          少數這種閘吃掉大半牆鐘。這是通訊 bound,加算力或 OMP 都救不了。
        </Prose>
      </Card>
    </div>
  );
}
