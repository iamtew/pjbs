// Control UI shell for PJBS scenes. URL query is the whole config.
// menu=ON shows the panel; omit / DISABLE keeps it hidden (OBS-clean default).

import { hsl } from './boot.js';

export function normHex(raw, fallback = '#ffffff') {
  let s = String(raw ?? '').trim();
  if (s[0] !== '#') s = `#${s}`;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) s = `#${[...s.slice(1)].map((c) => c + c).join('')}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(s)) return fallback;
  return s.toLowerCase();
}

export function hexToPixi(hex) {
  return parseInt(normHex(hex).slice(1), 16);
}

export function hexHsl(hex) {
  const n = hexToPixi(hex);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 510;
  const delta = max - min;
  const s = delta === 0 ? 0 : delta / (255 * (1 - Math.abs(2 * l - 1)));
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
  }
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

let iroWait;

function ensureIro() {
  if (window.iro) return Promise.resolve(window.iro);
  if (!iroWait) {
    iroWait = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@jaames/iro@5';
      s.onload = () => resolve(window.iro || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return iroWait;
}

function stepDecimals(step) {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

function clampRange(field, raw) {
  const n = Number(raw);
  const v = Number.isFinite(n) ? n : field.def;
  const c = Math.min(field.max, Math.max(field.min, v));
  return field.int ? Math.round(c) : Number(c.toFixed(stepDecimals(field.step)));
}

function formatRange(field, value) {
  if (typeof field.fmt === 'function') return field.fmt(value);
  if (field.int) return String(value);
  const d = stepDecimals(field.step);
  return d ? value.toFixed(Math.min(d, 2)) : String(value);
}

function parsePalette(raw, def) {
  const parts = String(raw).split(/[,|-]/).filter(Boolean);
  return def.map((d, i) => normHex(parts[i], d));
}

function cloneDef(field) {
  if (field.type === 'palette') return field.def.map((h) => normHex(h));
  if (field.type === 'color') return normHex(field.def);
  return field.def;
}

function coerce(field, raw) {
  if (field.type === 'color') return normHex(raw, field.def);
  if (field.type === 'palette') return parsePalette(raw, field.def);
  if (field.type === 'choice') {
    const v = String(raw);
    return field.options.includes(v) ? v : field.def;
  }
  return clampRange(field, raw);
}

function serialize(field, value) {
  if (field.type === 'color') return normHex(value, field.def).slice(1);
  if (field.type === 'palette') return value.map((h, i) => normHex(h, field.def[i]).slice(1)).join(',');
  if (field.type === 'choice') return String(value);
  if (field.int) return String(Math.round(value));
  return String(clampRange(field, value));
}

function flash(button, temp) {
  const label = button.querySelector('.btn-label') || button;
  const original = label.textContent;
  button.classList.add('is-clicked');
  label.textContent = temp;
  clearTimeout(button._flash);
  button._flash = setTimeout(() => {
    button.classList.remove('is-clicked');
    label.textContent = original;
  }, 550);
}

function el(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (v === false || v == null) continue;
      else node.setAttribute(k, String(v));
    }
  }
  for (const kid of kids) if (kid) node.appendChild(kid);
  return node;
}

// Tabler outline SVGs (MIT), vendored in ./icons
const TI_DIR = new URL('./icons/', import.meta.url);
const tiCache = new Map();

export function ti(name) {
  const wrap = el('span', { class: 'ti', 'aria-hidden': 'true' });
  let p = tiCache.get(name);
  if (!p) {
    p = fetch(new URL(`${name}.svg`, TI_DIR)).then((r) => r.text());
    tiCache.set(name, p);
  }
  p.then((svg) => {
    wrap.innerHTML = svg;
  });
  return wrap;
}

const IRO_OPTS = {
  width: 220,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.3)',
  layoutDirection: 'vertical',
  sliderSize: 14,
  handleRadius: 8,
  padding: 4,
  margin: 8,
};

export function mountSettings({ title, sections, onChange }) {
  const params = new URLSearchParams(location.search);
  const fields = sections.flatMap((s) => s.fields);
  const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));

  const state = {};
  for (const f of fields) {
    state[f.key] = params.has(f.key) ? coerce(f, params.get(f.key)) : cloneDef(f);
  }
  // Closed unless the operator asked for the panel.
  state.menu = params.get('menu') === 'ON' ? 'ON' : 'DISABLE';
  state.side = params.get('side') === 'left' ? 'left' : 'right';

  const api = { state, onChange: onChange || null };

  const menu = el('div', { id: 'settings-menu' });
  const titleEl = el('h2', { text: title });
  const flip = el('button', { id: 'flip-side-button', type: 'button', 'aria-label': 'Move menu to other side', title: 'Move menu' });
  flip.appendChild(ti('arrows-left-right'));
  const close = el('button', { id: 'close-menu-button', type: 'button', 'aria-label': 'Close settings', title: 'Close' });
  close.appendChild(ti('x'));
  menu.append(
    el('div', { class: 'menu-header' }, titleEl, el('div', { class: 'menu-header-buttons' }, flip, close)),
    el('p', { class: 'hint', text: 'Settings hidden: double-click to reopen. Copy URL for OBS for clean output.' }),
  );

  const toggles = [];
  const ranges = {};
  const choices = {};
  const colorUIs = [];

  function emit(key) {
    api.onChange?.(state, key);
  }

  function applyChrome() {
    menu.classList.toggle('open', state.menu !== 'DISABLE');
    document.body.classList.toggle('settings-mode', state.menu !== 'DISABLE');
    menu.classList.toggle('side-right', state.side === 'right');
  }

  function buildParams(menuMode) {
    const out = new URLSearchParams();
    for (const f of fields) {
      const now = serialize(f, state[f.key]);
      const def = serialize(f, f.def);
      if (now !== def) out.set(f.key, now);
    }
    if (menuMode === 'ON') out.set('menu', 'ON');
    if (state.side !== 'right') out.set('side', state.side);
    return out;
  }

  function updateURL() {
    const q = buildParams(state.menu);
    const search = q.toString();
    history.replaceState({}, '', search ? `?${search}` : location.pathname);
  }

  function currentColor(field) {
    if (field.type === 'palette') return state[field.key][field._sel || 0];
    return state[field.key];
  }

  function writeColor(field, hex, fromPicker) {
    hex = normHex(hex, field.type === 'palette' ? field.def[field._sel || 0] : field.def);
    if (field.type === 'palette') {
      const next = state[field.key].slice();
      next[field._sel || 0] = hex;
      state[field.key] = next;
    } else {
      state[field.key] = hex;
    }
    syncColorUI(field, fromPicker);
    emit(field.key);
    updateURL();
  }

  function syncColorUI(field, skipPicker) {
    const hex = currentColor(field);
    if (field._hex) field._hex.value = hex;
    if (field._swatches) {
      field._swatches.forEach((btn, i) => {
        btn.style.background = state[field.key][i];
        btn.setAttribute('aria-selected', String(i === (field._sel || 0)));
      });
    }
    if (!skipPicker && field._iro && field._iro.color.hexString.toLowerCase() !== hex) {
      field._syncing = true;
      field._iro.color.hexString = hex;
      field._syncing = false;
    }
  }

  function mountIro(field, mount) {
    ensureIro().then((iro) => {
      if (!iro) {
        mount.hidden = true;
        return;
      }
      field._iro = new iro.ColorPicker(mount, { ...IRO_OPTS, color: currentColor(field) });
      field._iro.on('color:change', (color) => {
        if (field._syncing) return;
        writeColor(field, color.hexString, true);
      });
    });
  }

  function colorBlock(field) {
    field._sel = 0;
    const wrap = el('div', { class: 'setting-group color-group' });
    wrap.appendChild(el('div', { class: 'color-label-row' }, el('span', { text: field.label })));
    if (field.type === 'palette') {
      const row = el('div', { class: 'swatch-row' });
      field._swatches = field.def.map((_, i) => {
        const btn = el('button', {
          type: 'button',
          class: 'swatch',
          'aria-label': `${field.label} ${i + 1}`,
          'aria-selected': String(i === 0),
        });
        btn.style.background = state[field.key][i];
        btn.addEventListener('click', () => {
          field._sel = i;
          syncColorUI(field);
        });
        row.appendChild(btn);
        return btn;
      });
      wrap.appendChild(row);
    }
    const mount = el('div', { class: 'iro-mount', 'aria-label': `${field.label} picker` });
    const hex = el('input', {
      type: 'text',
      class: 'color-hex',
      maxlength: '7',
      spellcheck: 'false',
      'aria-label': `${field.label} hex`,
    });
    const reset = el('button', {
      type: 'button',
      class: 'reset-param',
      'data-reset': field.key,
      'aria-label': `Reset ${field.label}`,
      title: `Reset ${field.label}`,
    });
    reset.appendChild(ti('refresh'));
    hex.value = currentColor(field);
    hex.addEventListener('change', () => writeColor(field, hex.value));
    wrap.append(mount, el('div', { class: 'color-hex-row' }, hex, reset));
    field._hex = hex;
    colorUIs.push(field);
    mountIro(field, mount);
    return wrap;
  }

  sections.forEach((section, index) => {
    const open = index === 0;
    const panelId = `${section.id}-controls`;
    const toggle = el('button', {
      class: 'setting-toggle',
      type: 'button',
      'aria-expanded': String(open),
      'aria-controls': panelId,
      'data-section-toggle': '',
    });
    const icon = el('span', { class: 'section-toggle-icon', 'aria-hidden': 'true' });
    icon.appendChild(ti('chevron-right'));
    toggle.append(icon, document.createTextNode(section.label));
    const panel = el('div', { id: panelId, class: 'section-panel' });
    if (!open) panel.hidden = true;

    for (const field of section.fields) {
      if (field.skipUi) continue;
      if (field.type === 'color' || field.type === 'palette') {
        panel.appendChild(colorBlock(field));
        continue;
      }
      if (field.type === 'choice') {
        const id = `${field.key}-choice`;
        const select = el('select', { id, class: 'choice-select' });
        for (const opt of field.options) {
          select.appendChild(el('option', { value: opt, text: opt }));
        }
        const reset = el('button', {
          type: 'button',
          class: 'reset-param',
          'data-reset': field.key,
          'aria-label': `Reset ${field.label}`,
          title: `Reset ${field.label}`,
        });
        reset.appendChild(ti('refresh'));
        panel.appendChild(
          el(
            'div',
            { class: 'setting-group' },
            el(
              'div',
              { class: 'range-control' },
              el(
                'div',
                { class: 'range-details' },
                el('div', { class: 'range-label-row' }, el('label', { for: id }, el('span', { text: field.label }))),
                el('div', { class: 'range-row' }, select),
              ),
              el('div', { class: 'range-meta' }, reset),
            ),
          ),
        );
        choices[field.key] = { select, field };
        continue;
      }
      const id = `${field.key}-slider`;
      const slider = el('input', {
        id,
        type: 'range',
        min: field.min,
        max: field.max,
        step: field.step,
      });
      const readout = el('span', { class: 'value-label', id: `${field.key}-value` });
      const reset = el('button', {
        type: 'button',
        class: 'reset-param',
        'data-reset': field.key,
        'aria-label': `Reset ${field.label}`,
        title: `Reset ${field.label}`,
      });
      reset.appendChild(ti('refresh'));
      panel.appendChild(
        el(
          'div',
          { class: 'setting-group' },
          el(
            'div',
            { class: 'range-control' },
            el(
              'div',
              { class: 'range-details' },
              el('div', { class: 'range-label-row' }, el('label', { for: id }, el('span', { text: field.label }))),
              el('div', { class: 'range-row' }, slider),
            ),
            el('div', { class: 'range-meta' }, reset, readout),
          ),
        ),
      );
      ranges[field.key] = { slider, readout, field };
    }

    menu.appendChild(el('div', { class: 'settings-section', 'data-section': section.id }, toggle, panel));
    toggles.push({ toggle, panel, icon });
  });

  const resetAll = el('button', { id: 'reset-button', class: 'menu-action', type: 'button' });
  resetAll.append(ti('refresh'), el('span', { class: 'btn-label', text: 'Reset all' }));
  const copyUrl = el('button', { id: 'copy-url-button', class: 'small-button menu-action', type: 'button' });
  copyUrl.append(ti('copy'), el('span', { class: 'btn-label', text: 'Copy URL' }));
  const copyObs = el('button', { id: 'copy-url-obs-button', class: 'small-button menu-action', type: 'button' });
  copyObs.append(ti('copy'), el('span', { class: 'btn-label', text: 'Copy URL for OBS' }));
  menu.append(resetAll, el('div', { class: 'setting-group copy-row' }, copyUrl, copyObs));
  document.body.appendChild(menu);

  function stackCanvas() {
    for (const c of document.querySelectorAll('canvas')) {
      c.style.zIndex = '1';
    }
  }
  stackCanvas();
  new MutationObserver(stackCanvas).observe(document.body, { childList: true });

  function syncInputs() {
    for (const { slider, readout, field } of Object.values(ranges)) {
      slider.value = String(state[field.key]);
      readout.textContent = formatRange(field, state[field.key]);
    }
    for (const { select, field } of Object.values(choices)) {
      select.value = String(state[field.key]);
    }
    for (const field of colorUIs) syncColorUI(field);
  }

  function setField(key, raw) {
    const field = byKey[key];
    if (!field) return;
    state[key] = coerce(field, raw);
    if (field.type === 'palette') field._sel = 0;
    syncInputs();
    emit(key);
    updateURL();
  }

  toggles.forEach((row) => {
    row.toggle.addEventListener('click', () => {
      const willOpen = row.toggle.getAttribute('aria-expanded') !== 'true';
      for (const other of toggles) {
        other.toggle.setAttribute('aria-expanded', 'false');
        other.panel.hidden = true;
      }
      if (willOpen) {
        row.toggle.setAttribute('aria-expanded', 'true');
        row.panel.hidden = false;
        for (const field of colorUIs) field._iro?.resize(IRO_OPTS.width);
      }
    });
  });

  for (const { slider, field } of Object.values(ranges)) {
    slider.addEventListener('input', (e) => setField(field.key, e.target.value));
  }
  for (const { select, field } of Object.values(choices)) {
    select.addEventListener('change', (e) => setField(field.key, e.target.value));
  }

  menu.addEventListener('click', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('[data-reset]') : null;
    if (!btn) return;
    const key = btn.getAttribute('data-reset');
    setField(key, byKey[key].def);
  });

  resetAll.addEventListener('click', () => {
    for (const f of fields) state[f.key] = cloneDef(f);
    state.side = 'right';
    for (const f of colorUIs) f._sel = 0;
    syncInputs();
    applyChrome();
    emit('reset');
    updateURL();
    flash(resetAll, 'Reset!');
  });

  flip.addEventListener('click', () => {
    state.side = state.side === 'left' ? 'right' : 'left';
    applyChrome();
    updateURL();
  });

  close.addEventListener('click', () => {
    state.menu = 'DISABLE';
    applyChrome();
    updateURL();
  });

  document.addEventListener('click', (e) => {
    if (e.detail !== 2) return;
    if (state.menu === 'DISABLE') {
      state.menu = 'ON';
      applyChrome();
      updateURL();
      return;
    }
    if (e.target instanceof Element && e.target.closest('#settings-menu')) return;
  });

  copyUrl.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      flash(copyUrl, 'Copied!');
    } catch {
      flash(copyUrl, 'Failed');
    }
  });

  copyObs.addEventListener('click', async () => {
    try {
      const url = new URL(location.href);
      url.search = buildParams('DISABLE').toString();
      await navigator.clipboard.writeText(url.toString());
      flash(copyObs, 'Copied!');
    } catch {
      flash(copyObs, 'Failed');
    }
  });

  function setMenu(on) {
    state.menu = on ? 'ON' : 'DISABLE';
    applyChrome();
    updateURL();
  }

  api.setField = setField;
  api.setMenu = setMenu;

  syncInputs();
  applyChrome();
  updateURL();

  return api;
}
