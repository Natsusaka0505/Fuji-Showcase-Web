/** SVG charts. All drawn in a fixed viewBox and scaled to their container. */
"use client";

const W = 320;

/** Energy landscape of all 65 536 states, with markers for notable values. */
export function Histogram({ counts, binEdges, markers, height = 120 }: {
  counts: ArrayLike<number>;
  binEdges: ArrayLike<number>;
  markers?: { value: number; color: string; label: string }[];
  height?: number;
}) {
  const n = counts.length;
  const lo = binEdges[0];
  const hi = binEdges[n];
  let max = 0;
  for (let i = 0; i < n; i++) max = Math.max(max, counts[i]);
  // Counts span orders of magnitude, so a log scale is the only way the sparse
  // low-energy tail — the part that matters — stays visible next to the bulk.
  const scale = (v: number) => (v <= 0 ? 0 : Math.log1p(v) / Math.log1p(max));
  const bw = W / n;
  const xOf = (v: number) => ((v - lo) / (hi - lo || 1)) * W;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="能量分布直方圖">
      {Array.from({ length: n }, (_, i) => {
        const h = scale(counts[i]) * (height - 18);
        return h <= 0 ? null : (
          <rect key={i} x={i * bw} y={height - 13 - h} width={Math.max(bw - 0.4, 0.6)} height={h}
            fill="var(--color-quantum)" opacity={0.55} />
        );
      })}
      <line x1={0} y1={height - 13} x2={W} y2={height - 13} stroke="var(--color-border)" strokeWidth={1} />
      {markers?.map((m, i) => (
        <line key={i} x1={xOf(m.value)} y1={4} x2={xOf(m.value)} y2={height - 13}
          stroke={m.color} strokeWidth={1.4} strokeDasharray="3 2" />
      ))}
      {markers?.map((m, i) => (
        <text key={`t${i}`} x={Math.min(W - 2, xOf(m.value) + 3)} y={11}
          fontSize={8} fontWeight="700" fill={m.color}>{m.label}</text>
      ))}
      <text x={0} y={height - 2} fontSize={8} fill="var(--color-ink-faint)">{lo.toFixed(0)}</text>
      <text x={W} y={height - 2} fontSize={8} fill="var(--color-ink-faint)" textAnchor="end">{hi.toFixed(0)}</text>
    </svg>
  );
}

/** Penalty sweep: how many states can beat the best legal route, versus A. */
export function SweepChart({ points, current, height = 130 }: {
  points: { penalty_A: number; n_below_best_clean: number }[];
  current: number;
  height?: number;
}) {
  const maxA = points[points.length - 1].penalty_A;
  const maxN = Math.max(...points.map((p) => p.n_below_best_clean), 1);
  const xOf = (a: number) => (a / maxA) * W;
  const yOf = (v: number) => height - 15 - (Math.log1p(v) / Math.log1p(maxN)) * (height - 24);
  const d = points
    .map((p, i) => `${i ? "L" : "M"}${xOf(p.penalty_A).toFixed(2)},${yOf(p.n_below_best_clean).toFixed(2)}`)
    .join(" ");
  const critical = points.find((p) => p.n_below_best_clean === 0)?.penalty_A ?? 0;
  const nearest = points.reduce((a, b) =>
    Math.abs(b.penalty_A - current) < Math.abs(a.penalty_A - current) ? b : a);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="penalty 掃描曲線">
      <rect x={0} y={0} width={xOf(critical)} height={height - 15} fill="var(--color-bad)" opacity={0.09} />
      <path d={d} stroke="var(--color-bad)" strokeWidth={1.6} fill="none" />
      <line x1={xOf(critical)} y1={0} x2={xOf(critical)} y2={height - 15}
        stroke="var(--color-good)" strokeWidth={1.2} strokeDasharray="3 2" />
      <text x={xOf(critical) + 3} y={10} fontSize={8} fontWeight="700" fill="var(--color-good)">
        A*={critical.toFixed(2)}
      </text>
      <line x1={xOf(current)} y1={0} x2={xOf(current)} y2={height - 15}
        stroke="var(--color-gold)" strokeWidth={1.6} />
      <circle cx={xOf(current)} cy={yOf(nearest.n_below_best_clean)} r={3} fill="var(--color-gold)" />
      <line x1={0} y1={height - 15} x2={W} y2={height - 15} stroke="var(--color-border)" strokeWidth={1} />
      <text x={0} y={height - 3} fontSize={8} fill="var(--color-ink-faint)">A=0</text>
      <text x={W} y={height - 3} fontSize={8} fill="var(--color-ink-faint)" textAnchor="end">A={maxA}</text>
    </svg>
  );
}

