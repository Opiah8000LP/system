/* js/ui/links.js — email / Discord / socials as draggable 3D "nodes" tethered to the hub.
   Nodes drift on springs, tilt in perspective toward the cursor, scramble on hover,
   and can be dragged (and they stay where you drop them). */
import { S } from '../core/state.js';
import { SITE } from '../../config/site.js';
import { mk, rnd, pick, clamp, GL } from '../core/util.js';
import { kick } from '../core/glitch.js';
import { blip } from '../audio/sfx.js';

export const layer = mk('div', 'layer nodes-layer');

const items = [
  { label: 'EMAIL', sub: SITE.email, href: 'mailto:' + SITE.email },
  { label: 'DISCORD', sub: SITE.discord.handle, href: SITE.discord.url || '#', copy: SITE.discord.handle, ext: !!SITE.discord.url },
  ...SITE.socials.map(s => ({ label: s.label.toUpperCase(), sub: s.handle, href: s.url, ext: true }))
];

export const nodes = items.map((it, i) => {
  const a = mk('a', 'node', layer);
  a.href = it.href; a.draggable = false;
  if (it.ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  mk('span', 'sq', a);
  const txt = mk('span', 'txt', a);
  const lab = mk('span', 'lab', txt, it.label);
  const sub = mk('span', 'sub', txt, it.sub);
  sub.dataset.o = it.sub;
  return Object.assign(it, {
    el: a, txt, lab, sub, x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, side: 1,
    rot: rnd(-5, 5), depth: (i % 3) - 1, placed: false, down: null, drag: false, moved: false, hov: false
  });
});

export function scramble(el, text, dur = 420) {
  if (el._sc) clearInterval(el._sc);
  const t0 = performance.now();
  el._sc = setInterval(() => {
    const p = (performance.now() - t0) / dur;
    if (p >= 1) { clearInterval(el._sc); el.textContent = text; return; }
    el.textContent = [...text].map((c, i) => (i < p * text.length || c === ' ' ? c : pick(GL))).join('');
  }, 40);
}

export function layout() {
  const { W, H } = S, n = nodes.length;
  const land = H < 520 && W > H;                 // short landscape phone: player sits on the right
  S.hubFx = land ? 0.3 : 0.5;
  S.hub.x = W * S.hubFx; S.hub.y = H * 0.47;
  const narrow = W < 700;
  nodes.forEach((o, i) => {
    const side = i % 2 ? 1 : -1;
    const spread = (narrow ? 0.3 : 0.3) + 0.1 * Math.sin(i * 1.9 + 0.5);
    const row = (i + 0.5) / n;
    o.side = side;
    o.hx = W * S.hubFx + side * W * (land ? 0.11 + 0.04 * Math.sin(i * 1.9) : spread);
    o.hy = H * (narrow ? 0.14 : 0.16) + H * 0.46 * row;   // leaves room for the player + note
    o.el.classList.toggle('rt', side > 0);
    if (!o.placed) { o.x = S.hub.x + rnd(-40, 40); o.y = S.hub.y + rnd(-40, 40); o.placed = true; }
  });
}

export function init(cursorEl) {
  nodes.forEach(o => {
    o.el.addEventListener('pointerdown', e => { o.down = { x: e.clientX, y: e.clientY, ox: o.x, oy: o.y }; o.moved = false; });
    o.el.addEventListener('pointerenter', () => { o.hov = true; cursorEl && cursorEl.classList.add('h'); scramble(o.lab, o.label, 360); kick(0.3); blip(rnd(300, 900), 0.05); });
    o.el.addEventListener('pointerleave', () => { o.hov = false; cursorEl && cursorEl.classList.remove('h'); });
    o.el.addEventListener('dragstart', e => e.preventDefault());
    o.el.addEventListener('focus', () => { o.hov = true; scramble(o.lab, o.label, 300); });
    o.el.addEventListener('blur', () => { o.hov = false; });
    o.el.addEventListener('click', e => {
      if (o.moved) { e.preventDefault(); return; }
      kick(0.7); blip(660, 0.1, 'square', 0.04);
      if (o.copy) {
        if (!o.ext) e.preventDefault();
        try { navigator.clipboard.writeText(o.copy); } catch (er) {}
        o.el.classList.add('on');
        scramble(o.sub, 'COPIED // ' + o.copy, 300);
        setTimeout(() => { o.el.classList.remove('on'); scramble(o.sub, o.sub.dataset.o, 300); }, 1600);
      }
    });
  });

  addEventListener('pointermove', e => {
    nodes.forEach(o => {
      if (!o.down) return;
      const dx = e.clientX - o.down.x, dy = e.clientY - o.down.y;
      if (!o.moved && Math.hypot(dx, dy) > 6) { o.moved = true; o.drag = true; }
      if (o.drag) { o.x = clamp(o.down.ox + dx, 20, S.W - 20); o.y = clamp(o.down.oy + dy, 20, S.H - 20); o.vx = o.vy = 0; }
    });
  });
  addEventListener('pointerup', () => {
    nodes.forEach(o => {
      if (!o.down) return;
      o.down = null;
      if (o.drag) { o.hx = o.x; o.hy = o.y; o.drag = false; setTimeout(() => { o.moved = false; }, 60); }
    });
  });
  addEventListener('pointercancel', () => nodes.forEach(o => { o.down = null; o.drag = false; }));

  /* periodic text corruption, so labels never feel static */
  setInterval(() => {
    if (S.reduced || S.gated) return;
    const o = pick(nodes); scramble(o.lab, o.label, 380);
  }, 1700);
}

export function update(dt) {
  const { t, mouse, W, H, g } = S, A = S.a;
  nodes.forEach((o, i) => {
    if (!o.drag) {
      const tx = o.hx + Math.sin(t * 0.6 + i * 2) * 16 + Math.sin(t * 1.7 + i) * 6 + (mouse.x - W / 2) * 0.02 * o.depth + A.bass * Math.sin(i * 2.1) * 10;
      const ty = o.hy + Math.cos(t * 0.5 + i * 3) * 14 + (mouse.y - H / 2) * 0.02 * o.depth;
      const f = Math.min(3, dt * 60), damp = Math.pow(0.82, f);   // frame-rate independent spring
      o.vx += (tx - o.x) * 0.05 * f; o.vy += (ty - o.y) * 0.05 * f;
      o.vx *= damp; o.vy *= damp; o.x += o.vx * f; o.y += o.vy * f;
    }
    const gx = g > 0.35 ? rnd(-6, 6) * g : 0;
    o.el.style.transform = `translate3d(${o.x + gx}px,${o.y}px,0)`;
    let tr;
    if (o.hov) {
      const r = o.txt.getBoundingClientRect();
      const ry = clamp(((mouse.x - (r.left + r.width / 2)) / Math.max(1, r.width)) * 40, -25, 25);
      const rx = clamp(-((mouse.y - (r.top + r.height / 2)) / Math.max(1, r.height)) * 30, -20, 20);
      tr = `perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.05)`;
    } else {
      const m = S.reduced ? 0.2 : 1 - S.calm * 0.5;
      tr = `perspective(500px) rotateX(${Math.sin(t * 0.9 + i) * 9 * m}deg) rotateY(${Math.cos(t * 0.7 + i * 2) * 12 * m}deg) rotate(${o.rot}deg) skewX(${Math.sin(t * 1.3 + i) * 3 * m + (g > 0.4 ? rnd(-8, 8) * g : 0) + (A.tick > 0.45 && !S.reduced ? rnd(-3, 3) : 0)}deg) scale(${1 + A.beat * 0.04})`;
    }
    o.txt.style.transform = tr;
  });
}
