import { boot, hsl } from './shared/boot.js';
import { mountSettings, ti } from './shared/settings.js';
import { PALS, layoutCells, paintCubes } from './shared/iso.js';

const x = (v) => `${v.toFixed(2)}x`;
const ui = mountSettings({
  title: 'Landing',
  sections: [
    {
      id: 'look',
      label: 'Look',
      fields: [
        { key: 'size', label: 'Cell size', min: 12, max: 40, step: 1, def: 21, int: true },
        { key: 'swell', label: 'Swell', min: 0, max: 1.5, step: 0.05, def: 1, fmt: x },
        { key: 'speed', label: 'Pulse', min: 0.2, max: 4, step: 0.05, def: 1, fmt: x },
        { key: 'hue', label: 'Hue crawl', min: 0, max: 40, step: 1, def: 14, int: true },
        { key: 'wave', label: 'Light wave', min: 0.2, max: 3, step: 0.05, def: 1.15 },
        {
          key: 'pal',
          label: 'Palette',
          type: 'choice',
          options: Object.keys(PALS),
          def: 'prism',
          skipUi: true,
        },
      ],
    },
  ],
});

const chips = [...document.querySelectorAll('.chip')];
for (let i = 0; i < chips.length; i++) {
  chips[i].style.setProperty('--i', i);
  chips[i].style.setProperty('--n', chips.length);
}

const palBtns = [...document.querySelectorAll('.pals [data-pal]')];
function syncPals() {
  for (const btn of palBtns) {
    btn.setAttribute('aria-pressed', String(btn.dataset.pal === ui.state.pal));
  }
}
for (const btn of palBtns) {
  btn.addEventListener('click', () => ui.setField('pal', btn.dataset.pal));
}
syncPals();
ui.onChange = (_state, key) => {
  if (key === 'pal' || key === 'reset') syncPals();
  if (key === 'size' || key === 'reset') layout();
};

const gear = document.getElementById('open-settings');
gear.appendChild(ti('settings'));
document.getElementById('repo-link').prepend(ti('brand-github'));
gear.addEventListener('click', () => ui.setMenu(ui.state.menu !== 'ON'));

let cells = [];
function layout(w = window.innerWidth, h = window.innerHeight) {
  cells = layoutCells(ui.state.size, w, h);
}

boot((app, PIXI) => {
  const c = app.canvas.style;
  c.position = 'fixed';
  c.inset = '0';
  c.zIndex = '1';
  c.pointerEvents = 'none';

  const g = new PIXI.Graphics();
  app.stage.addChild(g);

  layout();
  app.renderer.on('resize', layout);

  let t = 0;
  app.ticker.add((ticker) => {
    const dt = Math.min(ticker.deltaMS / 1000, 0.05);
    t += dt;
    paintCubes(g, cells, t, ui.state, hsl, app.screen.width, app.screen.height);
  });
}, { background: 0x050508 });
