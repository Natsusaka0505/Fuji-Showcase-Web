#!/usr/bin/env python3
"""Build the coastline layer the maps draw behind their routes.

Natural Earth's 110m land polygons are already far coarser than a shipping map
needs, so this drops the specks, thins the vertices with Douglas-Peucker and
rounds what survives to a tenth of a degree — roughly 11 km, well under one
pixel at the size these maps render. The result ships as flat coordinate rings
rather than pre-projected SVG paths, so both maps keep projecting them with
their own latitude windows.

Source: Natural Earth 110m land (public domain).
Run: python3 tools/build_land.py   (needs the GeoJSON path as argv[1])
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src/data/land.json"

# Rings smaller than this in square degrees are specks at our render size.
MIN_AREA = 3.0
# Douglas-Peucker tolerance in degrees.
TOLERANCE = 0.35
# Antarctica runs off the bottom of every window we draw; keep the coast only.
LAT_FLOOR = -60.0


def ring_area(ring: list[tuple[float, float]]) -> float:
    """Shoelace area, unsigned."""
    a = 0.0
    for i in range(len(ring) - 1):
        x0, y0 = ring[i]
        x1, y1 = ring[i + 1]
        a += x0 * y1 - x1 * y0
    return abs(a) / 2


def perp_distance(p, a, b) -> float:
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return ((px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2) ** 0.5


def simplify(points, tol):
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        lo, hi = stack.pop()
        worst, worst_i = 0.0, -1
        for i in range(lo + 1, hi):
            d = perp_distance(points[i], points[lo], points[hi])
            if d > worst:
                worst, worst_i = d, i
        if worst > tol:
            keep[worst_i] = True
            stack.append((lo, worst_i))
            stack.append((worst_i, hi))
    return [p for p, k in zip(points, keep) if k]


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "land.geojson")
    gj = json.loads(src.read_text())

    rings: list[list[float]] = []
    for feature in gj["features"]:
        geom = feature["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        for poly in polys:
            outer = [(float(x), float(y)) for x, y in poly[0]]  # holes are invisible here
            if ring_area(outer) < MIN_AREA:
                continue
            thinned = simplify(outer, TOLERANCE)
            if len(thinned) < 4:
                continue
            flat: list[float] = []
            for x, y in thinned:
                flat.append(round(x, 1))
                flat.append(round(max(y, LAT_FLOOR), 1))
            rings.append(flat)

    rings.sort(key=len, reverse=True)
    OUT.write_text(json.dumps({
        "source": "Natural Earth 110m land (public domain)",
        "note": "flat [lon, lat, ...] rings, 0.1 deg resolution; project at render time",
        "rings": rings,
    }, separators=(",", ":")))
    pts = sum(len(r) // 2 for r in rings)
    print(f"[land] {len(rings)} rings, {pts} points -> {OUT.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
