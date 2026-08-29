/**
 * The three solvers, run live in the browser against the same 16-qubit QUBO the
 * rest of the site uses. Nothing here is a replay — the curves come out of an
 * actual state vector, an actual annealing chain and actual Grover rotations.
 *
 * QAOA takes a few hundred milliseconds, so it runs on demand rather than on
 * every keystroke; Grover and SA are fast enough to recompute as you drag.
 */
"use client";

import { useMemo, useState, useTransition } from "react";
import { LineChart, Bar } from "@/components/charts";
import { Card, Stat, Chip, Slider, Route, Caveat, Prose, Mono } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { Q9Model } from "@/engine/model";
import { runQaoa, runSa, DEFAULT_QAOA_PARAMS, DEFAULT_SA_PARAMS } from "@/engine/qaoa";
import { runGas, amplificationCurve, DEFAULT_GAS_PARAMS } from "@/engine/grover";
import { meta, result40, fmtHours } from "@/data";

export function AlgoPanel() {
  const { params, model, scores } = useStore();
  const energies = useMemo(
    () => model.energies({ penaltyA: params.penaltyA, scores }),
    [model, params.penaltyA, scores],
  );
  // True minimum of the live instance. For a derived endpoint pair (or a lowered
  // penalty) the published −97.4936 is the wrong anchor, so anchor on the actual
  // landscape being searched.
  const optimum = useMemo(() => {
    let m = Infinity;
    for (const v of energies) if (v < m) m = v;
    return m;
  }, [energies]);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <GroverCard model={model} energies={energies} optimum={optimum} />
      <AmplificationCard energies={energies} />
      <QaoaCard energies={energies} optimum={optimum} />
      <SaCard energies={energies} optimum={optimum} />
    </div>
  );
}

/* ------------------------------------------------------------------ Grover */

