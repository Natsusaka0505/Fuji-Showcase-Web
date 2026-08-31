/**
 * Figure 2 of the report, redrawn as an interactive map.
 *
 * Longitudes are Pacific-unwrapped (anything west of -20 gets +360) so the
 * trans-Pacific route reads as one continuous line instead of being torn at the
 * antimeridian — the same trick the printed figure uses. Because the frame is
 * shifted, the coastlines are projected through the same unwrap.
 */
"use client";

import { LandLayer } from "@/components/LandLayer";
import v2 from "@/data/q9_data/app_data_v2.json";

const W = 360;
const H = 176;
const PAD = 14;
const LON0 = -12;
const LON1 = 300;
const LAT0 = 66;
const LAT1 = -14;

const unwrap = (lon: number) => (lon < LON0 ? lon + 360 : lon);

const project = (lat: number, lon: number) => ({
  x: PAD + ((unwrap(lon) - LON0) / (LON1 - LON0)) * (W - 2 * PAD),
  y: PAD + ((LAT0 - lat) / (LAT0 - LAT1)) * (H - 2 * PAD),
});

const PORTS = v2.ports as Record<string, { lat: number; lon: number }>;

export function RouteFlipMap({
  off,
  on,
  showOn,
  labels,
}: {
  off: string[];
  on: string[];
  /** Which side of the flip is in force. */
  showOn: boolean;
  labels: { off: string; on: string };
}) {
  const path = (route: string[]) =>
    route
      .map((name, i) => {
        const p = PORTS[name];
        if (!p) return "";
        const { x, y } = project(p.lat, p.lon);
        return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("");

  const dots = (route: string[], color: string) =>
    route.map((name) => {
      const p = PORTS[name];
      if (!p) return null;
      const { x, y } = project(p.lat, p.lon);
      return <circle key={name} cx={x} cy={y} r={3} fill={color} stroke="var(--color-bg)" strokeWidth={1} />;
    });

  const active = showOn ? on : off;
  const activeColor = showOn ? "var(--color-bad)" : "var(--color-quantum)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={showOn ? labels.on : labels.off}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--color-bg)" />
      <LandLayer project={project} width={W} opacity={0.8} />

      {/* The inactive route stays faintly visible so the flip is legible. */}
      <path d={path(showOn ? off : on)} fill="none" strokeWidth={1.2} strokeDasharray="3 3"
        stroke={showOn ? "var(--color-quantum)" : "var(--color-bad)"} opacity={0.35} />
      <path d={path(active)} fill="none" stroke={activeColor} strokeWidth={2.4}
        strokeLinecap="round" strokeLinejoin="round" />
      {dots(active, activeColor)}

      {active.map((name) => {
        const p = PORTS[name];
        if (!p) return null;
        const { x, y } = project(p.lat, p.lon);
        const flip = x > W * 0.72;
        return (
          <text key={name} x={flip ? x - 5 : x + 5} y={y - 5} fontSize={7} fontWeight="700"
            textAnchor={flip ? "end" : "start"} fill={activeColor} className="select-none">
            {name}
          </text>
        );
      })}
    </svg>
  );
}
