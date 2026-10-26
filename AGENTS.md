# PJBS - PixiJS BackgroundS
repo is static website, hosted on GitHub pages.
repo has landing page, listing the different backgrounds.
backgrounds are individual HTML files that render an animation in the browser in full screen.
these animations will be used in OBS as backgrounds.
code can be shared between animations.

Look of the Stupid Audio catalog (`audio.stupid.systems/fx.js`): additive glow sprites, multi-pass bloom lines, flow fields — not flat dots.
Canvas fill is not required to be black; scenes may wash/hue the renderer background.

## Layout
- `index.html` — landing list of backgrounds
- `bgs/*.html` — one fullscreen scene per file
- `shared/boot.js` — PixiJS v8.22.0 from jsDelivr (`pixi.min.mjs`), plus `glowTexture` / `glowSprite` / `glowLine` / `wrap` / `pointer` / `hsl`. `boot(setup, { background })` for a non-black start color.
- `shared/style.css` — fullscreen canvas reset

No bundler.

## Backgrounds
Must loop or run forever (OBS browser sources). No finite timelines, no hard cuts.

Current scenes:
- `bgs/starfield.html` — five-color flow-field streaks + bokeh (pointer repel)
- `bgs/aurora.html` — glow-pass ribbons over drifting fog
- `bgs/hexpulse.html` — additive honeycomb with a traveling energy wave
- `bgs/kaleido.html` — n-fold mandala, hue-crawling wash
- `bgs/vortex.html` — concentric tunnel, sparks spiral in
- `bgs/sunbleed.html` — orbiting corona on a heat canvas
- `bgs/voronoi.html` — drifting neon Voronoi walls (pointer repel)

## Add a background
1. New file `bgs/<name>.html` — `import { boot, glowSprite, glowLine, wrap } from '../shared/boot.js'`.
2. Drive motion from `app.ticker` with wrap/modulo so it never ends. Clamp `dt`.
3. Additive glow, not unlit `Graphics` outlines, unless the scene really wants wireframe.
4. Add one link on `index.html`.

## Testing
Meat Bag runs server on `localhost:8000` for testing and verification, if not running, remind Meat Bag to start it.