function GroverCard({ model, energies, optimum }: { model: Q9Model; energies: Float64Array; optimum: number }) {
  const { t } = useI18n();
  const [budget, setBudget] = useState(DEFAULT_GAS_PARAMS.budget);
  const [shots, setShots] = useState(DEFAULT_GAS_PARAMS.shots);
  const [seed, setSeed] = useState(1);
  const [warmStart, setWarmStart] = useState(false);

  const result = useMemo(
    () => runGas(energies, {
      ...DEFAULT_GAS_PARAMS,
      budget,
      shots,
      seed,
      warmStartY0: warmStart ? result40.warm_start_y0 : null,
    }),
    [energies, budget, shots, seed, warmStart],
  );

  const best = model.decode(result.bestZ);
  const hit = result.hitOptimum;

  return (
    <Card
      title={t("Grover 自適應搜尋")}
      subtitle={t("BBHT 外圈｜每次調整都在你的瀏覽器重跑")}
      right={<Chip label={hit ? t("命中最優") : t("未命中")} tone={hit ? "good" : "warn"} filled={hit} />}
    >
      <LineChart
        series={[{ values: result.trail.map((s) => s.best), color: "var(--color-gold)" }]}
        refLines={[{ value: optimum, color: "var(--color-good)", label: t("最優 {v}", { v: optimum.toFixed(4) }) }]}
        markers={result.trail.flatMap((s, i) =>
          s.improved ? [{ index: i, color: "var(--color-quantum)" }] : [])}
        xLabel={t("BBHT 輪次")}
        height={140}
      />
      <div className="mt-2 flex gap-3">
        <Stat label={t("最佳")} value={result.bestEnergy.toFixed(4)} tone={hit ? "good" : "warn"} />
        <Stat label={t("總旋轉")} value={String(result.totalRotations)} tone="quantum" />
        <Stat label={t("改善次數")} value={String(result.trail.filter((s) => s.improved).length)} />
      </div>
      {best.complete && <Route iso={best.routeIso} className="mt-3" />}

      <div className="mt-4 grid gap-x-6 sm:grid-cols-2">
        <Slider label={t("budget(BBHT 輪次)")} value={budget} min={1} max={120} step={1}
          onChange={setBudget} format={(v) => v.toFixed(0)}
          hint={t("平台 40q 那次只有 1 輪")} />
        <Slider label={t("shots(每輪取樣)")} value={shots} min={8} max={256} step={8}
          onChange={setShots} format={(v) => v.toFixed(0)} tone="quantum" />
        <Slider label={t("亂數種子")} value={seed} min={1} max={40} step={1}
          onChange={setSeed} format={(v) => v.toFixed(0)} tone="faint"
          hint={t("GAS 是機率演算法,換種子結果會變")} />
        <div className="mb-4">
          <button type="button" onClick={() => setWarmStart((w) => !w)}
            className={`w-full rounded-lg border px-3 py-2 text-xs transition-colors ${
              warmStart ? "border-warn bg-warn text-bg font-bold" : "border-border text-ink-dim hover:text-ink"
            }`}>
            warm start y₀ = {result40.warm_start_y0}
          </button>
          <p className="mt-1 text-[10px] leading-snug text-ink-faint">
            {t("照平台設定:只標記能量低於 -96 的態,marked set 極小、極難找")}
          </p>
        </div>
      </div>

      <Prose>
        {t("藍點是門檻下降的時刻。每次採到更好的解,門檻就收緊、被標記的態變少,下一輪需要更多次旋轉才找得到 —— 這就是 BBHT 逐步加大 r 的機制。把")}
        <Mono> budget </Mono>
        {t("拉到 20 以下會看到它來不及收斂,正是平台 40q 那次")}
        <Mono> budget=1 </Mono>
        {t("只拿到 {v} 的原因。", { v: result40.best_objective.toFixed(2) })}
      </Prose>
      <Caveat>
        {t("這裡的 oracle 直接作用在 16 個 key qubit 上(用古典已知的能量判斷)。硬體上同一個 oracle 要靠 QFT 算術把 w(x) 寫進 value register 再讀符號位,那才是 16 key + 24 val = 40 qubit 的來源。兩者標記的態完全相同,放大動力學一致;差別在閘數 —— 那正是 40q 單輪要 {h} 的原因。", { h: fmtHours(result40.wallclock_sec) })}
      </Caveat>
    </Card>
  );
}

/* --------------------------------------------------- Amplification anatomy */

function AmplificationCard({ energies }: { energies: Float64Array }) {
  const { t } = useI18n();
  const [threshold, setThreshold] = useState(-96);
  const [rotations, setRotations] = useState(60);

  const { probs, nMarked, optimalR } = useMemo(
    () => amplificationCurve(energies, threshold, rotations),
    [energies, threshold, rotations],
  );
  const peak = Math.max(...probs);
  const peakAt = probs.indexOf(peak);

  return (
    <Card
      title={t("振幅放大解剖")}
      subtitle={t("固定門檻下,每旋轉一次測一次命中機率")}
      right={<Chip label={t("{n} 個標記態", { n: nMarked })} tone="quantum" />}
    >
      <LineChart
        series={[{ values: probs, color: "var(--color-quantum)" }]}
        refLines={[{ value: 1, color: "var(--color-border)", label: "100%" }]}
        markers={[{ index: peakAt, color: "var(--color-gold)" }]}
        xLabel={t("Grover 旋轉次數")}
        height={140}
      />
      <div className="mt-2 flex gap-3">
        <Stat label={t("起始機率")} value={`${(probs[0] * 100).toFixed(3)}%`} tone="faint" />
        <Stat label={t("峰值")} value={`${(peak * 100).toFixed(1)}%`} tone="gold" />
        <Stat label={t("峰值位置")} value={String(peakAt)} unit={t("轉")} tone="quantum" />
        <Stat label={t("理論 √(N/M)")} value={String(optimalR)} unit={t("轉")} />
      </div>

      <div className="mt-4 grid gap-x-6 sm:grid-cols-2">
        <Slider label={t("門檻 y")} value={threshold} min={-97.5} max={-40} step={0.5}
          onChange={setThreshold} format={(v) => v.toFixed(1)}
          hint={t("越接近最優,被標記的態越少、越難找")} tone="bad" />
        <Slider label={t("旋轉上限")} value={rotations} min={5} max={300} step={5}
          onChange={setRotations} format={(v) => v.toFixed(0)} tone="quantum" />
      </div>

      <Prose>
        {t("實測峰值落在")} <Mono>{peakAt}</Mono> {t("轉,理論估計")} <Mono>{optimalR}</Mono>{" "}
        {t("轉 —— 這是真的在跑 2^16 個振幅,不是把公式畫出來。繼續轉下去機率會掉回來(過度旋轉),這也是 Grover 必須知道何時停手的原因。把門檻拉到 -97.4 會只剩 1 個標記態,需要約 200 轉。")}
      </Prose>
    </Card>
  );
}

