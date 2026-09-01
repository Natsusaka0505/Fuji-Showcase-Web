/**
 * Greedy label placement for the route maps.
 *
 * East-Asian ports sit a few pixels apart at map scale (Shanghai / Taicang /
 * Ningbo), so labels stacked at a fixed offset overprint each other. Each
 * label tries four anchors in order — above, below, right, left — and takes
 * the first whose box clears every label already placed and every port dot.
 * If none clears, "above" is kept: an overlap is still better than a missing
 * name. Pure function so the maps stay memo-friendly.
 */
export type Placed = { x: number; y: number; anchor: "middle" | "start" | "end"; text: string };

export function placeLabels(
  items: { x: number; y: number; text: string }[],
  opts: { fontSize: number; dotR?: number; gap?: number; width: number; height: number },
): Placed[] {
  const { fontSize } = opts;
  const dotR = opts.dotR ?? 4;
  const gap = opts.gap ?? 2;
  const charW = fontSize * 0.68; // bold sans at map scale
  const boxes: [number, number, number, number][] = items.map(({ x, y }) => [x - dotR, y - dotR, x + dotR, y + dotR]);
  const out: Placed[] = [];
  const clear = (b: [number, number, number, number]) =>
    b[0] >= 0 && b[1] >= 0 && b[2] <= opts.width && b[3] <= opts.height &&
    boxes.every((o) => b[2] + gap <= o[0] || b[0] - gap >= o[2] || b[3] + gap <= o[1] || b[1] - gap >= o[3]);
  for (const it of items) {
    const w = it.text.length * charW;
    const h = fontSize;
    const cands: { p: Placed; box: [number, number, number, number] }[] = [
      { p: { x: it.x, y: it.y - dotR - 2, anchor: "middle", text: it.text }, box: [it.x - w / 2, it.y - dotR - 2 - h, it.x + w / 2, it.y - dotR - 2] },
      { p: { x: it.x, y: it.y + dotR + h, anchor: "middle", text: it.text }, box: [it.x - w / 2, it.y + dotR, it.x + w / 2, it.y + dotR + h + 1] },
      { p: { x: it.x + dotR + 2, y: it.y + h * 0.35, anchor: "start", text: it.text }, box: [it.x + dotR + 2, it.y - h / 2, it.x + dotR + 2 + w, it.y + h / 2] },
      { p: { x: it.x - dotR - 2, y: it.y + h * 0.35, anchor: "end", text: it.text }, box: [it.x - dotR - 2 - w, it.y - h / 2, it.x - dotR - 2, it.y + h / 2] },
    ];
    // Diagonals come after the four cardinal spots — legible, just less tidy.
    const up = it.y - dotR - 1, dn = it.y + dotR + h;
    cands.push(
      { p: { x: it.x + dotR, y: up, anchor: "start", text: it.text }, box: [it.x + dotR, up - h, it.x + dotR + w, up] },
      { p: { x: it.x - dotR, y: up, anchor: "end", text: it.text }, box: [it.x - dotR - w, up - h, it.x - dotR, up] },
      { p: { x: it.x + dotR, y: dn, anchor: "start", text: it.text }, box: [it.x + dotR, dn - h, it.x + dotR + w, dn] },
      { p: { x: it.x - dotR, y: dn, anchor: "end", text: it.text }, box: [it.x - dotR - w, dn - h, it.x - dotR, dn] },
    );
    let pick = cands.find((c) => clear(c.box));
    if (!pick) {
      // Nothing clears: keep "above" but slide it inside the frame so it is
      // at least fully readable.
      const cx = Math.min(Math.max(it.x, w / 2 + 1), opts.width - w / 2 - 1);
      pick = { p: { x: cx, y: it.y - dotR - 2, anchor: "middle", text: it.text }, box: [cx - w / 2, it.y - dotR - 2 - h, cx + w / 2, it.y - dotR - 2] };
    }
    out.push(pick.p);
    boxes.push(pick.box);
  }
  return out;
}

/**
 * Quadratic arc between two points, bulging perpendicular to the chord by
 * `bulge` × chord length. Routes that share a leg (classical optimum, tier-1,
 * tier-2 nearly always do) get distinct bulges so they fan out instead of
 * overprinting; bulge 0 is a straight line. `minOffset` (viewBox units) floors
 * the perpendicular offset so a short chord still fans visibly; default 0
 * keeps the pure proportional arc.
 */
export function arcPath(a: { x: number; y: number }, b: { x: number; y: number }, bulge: number, minOffset = 0): string {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const off = bulge === 0 ? 0 : Math.sign(bulge) * Math.max(Math.abs(bulge) * len, minOffset);
  const cx = (a.x + b.x) / 2 - (dy / len) * off;
  const cy = (a.y + b.y) / 2 + (dx / len) * off;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)}Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}
