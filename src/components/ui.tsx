/** Shared building blocks: cards, stats, chips, sliders, toggles. */
"use client";

import type { ReactNode } from "react";

export function Card({ title, subtitle, right, children, className = "" }: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-xl border border-border bg-surface p-4 ${className}`}>
      {(title || right) && (
        <header className="mb-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-sm font-bold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11px] text-ink-faint">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

const TONE = {
  ink: "text-ink",
  gold: "text-gold",
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
  quantum: "text-quantum",
  faint: "text-ink-faint",
} as const;

export type Tone = keyof typeof TONE;

export function Stat({ label, value, unit, tone = "ink" }: {
  label: string;
  value: string;
  unit?: string;
  tone?: Tone;
}) {
  return (
    <div className="min-w-[72px] flex-1">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className={`font-mono text-base font-bold tabular-nums ${TONE[tone]}`}>{value}</span>
        {unit && <span className="text-[10px] text-ink-faint">{unit}</span>}
      </div>
    </div>
  );
}

const CHIP: Record<Tone, string> = {
  ink: "border-ink text-ink",
  gold: "border-gold text-gold",
  good: "border-good text-good",
  warn: "border-warn text-warn",
  bad: "border-bad text-bad",
  quantum: "border-quantum text-quantum",
  faint: "border-ink-faint text-ink-faint",
};

const CHIP_FILLED: Record<Tone, string> = {
  ink: "bg-ink text-bg border-ink",
  gold: "bg-gold text-bg border-gold",
  good: "bg-good text-bg border-good",
  warn: "bg-warn text-bg border-warn",
  bad: "bg-bad text-bg border-bad",
  quantum: "bg-quantum text-bg border-quantum",
  faint: "bg-ink-faint text-bg border-ink-faint",
};

export function Chip({ label, tone = "faint", filled }: { label: string; tone?: Tone; filled?: boolean }) {
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${filled ? CHIP_FILLED[tone] : CHIP[tone]}`}>
      {label}
    </span>
  );
}

const TRACK: Record<Tone, string> = {
  ink: "var(--color-ink)",
  gold: "var(--color-gold)",
  good: "var(--color-good)",
  warn: "var(--color-warn)",
  bad: "var(--color-bad)",
  quantum: "var(--color-quantum)",
  faint: "var(--color-ink-faint)",
};

export function Slider({ label, value, min, max, step = 0.01, onChange, format, hint, tone = "gold" }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label className="text-xs text-ink">{label}</label>
        <span className={`font-mono text-xs font-bold tabular-nums ${TONE[tone]}`}>
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--track-color" as string]: TRACK[tone] }}
        aria-label={label}
      />
      {hint && <p className="mt-1 text-[10px] leading-snug text-ink-faint">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, value, onChange, hint, tone = "warn" }: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="mb-2 flex w-full items-center gap-3 rounded-lg py-1.5 text-left transition-colors hover:bg-surface-alt"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] text-ink-faint">{hint}</span>}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
          value ? `${CHIP_FILLED[tone]} border-transparent` : "border-border bg-surface-alt"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
            value ? "left-[18px] bg-bg" : "left-0.5 bg-ink-faint"
          }`}
        />
      </span>
    </button>
  );
}

export function Select({ label, value, options, onChange, hint }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs text-ink">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-alt px-2 py-1.5 text-xs text-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-[10px] leading-snug text-ink-faint">{hint}</span>}
    </label>
  );
}

export function Route({ iso, className = "" }: { iso: string[]; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 ${className}`}>
      {iso.map((p, i) => (
        <span key={`${p}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span className="text-[11px] text-ink-faint">→</span>}
          <span className="font-mono text-xs font-bold text-ink">{p}</span>
        </span>
      ))}
    </div>
  );
}

/** Grey banner for numbers that are not verified against a primary source. */
export function Caveat({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-lg border-l-[3px] border-ink-faint bg-surface-alt p-2 text-[10px] leading-relaxed text-ink-dim">
      {children}
    </p>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-xs leading-relaxed text-ink-dim">{children}</p>;
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono font-bold text-ink">{children}</span>;
}