/* -------------------------------------------------------------------- QAOA */

function QaoaCard({ energies, optimum }: { energies: Float64Array; optimum: number }) {
  const { t } = useI18n();
  const [p, setP] = useState(DEFAULT_QAOA_PARAMS.p);
  const [maxIter, setMaxIter] = useState(DEFAULT_QAOA_PARAMS.maxIter);
  const [seed, setSeed] = useState(7);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState(() =>
    runQaoa(energies, meta.n_qubits, DEFAULT_QAOA_PARAMS));

  const run = () =>
    startTransition(() => setResult(runQaoa(energies, meta.n_qubits, { p, maxIter, seed })));

  const sampledHit = Math.abs(result.bestSampledEnergy - optimum) < 1e-9;

  return (
    <Card
      title="QAOA"
      subtitle={t("p={p} 深度｜完整 2^16 態向量演化", { p })}
      right={<Chip label={pending ? t("計算中…") : t("{n} 次評估", { n: result.evaluations })} tone="quantum" />}
    >
      <LineChart
        series={[{ values: result.convergence, color: "var(--color-quantum)" }]}
        refLines={[{ value: optimum, color: "var(--color-good)", label: t("最優") }]}
        xLabel={t("Nelder-Mead 迭代")}
        yLabel="⟨C⟩"
        height={140}
      />
      <div className="mt-2 flex gap-3">
        <Stat label={t("期望值")} value={result.bestExpectation.toFixed(2)} tone="quantum" />
        <Stat label={t("採樣最佳")} value={result.bestSampledEnergy.toFixed(4)}
          tone={sampledHit ? "good" : "warn"} />
        <Stat label={t("P(最優)")} value={`${(result.optimumProbability * 100).toFixed(3)}%`} tone="gold" />
      </div>

      <div className="mt-4 grid gap-x-6 sm:grid-cols-2">
        <Slider label={t("p(電路深度)")} value={p} min={1} max={5} step={1}
          onChange={setP} format={(v) => v.toFixed(0)}
          hint={t("每層 = 一個成本相位 + 一個混合層")} tone="quantum" />
        <Slider label={t("最大迭代")} value={maxIter} min={10} max={150} step={5}
          onChange={setMaxIter} format={(v) => v.toFixed(0)} />
        <Slider label={t("亂數種子")} value={seed} min={1} max={40} step={1}
          onChange={setSeed} format={(v) => v.toFixed(0)} tone="faint"
          hint={t("初始角度隨機,會落進不同局部解")} />
        <div className="mb-4">
          <button type="button" onClick={run} disabled={pending}
            className="w-full rounded-lg border border-quantum bg-quantum px-3 py-2 text-xs font-bold text-bg transition-opacity hover:opacity-85 disabled:opacity-50">
            {pending ? t("計算中…") : t("重新執行 QAOA")}
          </button>
          <p className="mt-1 text-[10px] leading-snug text-ink-faint">
            {t("約 0.3–1 秒,故改參數後手動觸發")}
          </p>
        </div>
      </div>

      <div className="mt-2">
        <div className="mb-2 text-[10px] uppercase tracking-wide text-ink-faint">{t("最可能的量測結果")}</div>
        {result.topStates.slice(0, 5).map((s) => (
          <Bar key={s.z} label={`E = ${s.energy.toFixed(3)}`} value={s.prob}
            max={result.topStates[0].prob}
            color={Math.abs(s.energy - optimum) < 1e-9 ? "var(--color-gold)" : "var(--color-quantum)"}
            caption={`${(s.prob * 100).toFixed(3)}%`}
            highlight={Math.abs(s.energy - optimum) < 1e-9} />
        ))}
      </div>

      <Prose>
        {t("⟨C⟩ 是能量期望值,不是採樣到的最低值 —— 均勻疊加態的期望值是 0,優化後降到約 -60,但採樣仍會抽到")}{" "}
        <Mono>{result.bestSampledEnergy.toFixed(4)}</Mono>
        {t("。這就是報告裡「收斂到 -44.79、但命中 -97.4936」看似矛盾的原因:兩個是不同的量。")}
      </Prose>
    </Card>
  );
}

