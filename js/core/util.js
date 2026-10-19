/* js/core/util.js — tiny shared helpers (no dependencies). */
export const TAU = Math.PI * 2;
export const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const pick = a => a[(Math.random() * a.length) | 0];
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };       // smoothstep
export const sr = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }; // seeded 0..1
export const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
export const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const GL = '█▓▒░#%&@?!/\\<>+=*0123456789';          // glitch glyph pool

/* frame-rate independent smoothing with separate rise / fall speeds */
export const smooth = (cur, target, up, down, dt) =>
  cur + (target - cur) * (1 - Math.pow(1 - (target > cur ? up : down), dt * 60));

export const fmtTime = s => {
  if (!isFinite(s) || s < 0) s = 0;
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
};

/* create an element, optionally append + fill */
export const mk = (tag, cls, parent = document.body, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
};

/* safe localStorage */
export const store = {
  get(k, d) { try { const v = localStorage.getItem('rdweeb:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('rdweeb:' + k, JSON.stringify(v)); } catch (e) {} }
};
