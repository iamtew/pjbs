// Named palettes + isometric cube field used by the catalog and bgs/cubes.html.

export const PALS = {
  prism: { h0: 0, span: 360, sat: 62 },
  magma: { h0: 8, span: 42, sat: 86 },
  abyss: { h0: 186, span: 38, sat: 72 },
  toxic: { h0: 82, span: 36, sat: 82 },
  candy: { h0: 318, span: 40, sat: 78 },
  noir: { h0: 220, span: 18, sat: 5, lift: -14 },
  solar: { h0: 44, span: 26, sat: 92 },
  royal: { h0: 252, span: 28, sat: 68 },
  crimson: { h0: 348, span: 20, sat: 82 },
  foam: { h0: 162, span: 24, sat: 48 },
  chrome: { h0: 208, span: 14, sat: 14, lift: 10 },
};

export function layoutCells(size, w, h) {
  const horiz = size * Math.sqrt(3);
  const vert = size * 1.5;
  const cols = Math.ceil(w / horiz) + 3;
  const rows = Math.ceil(h / vert) + 3;
  const midX = w * 0.5;
  const midY = h * 0.5;
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: (col - 1) * horiz + ((row & 1) ? horiz * 0.5 : 0),
        y: (row - 1) * vert,
        col,
        row,
      });
    }
  }
  cells.sort((a, b) => {
    const da = (a.x - midX) ** 2 + (a.y - midY) ** 2;
    const db = (b.x - midX) ** 2 + (b.y - midY) ** 2;
    return db - da;
  });
  return cells;
}

export function paintCubes(g, cells, t, st, hsl, w, h) {
  const pal = PALS[st.pal] || PALS.prism;
  const hx = w * 0.5;
  const hy = h * 0.5;
  g.clear();
  for (const cell of cells) {
    const cx = cell.x;
    const cy = cell.y;
    const nx = (cx - hx) / hx;
    const ny = (cy - hy) / hy;
    const d = Math.min(1, Math.hypot(nx, ny) / Math.SQRT2);
    const bulge = 1 - d * d;
    const breathe = 0.5 + 0.5 * Math.sin(t * 2.1 * st.speed - d * 2.4);
    const s = st.size * (1 + bulge * st.swell * (0.85 + 0.15 * breathe));
    const dx = s * Math.sqrt(3) / 2;
    const dy = s / 2;
    const wave = (Math.sin(cell.col * 0.35 + cell.row * 0.22 - t * st.wave) + 1) * 0.5;
    const phase = t * 0.8 * st.speed + cell.col * 0.4 + cell.row * 0.25;
    const lift = pal.lift || 0;
    const topL = 42 + 20 * wave + lift;
    const leftL = 26 + 14 * (0.5 + 0.5 * Math.sin(phase + 2.1)) + lift * 0.4;
    const rightL = 14 + 12 * (0.5 + 0.5 * Math.sin(phase + 4.2)) + Math.min(0, lift) * 0.5;
    const walk = t * st.hue + cell.col * 2.5 + cell.row * 1.5;
    const hCell = pal.h0 + ((walk % pal.span) + pal.span) % pal.span;

    const top = [
      cx, cy - s,
      cx + dx, cy - dy,
      cx, cy,
      cx - dx, cy - dy,
    ];
    const left = [
      cx, cy,
      cx - dx, cy - dy,
      cx - dx, cy - dy + s,
      cx, cy + s,
    ];
    const right = [
      cx, cy,
      cx + dx, cy - dy,
      cx + dx, cy - dy + s,
      cx, cy + s,
    ];

    const faces = [
      [top, hsl(hCell, pal.sat, topL)],
      [left, hsl(hCell, pal.sat * 0.94, leftL)],
      [right, hsl(hCell, pal.sat * 0.88, rightL)],
    ];
    for (const [pts, color] of faces) {
      g.poly(pts).fill({ color });
      g.poly(pts).stroke({ width: 1.2, color, alpha: 0.35 });
    }
  }
}
