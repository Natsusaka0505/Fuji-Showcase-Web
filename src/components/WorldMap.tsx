/**
 * Nine-port network on an equirectangular projection.
 *
 * Every candidate leg is drawn faintly so the search space stays visible, and
 * the currently optimal route is drawn over it in gold. Great circles are not
 * worth it at this scale — legs are straight lines, except that a leg crossing
 * the antimeridian (Rotterdam to Los Angeles is the one that matters) is split
 * so it leaves one edge of the map and re-enters the other instead of sweeping
 * back across the whole world.
 */
"use client";

import { memo } from "react";
import { ports, edgeData } from "@/data";
import { LandLayer } from "@/components/LandLayer";
import { placeLabels } from "@/components/labelLayout";
import { useI18n } from "@/lib/i18n";
import type { RouteSolution } from "@/engine/model";

const W = 360;
const H = 190;
const PAD = 12;
const LAT0 = 62;
const LAT1 = -8;

const project = (lat: number, lon: number) => ({
  x: PAD + ((lon + 180) / 360) * (W - 2 * PAD),
  y: PAD + ((LAT0 - lat) / (LAT0 - LAT1)) * (H - 2 * PAD),
});

const pos = new Map(ports.map((p) => [p.iso, project(p.lat, p.lon)]));

/** Risk drives the port dot colour: green through gold to red. */
function riskColor(risk: number) {
  const t = Math.min(1, Math.max(0, (risk - 8) / (53 - 8)));
  const lerp = (a: number, b: number, u: number) => Math.round(a + (b - a) * u);
  return t < 0.5
    ? `rgb(${lerp(63, 212, t * 2)},${lerp(185, 160, t * 2)},${lerp(107, 23, t * 2)})`
    : `rgb(${lerp(212, 224, (t - 0.5) * 2)},${lerp(160, 90, (t - 0.5) * 2)},${lerp(23, 79, (t - 0.5) * 2)})`;
}

type Pt = { x: number; y: number };

/** Split a leg that would otherwise sweep the wrong way across the map. */
function legs(a: Pt, b: Pt): [Pt, Pt][] {
  const span = W - 2 * PAD;
  if (Math.abs(b.x - a.x) <= span / 2) return [[a, b]];
  const goingRight = a.x > b.x;
  const dx = goingRight ? W - a.x + b.x : a.x + (W - b.x);
  const t = (goingRight ? W - a.x : a.x) / dx;
  const yMid = a.y + (b.y - a.y) * t;
  return goingRight
    ? [[a, { x: W, y: yMid }], [{ x: 0, y: yMid }, b]]
    : [[a, { x: 0, y: yMid }], [{ x: W, y: yMid }, b]];
}