/** Horizontal bar for route comparisons. */
export function Bar({ label, value, max, color, caption, highlight }: {
  label: string;
  value: number;
  max: number;
  color: string;
  caption?: string;
  highlight?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, value / (max || 1)));
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className={`truncate text-xs ${highlight ? "font-bold text-gold" : "text-ink"}`}>{label}</span>
        {caption && (
          <span className={`shrink-0 font-mono text-xs tabular-nums ${highlight ? "text-gold" : "text-ink-dim"}`}>
            {caption}
          </span>
        )}
      </div>
      <div className="h-[7px] overflow-hidden rounded bg-surface-alt">
        <div className="h-full rounded transition-[width] duration-150"
          style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

/** Cost distribution with the mean and CVaR tail marked. */
export function TailChart({ samples, cvar, mean, height = 110 }: {
  samples: Float64Array;
  cvar: number;
  mean: number;
  height?: number;
}) {
  const n = samples.length;
  const lo = samples[0];
  const hi = samples[Math.floor(n * 0.995)];
  const bins = 56;
  const width = (hi - lo) / bins || 1;
  const counts = new Int32Array(bins);
  for (let i = 0; i < n; i++) {
    const b = Math.floor((samples[i] - lo) / width);
    if (b >= 0 && b < bins) counts[b]++;
  }
  let max = 0;
  for (const c of counts) max = Math.max(max, c);
  const bw = W / bins;
  const xOf = (v: number) => ((v - lo) / (hi - lo || 1)) * W;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="成本分布與尾部風險">
      {Array.from({ length: bins }, (_, i) => {
        const h = (counts[i] / (max || 1)) * (height - 20);
        const inTail = lo + i * width >= cvar;
        return h <= 0 ? null : (
          <rect key={i} x={i * bw} y={height - 13 - h} width={Math.max(bw - 0.5, 0.8)} height={h}
            fill={inTail ? "var(--color-bad)" : "var(--color-quantum)"} opacity={inTail ? 0.85 : 0.5} />
        );
      })}
      <line x1={xOf(mean)} y1={2} x2={xOf(mean)} y2={height - 13} stroke="var(--color-gold)" strokeWidth={1.4} />
      <text x={xOf(mean) + 3} y={10} fontSize={8} fontWeight="700" fill="var(--color-gold)">平均</text>
      <line x1={xOf(cvar)} y1={2} x2={xOf(cvar)} y2={height - 13}
        stroke="var(--color-bad)" strokeWidth={1.4} strokeDasharray="3 2" />
      <text x={Math.min(W - 2, xOf(cvar) + 3)} y={10} fontSize={8} fontWeight="700"
        fill="var(--color-bad)" textAnchor={xOf(cvar) > W - 40 ? "end" : "start"}>CVaR</text>
      <line x1={0} y1={height - 13} x2={W} y2={height - 13} stroke="var(--color-border)" strokeWidth={1} />
    </svg>
  );
}

