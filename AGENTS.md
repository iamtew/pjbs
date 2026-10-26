# PJBS - PixiJS BackgroundS
repo is static website, hosted on GitHub pages.
repo has landing page, listing the different backgrounds.
backgrounds are individual HTML files that render an animation in the browser in full screen.
these animations will be used in OBS as backgrounds.
code can be shared between animations.

Look of the Stupid Audio catalog (`audio.stupid.systems/fx.js`): additive glow sprites, multi-pass bloom lines, flow fields — not flat dots.
Canvas fill is not required to be black; scenes may wash/hue the renderer background.

## Terminology
| Term | Meaning |
|------|---------|
| **Clanker** / **Clankers** | Any AI assistant, agent, or automated editor |
| **Meat Bag** / **Meat Bags** | Human operators, contributors, and dev-workflow users |

Use **Clanker** / **Meat Bag** in this file, in new comments where natural, and in chat. Do not call Clankers "AI", "the assistant", or "LLM". Do not rewrite existing comments or docs solely to swap terminology.

## Layout
- `index.html` — landing list of backgrounds
- `bgs/*.html` — one fullscreen scene per file
- `shared/boot.js` — PixiJS v8.22.0 from jsDelivr (`pixi.min.mjs`), plus `glowTexture` / `glowSprite` / `glowLine` / `wrap` / `pointer` / `hsl`. `boot(setup, { background })` for a non-black start color.
- `shared/style.css` — fullscreen canvas reset
- `shared/settings.js` + `shared/settings.css` — Control UI shell (`mountSettings`). URL query is the complete config. Panel starts **closed**; `menu=ON` shows it. Double-click reopens. `side=left` (omit when `right`). Copy URL for OBS rebuilds the query without `menu=ON`. Live `input` → scene + `replaceState` (omit defaults). Color fields use Iro (`type: 'color'` / `'palette'`). Canvas stays opaque (these are backgrounds, not overlays).

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
- `bgs/flower.html` — Flower of Life, hex-packed circles that breathe
- `bgs/merkaba.html` — star tetrahedron, counter-spin in perspective
- `bgs/yantra.html` — interlocking triangles, lotus ring, bindu pulse

## Add a background
1. New file `bgs/<name>.html` — `import { boot, glowSprite, glowLine, wrap } from '../shared/boot.js'` and `import { mountSettings } from '../shared/settings.js'`. Link `../shared/settings.css`.
2. Drive motion from `app.ticker` with wrap/modulo so it never ends. Clamp `dt`.
3. Additive glow, not unlit `Graphics` outlines, unless the scene really wants wireframe.
4. Expose the scene's magic numbers through `mountSettings({ title, sections })`. Read `ui.state` in the ticker. Wipe-and-rebuild sprites when a count/size key changes. Do not invent a second menu.
5. Add one link on `index.html`.

## Testing
Default: Meat Bag hosts `http://localhost:8000`. If it is not up, remind Meat Bag. Clanker does not start a server unasked.

When Meat Bag says **show me**, Clanker hosts: start a static server from the repo root (`python -m http.server 8000`, or the next free port if 8000 is taken). Reply with a clickable markdown link to the scene (e.g. [http://localhost:8000/bgs/starfield.html](http://localhost:8000/bgs/starfield.html)), plus [http://localhost:8000/](http://localhost:8000/) when the catalog matters. Do not only say it is running.

Clanker-hosted servers are short-lived. Kill the process when the look is over, when the conversation moves off preview, or when it sits unused — do not leave it for the rest of the session. Meat Bag says **hide it** to stop it now; confirm it is down. Do not kill a server Meat Bag started.
