/**
 * Coastlines behind the route maps.
 *
 * The rings ship as raw lon/lat and are projected here, so each map keeps its
 * own latitude window instead of sharing a pre-baked path. A ring that would
 * span more than half the map is one that wraps the antimeridian, which
 * equirectangular projection tears into a stripe across the whole world; those
 * are dropped rather than drawn wrong.
 */
import { memo } from "react";
import landData from "@/data/land.json";

const RINGS = (landData as { rings: number[][] }).rings;

export const LandLayer = memo(function LandLayer({
  project,
  width,
  fill = "var(--color-grid)",
  stroke = "var(--color-border)",
  opacity = 1,
}: {
  project: (lat: number, lon: number) => { x: number; y: number };
  width: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
}) {
  const paths: string[] = [];
  for (const ring of RINGS) {
    let d = "";
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < ring.length; i += 2) {
      const { x, y } = project(ring[i + 1], ring[i]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      d += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    if (maxX - minX > width * 0.5) continue; // wraps the antimeridian
    paths.push(d + "Z");
  }

  return (
    <g pointerEvents="none" opacity={opacity} aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} fill={fill} stroke={stroke} strokeWidth={0.4} strokeLinejoin="round" />
      ))}
    </g>
  );
});