/** Memory doubles per qubit; the log axis is the whole point. */
export function QubitScale({ points, height = 130 }: { points: number[]; height?: number }) {
  const bytesFor = (q: number) => Math.pow(2, q) * 16;
  const fmt = (b: number) => {
    const u = ["B", "KB", "MB", "GB", "TB", "PB"];
    let i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return `${b.toFixed(b < 10 ? 1 : 0)} ${u[i]}`;
  };
  const maxLog = Math.log2(bytesFor(Math.max(...points)));
  const minLog = Math.log2(bytesFor(14));
  const bw = W / points.length;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="qubit 數與記憶體需求">
      {points.map((q, i) => {
        const h = ((Math.log2(bytesFor(q)) - minLog) / (maxLog - minLog)) * (height - 30);
        const top = q === Math.max(...points);
        return (
          <g key={q}>
            <rect x={i * bw + bw * 0.18} y={height - 15 - h} width={bw * 0.64} height={h} rx={2}
              fill={top ? "var(--color-gold)" : q === 39 ? "var(--color-quantum)" : "var(--color-navy)"} />
            <text x={i * bw + bw / 2} y={height - 4} fontSize={8}
              fill="var(--color-ink-faint)" textAnchor="middle">{q}q</text>
            <text x={i * bw + bw / 2} y={height - 19 - h} fontSize={7} fontWeight="700"
              fill={top ? "var(--color-gold)" : "var(--color-ink-dim)"} textAnchor="middle">
              {fmt(bytesFor(q))}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={height - 15} x2={W} y2={height - 15} stroke="var(--color-border)" strokeWidth={1} />
    </svg>
  );
}

/** A single line series with optional reference lines. */
export function LineChart({ series, refLines, height = 130, yLabel, xLabel, markers }: {
  series: { values: ArrayLike<number>; color: string; label?: string }[];
  refLines?: { value: number; color: string; label: string }[];
  height?: number;
  yLabel?: string;
  xLabel?: string;
  /** Vertical marks at specific x indices. */
  markers?: { index: number; color: string }[];
}) {
  const all: number[] = [];
  for (const s of series) for (let i = 0; i < s.values.length; i++) all.push(s.values[i]);
  for (const r of refLines ?? []) all.push(r.value);
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (hi === lo) { hi += 1; lo -= 1; }
  const pad = (hi - lo) * 0.08;
  lo -= pad; hi += pad;
  const maxLen = Math.max(...series.map((s) => s.values.length), 2);
  const xOf = (i: number) => (i / (maxLen - 1)) * W;
  const yOf = (v: number) => height - 16 - ((v - lo) / (hi - lo)) * (height - 24);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={yLabel ?? "曲線圖"}>
      {refLines?.map((r, i) => (
        <g key={`ref${i}`}>
          <line x1={0} y1={yOf(r.value)} x2={W} y2={yOf(r.value)}
            stroke={r.color} strokeWidth={1} strokeDasharray="3 2" opacity={0.8} />
          <text x={W - 2} y={yOf(r.value) - 3} fontSize={8} fontWeight="700"
            fill={r.color} textAnchor="end">{r.label}</text>
        </g>
      ))}
      {markers?.map((m, i) => (
        <line key={`mk${i}`} x1={xOf(m.index)} y1={2} x2={xOf(m.index)} y2={height - 16}
          stroke={m.color} strokeWidth={1} opacity={0.35} />
      ))}
      {series.map((s, si) => {
        const d = Array.from({ length: s.values.length }, (_, i) =>
          `${i ? "L" : "M"}${xOf(i).toFixed(2)},${yOf(s.values[i]).toFixed(2)}`).join(" ");
        return <path key={si} d={d} stroke={s.color} strokeWidth={1.6} fill="none"
          strokeLinejoin="round" strokeLinecap="round" />;
      })}
      <line x1={0} y1={height - 16} x2={W} y2={height - 16} stroke="var(--color-border)" strokeWidth={1} />
      {xLabel && <text x={W} y={height - 3} fontSize={8} fill="var(--color-ink-faint)" textAnchor="end">{xLabel}</text>}
      {yLabel && <text x={0} y={height - 3} fontSize={8} fill="var(--color-ink-faint)">{yLabel}</text>}
    </svg>
  );
}