/* ---------------------------------------------------------------------- SA */

function SaCard({ energies, optimum }: { energies: Float64Array; optimum: number }) {
  const { t } = useI18n();
  const [iterations, setIterations] = useState(DEFAULT_SA_PARAMS.iterations);
  const [startTemp, setStartTemp] = useState(DEFAULT_SA_PARAMS.startTemp);
  const [seed, setSeed] = useState(7);

  const result = useMemo(
    () => runSa(energies, meta.n_qubits, { ...DEFAULT_SA_PARAMS, iterations, startTemp, seed }),
    [energies, iterations, startTemp, seed],
  );
  const ratio = result.bestEnergy / optimum;
  const hit = Math.abs(result.bestEnergy - optimum) < 1e-9;

  return (
    <Card
      title={t("模擬退火(古典對照)")}
      subtitle={t("單位元翻轉 + 幾何降溫")}
      right={<Chip label={hit ? t("命中最優") : t("近似比 {r}", { r: ratio.toFixed(4) })} tone={hit ? "good" : "warn"} />}
    >
      <LineChart
        series={[{ values: result.trace, color: "var(--color-warn)" }]}
        refLines={[{ value: optimum, color: "var(--color-good)", label: t("最優") }]}
        xLabel={t("退火進度")}
        height={130}
      />
      <div className="mt-2 flex gap-3">
        <Stat label={t("最佳")} value={result.bestEnergy.toFixed(4)} tone={hit ? "good" : "warn"} />
        <Stat label={t("近似比")} value={ratio.toFixed(4)} tone="gold" />
        <Stat label={t("接受率")} value={`${((result.accepted / iterations) * 100).toFixed(0)}%`} />
      </div>

      <div className="mt-4 grid gap-x-6 sm:grid-cols-2">
        <Slider label={t("迭代數")} value={iterations} min={200} max={20000} step={200}
          onChange={setIterations} format={(v) => v.toLocaleString()} tone="warn" />
        <Slider label={t("起始溫度")} value={startTemp} min={1} max={200} step={1}
          onChange={setStartTemp} format={(v) => v.toFixed(0)} tone="warn"
          hint={t("太低會卡在局部解,太高等於亂數搜尋")} />
        <Slider label={t("亂數種子")} value={seed} min={1} max={40} step={1}
          onChange={setSeed} format={(v) => v.toFixed(0)} tone="faint" />
      </div>

      <Prose>
        {t("古典基準線。報告中 SA 拿到 -96.8297(近似比 0.9932),QAOA 則命中 -97.4936。把迭代數拉低或起始溫度調小,可以看到它卡在局部解 —— 那正是組合最佳化的難處。")}
      </Prose>
    </Card>
  );
}