export const WorldMap = memo(function WorldMap({
  route,
  blockedPorts,
  onPortClick,
}: {
  route: RouteSolution | null;
  blockedPorts: readonly string[];
  onPortClick?: (iso: string) => void;
}) {
  const { t } = useI18n();
  const onRouteLegs = new Set<string>();
  if (route) {
    for (let i = 0; i < route.routeIso.length - 1; i++) {
      onRouteLegs.add(`${route.routeIso[i]}>${route.routeIso[i + 1]}`);
    }
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t("九港航線網路圖")}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--color-bg)" />
        <LandLayer project={project} width={W} opacity={0.85} />
        {[1, 2, 3].map((i) => (
          <line key={`h${i}`} x1={0} y1={(H / 4) * i} x2={W} y2={(H / 4) * i}
            stroke="var(--color-grid)" strokeWidth={0.5} />
        ))}
        {[1, 2, 3, 4, 5].map((i) => (
          <line key={`v${i}`} x1={(W / 6) * i} y1={0} x2={(W / 6) * i} y2={H}
            stroke="var(--color-grid)" strokeWidth={0.5} />
        ))}

        {/* Candidate legs — the search space the optimiser chooses from. */}
        {edgeData.edges.map((e) => {
          if (onRouteLegs.has(`${e.origin_iso}>${e.destination_iso}`)) return null;
          const a = pos.get(e.origin_iso)!;
          const b = pos.get(e.destination_iso)!;
          const blocked =
            blockedPorts.includes(e.origin_iso) || blockedPorts.includes(e.destination_iso);
          return legs(a, b).map(([p, q], i) => (
            <line key={`${e.var_name}-${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
              stroke={blocked ? "var(--color-bad)" : "var(--color-border)"}
              strokeWidth={0.8}
              strokeDasharray={blocked ? "2 2" : undefined}
              opacity={blocked ? 0.5 : 0.9} />
          ));
        })}

        {/* The chosen route, on top and in gold. */}
        {route?.routeIso.slice(0, -1).map((from, i) => {
          const a = pos.get(from);
          const b = pos.get(route.routeIso[i + 1]);
          if (!a || !b) return null;
          return legs(a, b).map(([p, q], j) => (
            <line key={`r${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
              stroke="var(--color-gold)" strokeWidth={2.2} strokeLinecap="round" />
          ));
        })}

        {ports.map((p) => {
          const { x, y } = pos.get(p.iso)!;
          const onRoute = route?.routeIso.includes(p.iso) ?? false;
          const blocked = blockedPorts.includes(p.iso);
          return (
            <g key={p.iso} onClick={() => onPortClick?.(p.iso)}
              className={onPortClick ? "cursor-pointer" : undefined}>
              <title>{`${p.name}｜${t("風險")} ${p.port_risk.toFixed(1)}${blocked ? `｜${t("已封鎖")}` : ""}`}</title>
              {onRoute && <circle cx={x} cy={y} r={7} fill="var(--color-gold)" opacity={0.22} />}
              <circle cx={x} cy={y} r={onRoute ? 4.2 : 3.2}
                fill={blocked ? "var(--color-bg)" : riskColor(p.port_risk)}
                stroke={blocked ? "var(--color-bad)" : onRoute ? "var(--color-gold)" : "var(--color-bg)"}
                strokeWidth={blocked ? 1.6 : 1.2} />
              {blocked && (
                <path d={`M${x - 2.6},${y - 2.6}L${x + 2.6},${y + 2.6}M${x + 2.6},${y - 2.6}L${x - 2.6},${y + 2.6}`}
                  stroke="var(--color-bad)" strokeWidth={1.4} strokeLinecap="round" />
              )}
              {/* Generous invisible hit area — the dots are far too small to tap. */}
              <circle cx={x} cy={y} r={11} fill="transparent" />
            </g>
          );
        })}
        {/* Labels in a separate pass so neighbours (HKG / KHH) get pushed apart. */}
        {placeLabels(
          ports.map((p) => ({ ...pos.get(p.iso)!, text: p.iso })),
          { fontSize: 7, dotR: 4.2, width: W, height: H },
        ).map((l) => {
          const p = ports.find((q) => q.iso === l.text)!;
          const onRoute = route?.routeIso.includes(p.iso) ?? false;
          const blocked = blockedPorts.includes(p.iso);
          return (
            <text key={l.text} x={l.x} y={l.y} fontSize={7} fontWeight="700" textAnchor={l.anchor}
              fill={blocked ? "var(--color-bad)" : onRoute ? "var(--color-gold)" : "var(--color-ink-faint)"}
              stroke="var(--color-bg)" strokeWidth={2} paintOrder="stroke"
              className="pointer-events-none select-none">
              {l.text}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Legend color="var(--color-gold)" label={t("最佳航線")} />
        <Legend color="var(--color-border)" label={t("候選航段")} />
        <Legend color={riskColor(50)} label={t("高風險港")} />
        <Legend color="var(--color-bad)" label={t("封鎖")} />
      </div>
    </div>
  );
});

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-ink-faint">{label}</span>
    </span>
  );
}
