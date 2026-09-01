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
import { placeLabels, arcPath } from "@/components/labelLayout";
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
  // Both routes share Shanghai → Taicang; opposite bulges keep them apart.
  const path = (route: string[], bulge: number) => {
    const pts = route.map((name) => PORTS[name]).filter(Boolean).map((p) => project(p.lat, p.lon));
    return pts.slice(0, -1).map((a, i) => arcPath(a, pts[i + 1], bulge)).join("");
  };

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
      <path d={path(showOn ? off : on, showOn ? -0.08 : 0.08)} fill="none" strokeWidth={1.2} strokeDasharray="3 3"
        stroke={showOn ? "var(--color-quantum)" : "var(--color-bad)"} opacity={0.35} />
      <path d={path(active, showOn ? 0.08 : -0.08)} fill="none" stroke={activeColor} strokeWidth={2.4}
        strokeLinecap="round" strokeLinejoin="round" />
      {dots(active, activeColor)}

      {placeLabels(
        active.flatMap((name) => {
          const p = PORTS[name];
          if (!p) return [];
          const { x, y } = project(p.lat, p.lon);
          return [{ x, y, text: name }];
        }),
        { fontSize: 7, dotR: 3, width: W, height: H },
      ).map((l) => (
        <text key={l.text} x={l.x} y={l.y} fontSize={7} fontWeight="700"
          textAnchor={l.anchor} fill={activeColor} stroke="var(--color-bg)" strokeWidth={2} paintOrder="stroke"
          className="select-none">
          {l.text}
        </text>
      ))}
    </svg>
  );
}
