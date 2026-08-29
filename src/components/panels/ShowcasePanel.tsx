/**
 * The 0.9281 multimodal showcase — the local reduced QUBO instance from the
 * champion Colab benchmark, with its real α/β/γ component breakdown.
 *
 * This is the one instance whose per-edge components survived into the
 * notebook's embedded outputs, so the weight sliders here operate on real
 * data (verified additive by verify_showcase). Everything on this panel
 * belongs to that local reduced model: it must never be charted against the
 * 16q ising figure −97.4936 (口徑紀律 2).
 */
"use client";

import { useMemo, useState } from "react";
import { Card, Stat, Chip, Slider, Caveat, Prose, Mono } from "@/components/ui";
import { Bar } from "@/components/charts";
import { showcase } from "@/data";

const COMP = [
  { key: "alpha", label: "α 成本", color: "var(--color-gold)" },
  { key: "beta", label: "β 時間", color: "var(--color-quantum)" },
  { key: "gamma1", label: "γ₁ 地緣", color: "var(--color-good)" },
  { key: "gamma2", label: "γ₂ 港口", color: "var(--color-warn)" },
  { key: "gamma3", label: "γ₃ 天氣", color: "var(--color-bad)" },
] as const;
type CompKey = (typeof COMP)[number]["key"];
type Weights = Record<CompKey, number>;
const DEFAULT_W: Weights = { alpha: 1, beta: 1, gamma1: 1, gamma2: 1, gamma3: 1 };

const MODE_ZH: Record<string, string> = { Road: "公路", Rail: "鐵路", Air: "空運", Sea: "海運" };

