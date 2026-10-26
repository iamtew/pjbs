// Shared Pixi boot + the glow tricks from audio.stupid.systems/fx.js.
// Scenes import helpers; boot() hands them a ready app and a soft-dot texture.

const PIXI_URL = 'https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.mjs';

export const pointer = { x: 0.5, y: 0.5 };
addEventListener('pointermove', (e) => {
  pointer.x = e.clientX / innerWidth;
  pointer.y = e.clientY / innerHeight;
}, { passive: true });

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const rand = (lo, hi) => lo + Math.random() * (hi - lo);

export function hsl(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

export function wrap(s, w, h, m = 40) {
  if (s.x < -m) s.x += w + 2 * m; else if (s.x > w + m) s.x -= w + 2 * m;
  if (s.y < -m) s.y += h + 2 * m; else if (s.y > h + m) s.y -= h + 2 * m;
}

// Soft white radial; tint + additive blend per sprite.
export function glowTexture(PIXI, size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.5)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return PIXI.Texture.from(c);
}

export function glowSprite(PIXI, tex, tint) {
  const s = new PIXI.Sprite(tex);
  s.anchor.set(0.5);
  s.tint = tint;
  s.blendMode = 'add';
  return s;
}

// Fake bloom: wide+faint, then narrow+bright. Path is rebuilt per pass
// because Pixi v8 clears it after stroke().
export const GLOW_PASSES = [[22, 0.05], [10, 0.14], [2.5, 1]];
export function glowLine(g, pts, color, scale = 1, passes = GLOW_PASSES) {
  for (const [width, alpha] of passes) {
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.stroke({ width: width * scale, color, alpha, cap: 'round', join: 'round' });
  }
}

export async function boot(setup, opts = {}) {
  const PIXI = await import(PIXI_URL);
  const app = new PIXI.Application();
  await app.init({
    resizeTo: window,
    background: opts.background ?? 0x050508,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(devicePixelRatio || 1, 2),
    preference: 'webgl',
  });
  app.canvas.style.position = 'relative';
  app.canvas.style.zIndex = '1';
  document.body.appendChild(app.canvas);

  const glow = glowTexture(PIXI);
  setup(app, PIXI, glow);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) app.ticker.stop(); else app.ticker.start();
  });
}