export function ShowcasePanel() {
  const [w, setW] = useState<Weights>(DEFAULT_W);
  const isDefaultW = COMP.every((c) => w[c.key] === 1);

  // Default-weight ranks, to show movement arrows when the sliders leave 1.0.
  const combos = useMemo(() => {
    const [pairA, pairB] = showcase.pairs;
    const legA = showcase.edges.filter((e) => e.pair === pairA);
    const legB = showcase.edges.filter((e) => e.pair === pairB);
    const reweighted = (e: (typeof showcase.edges)[number]) =>
      COMP.reduce((s, c) => s + w[c.key] * e[c.key], 0);
    const all = legA.flatMap((a) =>
      legB.map((b) => ({
        modes: [a.mode, b.mode] as const,
        total: reweighted(a) + reweighted(b),
        baseTotal: a.score + b.score,
      })),
    );
    const baseOrder = [...all].sort((x, y) => x.baseTotal - y.baseTotal);
    const withBase = all.map((c) => ({ ...c, baseRank: baseOrder.indexOf(c) + 1 }));
    return withBase.sort((x, y) => x.total - y.total);
  }, [w]);

  const top = combos[0];
  const reproduces = isDefaultW && Math.abs(top.total - showcase.published_optimum) < 2e-6;
  const maxEdgeScore = Math.max(...showcase.edges.map((e) => e.score));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card
        title="0.9281 多式聯運實例"
        subtitle={`${showcase.corridor.join(" → ")}｜同一路徑 × 4 種運輸方式 = ${showcase.instance.n_vars} 變數`}
        right={<Chip label={`${showcase.instance.n_pauli_terms} Pauli 項`} tone="quantum" />}
        className="xl:col-span-2"
      >
        <Prose>
          這是冠軍 Colab benchmark 的 local reduced QUBO:走廊固定為新加坡 → 鹿特丹 → 洛杉磯,
          每段各有公路/鐵路/空運/海運四種 mode-edge,16 種組合中選能量最低者。
          它是唯一一個**分項資料完整可得**的實例 —— 每條邊的 α/β/γ 五個分項都嵌在筆記本輸出裡,
          且逐邊驗證 Σ分項 == 邊分數(≤3e-6,顯示截斷)。
        </Prose>
        <Caveat>
          口徑:0.9281 屬 local reduced 模型,與 16q ising 的 −97.4936 是**兩個不同模型**,
          不可同圖並列。分項欄位為 *_q9_mean 聚合值,來源:q9_benchmark_champion_colab_ok.ipynb 內嵌輸出。
        </Caveat>
      </Card>

      <Card
        title="邊分項解剖"
        subtitle="每條 mode-edge 的五個 Hamiltonian 分項(真實資料)"
        right={
          <div className="flex flex-wrap justify-end gap-x-2 gap-y-0.5">
            {COMP.map((c) => (
              <span key={c.key} className="flex items-center gap-1 text-[9px] text-ink-faint">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
        }
      >
        {showcase.pairs.map((pair) => (
          <div key={pair} className="mb-3">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-faint">{pair}</div>
            {showcase.edges.filter((e) => e.pair === pair).map((e) => (
              <div key={e.mode} className="mb-1.5 flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs text-ink">
                  {MODE_ZH[e.mode] ?? e.mode}
                  <span className="ml-1 text-[9px] text-ink-faint">{e.mode}</span>
                </span>
                <span className="flex h-[10px] min-w-0 flex-1 overflow-hidden rounded bg-surface-alt">
                  {COMP.map((c) => (
                    <span key={c.key} className="h-full"
                      style={{ width: `${(e[c.key] / maxEdgeScore) * 100}%`, background: c.color }} />
                  ))}
                </span>
                <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-ink-dim">
                  {e.score.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        ))}
        <Prose>
          長途的鹿特丹 → 洛杉磯段,γ₂ 港口與 γ₃ 天氣分項明顯比亞歐段厚 —— 這正是「風險已定價進邊分數」
          的具體樣貌。空運的 β 時間分項最薄、海運最厚,和 lead time(1.7 天 vs 51 天)一致。
        </Prose>
      </Card>

      <Card
        title="α/β/γ 權重滑桿"
        subtitle="重新加權五個分項,16 種組合即時重排"
        right={
          reproduces
            ? <Chip label="復現官方 Rank 1" tone="good" filled />
            : <Chip label={isDefaultW ? "官方權重" : "what-if 權重"} tone={isDefaultW ? "good" : "warn"} />
        }
      >
        <div className="grid gap-x-6 sm:grid-cols-2">
          {COMP.map((c) => (
            <Slider key={c.key} label={c.label} value={w[c.key]} min={0} max={3} step={0.05}
              onChange={(v) => setW((p) => ({ ...p, [c.key]: v }))}
              format={(v) => `${v.toFixed(2)}×`}
              tone={c.key === "alpha" ? "gold" : c.key === "beta" ? "quantum" : c.key === "gamma1" ? "good" : c.key === "gamma2" ? "warn" : "bad"} />
          ))}
          {!isDefaultW && (
            <button type="button" onClick={() => setW(DEFAULT_W)}
              className="mb-4 self-end rounded-lg border border-border px-3 py-2 text-xs text-ink-dim transition-colors hover:text-ink">
              重設為官方權重
            </button>
          )}
        </div>
        <ol className="max-h-[300px] overflow-y-auto">
          {combos.map((c, i) => {
            const moved = c.baseRank - (i + 1);
            return (
              <li key={c.modes.join("+")}
                className={`flex items-center gap-3 py-1.5 ${i > 0 ? "border-t border-border" : ""}`}>
                <span className={`w-5 shrink-0 font-mono text-xs ${i === 0 ? "text-gold" : "text-ink-faint"}`}>{i + 1}</span>
                <span className="min-w-0 flex-1 text-xs text-ink">
                  {MODE_ZH[c.modes[0]]} + {MODE_ZH[c.modes[1]]}
                  <span className="ml-1.5 text-[9px] text-ink-faint">{c.modes[0]}+{c.modes[1]}</span>
                </span>
                {moved !== 0 && (
                  <span className={`shrink-0 text-[10px] font-bold ${moved > 0 ? "text-good" : "text-bad"}`}>
                    {moved > 0 ? `↑${moved}` : `↓${-moved}`}
                  </span>
                )}
                <span className={`shrink-0 font-mono text-xs tabular-nums ${i === 0 ? "font-bold text-gold" : "text-ink-dim"}`}>
                  {c.total.toFixed(6)}
                </span>
              </li>
            );
          })}
        </ol>
        <Caveat>
          滑桿是分項的**相對縮放**:1.00× 即官方合成(分項已內含權重),絕對 α/β/γ 數值不在資料內。
          全部 1.00× 時 Rank 1 = <Mono>0.928146</Mono>(公路+鐵路),與官方排行逐項對帳通過。
        </Caveat>
      </Card>

      <Card
        title="災害情境:官方數字"
        subtitle={`衝擊情境跑在 ${showcase.reduced_instance.name}(${showcase.reduced_instance.n_vars} 變數)上`}
        right={<Chip label="固定紀錄" tone="faint" />}
      >
        {showcase.scenarios.map((s) => (
          <Bar key={s.name} label={s.label} value={s.best_objective}
            max={Math.max(...showcase.scenarios.map((x) => x.best_objective)) * 1.05}
            color={s.name === "base" ? "var(--color-good)" : "var(--color-warn)"}
            caption={s.best_objective.toFixed(6)}
            highlight={s.name === "base"} />
        ))}
        <div className="mt-3 flex gap-3">
          <Stat label="基準最優" value="0.928146" tone="good" />
          <Stat label="衝擊後" value="0.940109" tone="warn" />
          <Stat label="成本上升" value="+1.3%" />
        </div>
        <Prose>
          鹿特丹港衝擊讓原本的最優路線失寵,最優解移動到 0.940109 —— 對應筆記排行第 2 名
          (經漢堡)的分數,且 QAOA 與古典最短路給出一致答案。
          這是「災害改寫最優路線」的官方 benchmark 證據,與「風險」分頁的即時蒙地卡羅互為印證。
        </Prose>
        <Caveat>
          此卡為 Colab benchmark 的固定歷史紀錄,不隨本站參數變動;衝擊的量級定義在
          bundle CSV 內,尚未取得,故不提供即時重算。
        </Caveat>
      </Card>

      <Card
        title="演算法對比(8 變數 base 情境)"
        subtitle="同一實例、多演算法、各 3 seeds 的官方成績"
        className="xl:col-span-2"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="pb-1 font-normal">演算法</th>
                <th className="pb-1 text-right font-normal">最佳</th>
                <th className="pb-1 text-right font-normal">中位數</th>
                <th className="pb-1 text-right font-normal">可行率</th>
                <th className="pb-1 text-right font-normal">命中率</th>
                <th className="pb-1 text-right font-normal">深度</th>
                <th className="pb-1 text-right font-normal">2Q 閘</th>
              </tr>
            </thead>
            <tbody>
              {showcase.algos.map((a) => {
                const hit = a.best !== null && Math.abs(a.best - showcase.published_optimum) < 1e-6;
                return (
                  <tr key={a.label} className="border-t border-border">
                    <td className="py-1.5 pr-3 text-xs text-ink">{a.label}</td>
                    <td className={`py-1.5 text-right font-mono text-xs tabular-nums ${hit ? "font-bold text-gold" : "text-ink-dim"}`}>
                      {a.best === null ? "—" : a.best.toFixed(6)}
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink-dim">
                      {a.median === null ? "—" : a.median.toFixed(6)}
                    </td>
                    <td className={`py-1.5 text-right font-mono text-xs tabular-nums ${a.feasible_rate === 0 ? "text-bad" : "text-ink-dim"}`}>
                      {(a.feasible_rate * 100).toFixed(0)}%
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink-dim">
                      {(a.hit_rate * 100).toFixed(0)}%
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink-dim">
                      {a.depth === null ? "—" : a.depth}
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink-dim">
                      {a.two_qubit_gates === null ? "—" : a.two_qubit_gates}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Prose>
          COBYLA 系的 QAOA 三種深度全部命中;SPSA 三次有一次落到 0.9328。ADMM 與這裡的
          Grover-GAS 配置可行率 0% —— 誠實列出,不遮醜。WarmStart 深度只有 2 是因為初態
          已含解資訊,電路幾乎不需要演化。
        </Prose>
        <Caveat>
          固定歷史紀錄(Qiskit / Colab),與「演算法」分頁的瀏覽器即時模擬是兩套執行環境。
          16q ising 的 GAS 表現見「40q」分頁,兩者不可混讀。
        </Caveat>
      </Card>
    </div>
  );
}
