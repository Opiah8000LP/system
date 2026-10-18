/* =====================================================================
   RDweeb // contact — an interactive piece, not a contact page.
   All markup, styling logic, drawing and interaction live in here.

   EDIT THIS BLOCK ONLY:
   ===================================================================== */
const CONFIG = {
  email: 'your@email.com',
  discord: { handle: 'rdweeb', url: '' },          // url optional (invite/profile). Empty = click copies handle
  socials: [                                       // add / remove freely
    { label: 'Instagram',  handle: '@rdweeb', url: 'https://instagram.com/rdweeb' },
    { label: 'X',          handle: '@rdweeb', url: 'https://x.com/rdweeb' },
    { label: 'YouTube',    handle: '@rdweeb', url: 'https://youtube.com/@rdweeb' },
    { label: 'SoundCloud', handle: 'rdweeb',  url: 'https://soundcloud.com/rdweeb' },
    { label: 'TikTok',     handle: '@rdweeb', url: 'https://tiktok.com/@rdweeb' }
  ]
};

(() => {
'use strict';

/* ---------- helpers ---------- */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const pick = a => a[(Math.random() * a.length) | 0];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sr = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const GL = '█▓▒░#%&@?!/\\<>+=*0123456789';

/* ---------- injected styles ---------- */
const st = document.createElement('style');
st.textContent = `
:root{--ink:#fff;--blue:#a596ff;--big:#fff}
#bg{position:fixed;inset:0;width:100%;height:100%;display:block}
.layer{position:fixed;inset:0;pointer-events:none;overflow:hidden}
#bigs{will-change:transform;transform-origin:50% 50%}
.big{position:absolute;left:0;width:100%;text-align:center;font-weight:800;letter-spacing:-.06em;
  line-height:.8;font-size:24vw;white-space:nowrap;color:var(--big)}
.big.bot{bottom:0;transform:translateY(33%)}
.big.top{top:0;transform:rotate(180deg) translateY(33%)}
.big i{display:inline-block;font-style:normal;will-change:transform}
.corner{position:absolute;top:14px;font-weight:800;font-size:clamp(14px,2vw,26px);letter-spacing:-.04em;color:var(--ink)}
.corner.l{left:16px}.corner.r{right:16px}
.hub{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none}
.hub b{position:absolute;left:-11px;top:-11px;width:22px;height:22px;background:var(--ink)}
.ring{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;will-change:transform}
.ring div{position:absolute;border:1px solid var(--blue);border-radius:50%}
.ring span{position:absolute;color:var(--blue);font-weight:300;font-size:clamp(15px,2.2vw,30px);letter-spacing:-.02em}
.ring hr{position:absolute;border:0;border-top:1px solid var(--blue)}
.node{position:fixed;left:0;top:0;width:0;height:0;display:block;color:var(--ink);text-decoration:none;
  pointer-events:auto;will-change:transform;-webkit-user-drag:none}
.node .sq{position:absolute;left:-8px;top:-8px;width:16px;height:16px;background:var(--ink);transition:transform .12s}
.node .txt{position:absolute;left:20px;top:-.52em;padding:6px 10px 10px 4px;transform-origin:0 50%;white-space:nowrap}
.node.rt .txt{left:auto;right:20px;text-align:right;transform-origin:100% 50%;padding:6px 4px 10px 10px}
.node .lab{display:block;font-weight:800;font-size:clamp(26px,4.6vw,68px);letter-spacing:-.055em;line-height:.85;text-transform:uppercase}
.node .sub{display:block;font:500 clamp(10px,1.1vw,13px)/1.3 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.05em;margin-top:7px;opacity:.85}
.node:hover .lab,.node.on .lab{color:var(--blue)}
.node:hover .sq,.node.on .sq{transform:scale(2.2) rotate(45deg);background:var(--blue)}
body.gl .big,body.gl .lab,body.gl .corner{text-shadow:4px 0 #ff2a6d,-4px 0 #05d9e8}
#cur{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border:1px solid #fff;border-radius:50%;
  pointer-events:none;mix-blend-mode:difference;z-index:9;transition:width .15s,height .15s,margin .15s,border-radius .15s}
#cur.h{width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:0;transform:rotate(45deg)}
#dot{position:fixed;left:0;top:0;width:6px;height:6px;margin:-3px 0 0 -3px;background:#fff;pointer-events:none;mix-blend-mode:difference;z-index:9}
@media (pointer:coarse){#cur,#dot{display:none}}
`;
document.head.appendChild(st);

/* ---------- DOM ---------- */
const mk = (tag, cls, parent = document.body, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  parent.appendChild(e);
  return e;
};
const cv = mk('canvas'); cv.id = 'bg';
const ctx = cv.getContext('2d', { alpha: false });

const bigs = mk('div', 'layer'); bigs.id = 'bigs';
const letters = [];
['top', 'bot'].forEach(pos => {
  const d = mk('div', 'big ' + pos, bigs);
  'RDWEEB'.split('').forEach(ch => {
    const i = mk('i', '', d, ch); i.dataset.c = ch; letters.push(i);
  });
});
const corners = mk('div', 'layer');
const cL = mk('div', 'corner l', corners, '[ dweeb ]');
const cR = mk('div', 'corner r', corners, '[ contact ]');

const hubEl = mk('div', 'hub'); mk('b', '', hubEl);
const ringEl = mk('div', 'ring');
const ringBox = {};
ringBox.c = mk('div', '', ringEl);
ringBox.a = mk('span', '', ringEl, 'send');
ringBox.b = mk('span', '', ringEl, 'receive');
ringBox.h = mk('hr', '', ringEl);

/* nodes (links) */
const items = [
  { label: 'EMAIL', sub: CONFIG.email, href: 'mailto:' + CONFIG.email },
  { label: 'DISCORD', sub: CONFIG.discord.handle, href: CONFIG.discord.url || '#', copy: CONFIG.discord.handle, ext: !!CONFIG.discord.url },
  ...CONFIG.socials.map(s => ({ label: s.label.toUpperCase(), sub: s.handle, href: s.url, ext: true }))
];
const nodes = items.map((it, i) => {
  const a = mk('a', 'node');
  a.href = it.href; a.draggable = false;
  if (it.ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  mk('span', 'sq', a);
  const txt = mk('span', 'txt', a);
  const lab = mk('span', 'lab', txt, it.label);
  const sub = mk('span', 'sub', txt, it.sub);
  return Object.assign(it, { el: a, txt, lab, sub, x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, side: 1,
    rot: rnd(-5, 5), depth: (i % 3) - 1, placed: false, down: null, drag: false, moved: false, hov: false });
});

const cur = mk('div'); cur.id = 'cur';
const dot = mk('div'); dot.id = 'dot';

/* ---------- state ---------- */
let W = 0, H = 0, DPR = 1, t = 0, d = 1, target = 1, g = 0, beatN = 0, lastBp = 0;
const mouse = { x: innerWidth / 2, y: innerHeight / 2, px: 0, py: 0 };
const cp = { x: mouse.x, y: mouse.y };
const hub = { x: 0, y: 0 };
const BEAT = 60 / 172; // breakcore-ish tempo drives pulses + glitches
let inkc = '#fff';
let ink = [255, 255, 255], blue = [165, 150, 255];
const bursts = [];

/* ---------- audio (tiny, only after first tap) ---------- */
let ac = null;
const blip = (f = 220, dur = .06, type = 'square', v = .025) => {
  if (!ac) return;
  try {
    const o = ac.createOscillator(), gn = ac.createGain(), n = ac.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, n);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f * rnd(.25, 3)), n + dur);
    gn.gain.setValueAtTime(v, n); gn.gain.exponentialRampToValueAtTime(.0001, n + dur);
    o.connect(gn); gn.connect(ac.destination); o.start(); o.stop(n + dur);
  } catch (e) {}
};

/* ---------- particles: a 3D dome of dust ---------- */
const N = innerWidth < 700 ? 3200 : 7500;
const P = { x: new Float32Array(N), y: new Float32Array(N), z: new Float32Array(N), b: new Uint8Array(N), s: new Uint8Array(N) };
{
  const tmp = [];
  for (let i = 0; i < N; i++) {
    const yy = Math.pow(Math.random(), 1.7), th = Math.random() * 6.2832, r = Math.sqrt(1 - yy * yy);
    const k = .86 + Math.pow(Math.random(), 3) * .4;
    tmp.push({ x: r * Math.cos(th) * k, y: yy * k, z: r * Math.sin(th) * k, b: Math.min(5, (yy * 6) | 0), s: Math.random() < .12 ? 2 : 1 });
  }
  tmp.sort((a, b) => a.b - b.b).forEach((p, i) => { P.x[i] = p.x; P.y[i] = p.y; P.z[i] = p.z; P.b[i] = p.b; P.s[i] = p.s; });
}
const bucketCol = [0, 1, 2, 3, 4, 5].map(b => {
  const c = mix3([255, 246, 255], [138, 108, 255], b / 5);
  return rgba(c, .5 + .4 * (1 - b / 5));
});
const dust = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), p: rnd(6) }));

/* ---------- light-world texture (sky collage) ---------- */
const tex = mk('canvas', '', document.createDocumentFragment());
tex.width = tex.height = 512;
{
  const c = tex.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#587cae'); gr.addColorStop(1, '#a8b5c6');
  c.fillStyle = gr; c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) {
    const x = rnd(512), y = rnd(80, 512), r = rnd(26, 110);
    const rg = c.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,255,255,.85)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = rg; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 3500; i++) {
    c.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(20,30,60,.18)';
    c.fillRect(rnd(512), rnd(512), rnd(1, 3), rnd(1, 3));
  }
}

/* ---------- layout ---------- */
function layout() {
  hub.x = W * .5; hub.y = H * .47;
  const n = nodes.length;
  nodes.forEach((o, i) => {
    const side = i % 2 ? 1 : -1;
    const spread = (W < 700 ? .34 : .3) + .1 * Math.sin(i * 1.9 + .5);
    const row = (i + .5) / n;
    o.side = side;
    o.hx = W * .5 + side * W * spread;
    o.hy = H * (.2 + .52 * row);
    o.el.classList.toggle('rt', side > 0);
    if (!o.placed) { o.x = hub.x + rnd(-40, 40); o.y = hub.y + rnd(-40, 40); o.placed = true; }
  });
  const rs = Math.min(W * .46, 300);
  ringBox.c.style.cssText = `left:${-rs / 2}px;top:${-rs / 2}px;width:${rs}px;height:${rs}px`;
  ringBox.a.style.cssText = `left:${-rs * .36}px;top:${-rs * .2}px`;
  ringBox.b.style.cssText = `left:${-rs * .4}px;top:${rs * .02}px`;
  ringBox.h.style.cssText = `left:${-rs * .47}px;top:${-rs * .03}px;width:${rs * .62}px`;
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  W = innerWidth; H = innerHeight;
  cv.width = (W * DPR) | 0; cv.height = (H * DPR) | 0;
  layout();
}
addEventListener('resize', resize);
resize();

/* ---------- text chaos ---------- */
function scramble(el, text, dur = 420) {
  if (el._sc) clearInterval(el._sc);
  const t0 = performance.now();
  el._sc = setInterval(() => {
    const p = (performance.now() - t0) / dur;
    if (p >= 1) { clearInterval(el._sc); el.textContent = text; return; }
    el.textContent = [...text].map((c, i) => (i < p * text.length || c === ' ' ? c : pick(GL))).join('');
  }, 40);
}
setInterval(() => {
  if (RM) return;
  const n = 1 + ((Math.random() * 2) | 0);
  for (let k = 0; k < n; k++) {
    const L = pick(letters), m = Math.random();
    if (m < .4) L.style.transform = `scale(${rnd(.5, 1.8)},${rnd(.6, 1.3)}) skewX(${rnd(-30, 30)}deg)`;
    else if (m < .55) L.style.transform = 'rotate(180deg)';
    else if (m < .7) L.textContent = pick(GL);
    else if (m < .85) L.style.transform = `translateY(${rnd(-8, 8)}%) scaleY(-1)`;
    else L.style.transform = '';
    if (Math.random() < .8) setTimeout(() => { L.style.transform = ''; L.textContent = L.dataset.c; }, rnd(80, 420));
  }
}, 90);
setInterval(() => {
  if (RM) return;
  const o = pick(nodes); scramble(o.lab, o.label, 380);
  if (Math.random() < .5) scramble(pick([cL, cR]), pick(['[ dweeb ]', '[ contact ]', '[ rdweeb ]', '[ send it ]']), 300);
}, 1700);

/* ---------- interaction ---------- */
const kick = (v = .5) => { g = Math.min(1.4, g + v); };
function burst(x, y, n = 16) {
  for (let i = 0; i < n; i++) {
    const a = rnd(6.2832), s = rnd(1.5, 9);
    bursts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.7, 1.5), age: 0, kind: (Math.random() * 4) | 0, r: rnd(4, 16), rot: rnd(6), blue: Math.random() < .5 });
  }
  if (bursts.length > 240) bursts.splice(0, bursts.length - 240);
}
const setTarget = v => { target = v; kick(1); blip(90, .2, 'sawtooth', .04); };

nodes.forEach(o => {
  o.el.addEventListener('pointerdown', e => { o.down = { x: e.clientX, y: e.clientY, ox: o.x, oy: o.y }; o.moved = false; });
  o.el.addEventListener('pointerenter', () => { o.hov = true; cur.classList.add('h'); scramble(o.lab, o.label, 360); kick(.35); blip(rnd(300, 900), .05); });
  o.el.addEventListener('pointerleave', () => { o.hov = false; cur.classList.remove('h'); });
  o.el.addEventListener('dragstart', e => e.preventDefault());
  o.el.addEventListener('click', e => {
    if (o.moved) { e.preventDefault(); return; }
    kick(.8); blip(660, .1, 'square', .04);
    if (o.copy) {
      if (!o.ext) e.preventDefault();
      try { navigator.clipboard.writeText(o.copy); } catch (er) {}
      o.el.classList.add('on');
      scramble(o.sub, 'COPIED // ' + o.copy, 300);
      setTimeout(() => { o.el.classList.remove('on'); scramble(o.sub, o.sub.dataset.o || o.sub.textContent, 300); }, 1600);
    }
  });
  o.sub.dataset.o = o.sub.textContent;
});
addEventListener('pointermove', e => {
  const sp = Math.hypot(e.clientX - mouse.x, e.clientY - mouse.y);
  mouse.x = e.clientX; mouse.y = e.clientY;
  if (sp > 40) kick(Math.min(.12, sp * .0008));
  nodes.forEach(o => {
    if (!o.down) return;
    const dx = e.clientX - o.down.x, dy = e.clientY - o.down.y;
    if (!o.moved && Math.hypot(dx, dy) > 6) { o.moved = true; o.drag = true; }
    if (o.drag) { o.x = o.down.ox + dx; o.y = o.down.oy + dy; o.vx = o.vy = 0; }
  });
});
addEventListener('pointerup', () => {
  nodes.forEach(o => {
    if (!o.down) return;
    o.down = null;
    if (o.drag) { o.hx = o.x; o.hy = o.y; o.drag = false; setTimeout(() => { o.moved = false; }, 60); }
  });
});
addEventListener('pointerdown', e => {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (er) {} }
  burst(e.clientX, e.clientY);
  kick(.5);
  blip(rnd(120, 500), .09, 'sawtooth', .035);
  if (!e.target.closest || !e.target.closest('.node')) setTarget(target ? 0 : 1);
});
addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); setTarget(target ? 0 : 1); } });

/* ---------- drawing: dark world ---------- */
function drawDark(a) {
  ctx.globalAlpha = a;
  const pulse = Math.exp(-((t % BEAT) / BEAT) * 5);
  const hy = H * .56, R = Math.min(W, H) * .36 * (1 + pulse * .035), cx = W / 2;
  const ay = t * .12 + (mouse.x / W - .5) * 1.3, ca = Math.cos(ay), sa = Math.sin(ay);
  const tl = .26 + (mouse.y / H - .5) * .3, ct = Math.cos(tl), sT = Math.sin(tl);
  // soft halo
  const hg = ctx.createRadialGradient(cx, hy, 0, cx, hy, R * 1.3);
  hg.addColorStop(0, 'rgba(150,120,255,.35)'); hg.addColorStop(1, 'rgba(150,120,255,0)');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
  let cb = -1;
  const glOff = g > .25 ? rnd(-40, 40) : 0;
  for (let i = 0; i < N; i++) {
    const x = P.x[i], y = P.y[i], z = P.z[i];
    const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
    const y2 = y * ct - z1 * sT, z2 = y * sT + z1 * ct;
    const s = 1 / (1 - z2 * .3);
    let sx = cx + x1 * R * s, sy = hy - y2 * R * s;
    if (sy > hy + 2) continue;
    const mdx = sx - mouse.x, mdy = sy - mouse.y, md = mdx * mdx + mdy * mdy;
    if (md < 9000) { const m = Math.sqrt(md) + .01; const f = (95 - m) * .6; sx += mdx / m * f; sy += mdy / m * f; }
    if (glOff && i % 97 < 9) sx += glOff;
    const b = P.b[i];
    if (b !== cb) { cb = b; ctx.fillStyle = bucketCol[b]; }
    ctx.fillRect(sx, sy, P.s[i], P.s[i]);
  }
  // ground
  ctx.beginPath();
  ctx.moveTo(0, hy + R * .14); ctx.lineTo(cx - R * 1.35, hy + R * .12);
  ctx.quadraticCurveTo(cx, hy - R * .16, cx + R * 1.35, hy + R * .12);
  ctx.lineTo(W, hy + R * .14); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = '#06050d'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx - R * 1.35, hy + R * .12);
  ctx.quadraticCurveTo(cx, hy - R * .16, cx + R * 1.35, hy + R * .12); ctx.stroke();
  // dust below
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  dust.forEach(p => { if (Math.sin(t * 3 + p.p) > -.3) ctx.fillRect(p.x * W, hy + R * .2 + p.y * (H - hy - R * .2), 1.3, 1.3); });
  // beam + chained rings
  const bg = ctx.createLinearGradient(0, hy, 0, H);
  bg.addColorStop(0, 'rgba(160,130,255,.28)'); bg.addColorStop(1, 'rgba(160,130,255,0)');
  ctx.fillStyle = bg; ctx.fillRect(cx - R * .09, hy, R * .18, H - hy);
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  for (let k = 0; k < 6; k++) {
    const r = (3 + k * 3.4) * (1 + pulse * .12) * (R / 260), y = hy + R * .2 + k * R * .15 + Math.sin(t * 2 + k) * 3;
    ctx.beginPath(); ctx.arc(cx, y, r, 0, 6.2832); ctx.stroke();
  }
  // orbiting outlines
  ctx.lineWidth = 1;
  [[-.5, -.62, .22, .6], [.1, -.95, .05, 1.1], [.62, -.45, .12, .8]].forEach(([ox, oy, rr, sp], i) => {
    ctx.beginPath();
    ctx.arc(cx + ox * R + Math.sin(t * sp + i) * 14, hy + oy * R + Math.cos(t * sp * .8 + i) * 10, rr * R * (1 + pulse * .04), 0, 6.2832);
    ctx.stroke();
  });
  const bx = cx + Math.sin(t * .35) * R * .55;
  ctx.beginPath(); ctx.arc(bx, hy - R * .06 + Math.abs(Math.sin(t * .35)) * R * .05, 11, 0, 6.2832); ctx.stroke();
  // crescent
  ctx.save();
  ctx.translate(cx - R * .6, hy + R * .5); ctx.rotate(Math.sin(t * .3) * .5);
  const cr = R * .2;
  ctx.beginPath();
  ctx.arc(0, 0, cr, .55 * Math.PI, 1.45 * Math.PI);
  ctx.arc(cr * .42, 0, cr * .78, 1.5 * Math.PI, .5 * Math.PI, true);
  ctx.closePath(); ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

/* ---------- drawing: light world ---------- */
function drawLight(a) {
  ctx.globalAlpha = a;
  const step = Math.floor(t * 5), pulse = Math.exp(-((t % BEAT) / BEAT) * 5);
  const gl = g > .2;
  // contour map
  const ccx = W * .5 + Math.sin(t * .3) * W * .05 + (mouse.x - W / 2) * .04, ccy = H * .5 + (mouse.y - H / 2) * .04;
  const maxR = Math.max(W, H) * .55;
  ctx.strokeStyle = 'rgba(20,20,30,.17)'; ctx.lineWidth = 1;
  for (let k = 0; k < 16; k++) {
    const r = ((k + 1) / 16) * maxR;
    ctx.beginPath();
    for (let s = 0; s <= 80; s++) {
      const an = (s / 80) * 6.2832;
      const rr = r * (1 + .1 * Math.sin(3 * an + t * .5 + k * .4) + .06 * Math.sin(7 * an - t * .9 + k) + (gl ? rnd(-.03, .03) : 0));
      const x = ccx + Math.cos(an) * rr * 1.25, y = ccy + Math.sin(an) * rr * .8;
      s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  // sky collage polygon (stepped jitter)
  const S = Math.min(W, H) * .52, bx = W * .5, by = H * .47;
  const base = [[-1.05, -.55], [-.1, -.55], [.35, -.55], [1, -.55], [1, -.12], [.5, -.1], [.52, .32], [.1, .36], [-.4, .3], [-.62, .58], [-.82, .58]];
  ctx.save();
  ctx.beginPath();
  base.forEach(([x, y], i) => {
    const j = (sr(step * 9 + i) - .5) * .14, j2 = (sr(step * 7 + i * 3) - .5) * .12;
    const px = bx + (x + j) * S * 1.1 + Math.sin(t * .4 + i) * 6, py = by + (y + j2) * S * .95;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.closePath(); ctx.clip();
  ctx.drawImage(tex, bx - S * 1.3 + Math.sin(t * .2) * 40, by - S * 1.1, S * 2.6, S * 2.2);
  ctx.restore();
  // white spiky burst
  ctx.save();
  ctx.translate(bx + S * .32, by - S * .1); ctx.rotate(t * .25 + (gl ? rnd(-.2, .2) : 0));
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#f3f3f3';
  ctx.beginPath();
  const sp = 11;
  for (let i = 0; i < sp * 2; i++) {
    const an = (i * Math.PI) / sp, rr = i % 2 ? S * .09 : S * (.2 + .22 * sr(i + step));
    const x = Math.cos(an) * rr * (1 + pulse * .1), y = Math.sin(an) * rr * (1 + pulse * .1);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
  // blue disc + dither bar
  ctx.fillStyle = '#5b6fe0';
  ctx.beginPath(); ctx.arc(bx + Math.sin(t * .6) * S * .1, by - S * .62, 19 + pulse * 4, 0, 6.2832); ctx.fill();
  const dx = W * .16, dy = H * .66, dw = 130, dh = 40;
  const dg = ctx.createLinearGradient(dx, 0, dx + dw, 0);
  dg.addColorStop(0, '#6a5cf0'); dg.addColorStop(1, '#f2f2f2');
  ctx.fillStyle = dg; ctx.fillRect(dx, dy, dw, dh);
  for (let i = 0; i < 110; i++) {
    ctx.fillStyle = Math.random() < .5 ? '#ffffff' : '#4b3fd0';
    ctx.fillRect(dx + Math.random() * dw * Math.random(), dy + Math.random() * dh, 1.5, 1.5);
  }
  // 3D pearls
  for (let k = 0; k < 4; k++) {
    const x = W * (.12 + .26 * k) + Math.sin(t * .7 + k * 2) * 40, y = H * (.2 + .5 * ((k * .37) % 1)) + Math.cos(t * .6 + k) * 30;
    const r = 16 + k * 7, sx = .55 + .45 * Math.abs(Math.cos(t * .9 + k));
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
    const rg = ctx.createRadialGradient(-r * .3, -r * .35, 1, 0, 0, r);
    rg.addColorStop(0, '#fff'); rg.addColorStop(.35, '#a3aef8'); rg.addColorStop(1, '#4650c4');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
  // scribble
  const ss = Math.floor(t * 7), sx0 = W * .46, sy0 = H * .72;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < 40; i++) {
    const an = i * .9 + sr(ss) * 6, rr = 8 + i * .9 + sr(ss + i) * 14;
    const x = sx0 + Math.cos(an) * rr, y = sy0 + Math.sin(an) * rr * .8;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ---------- lines, ruler, bursts, glitch ---------- */
function drawLines() {
  ctx.strokeStyle = rgba(ink, .85); ctx.fillStyle = inkc; ctx.lineWidth = 1.1;
  const jag = g > .3;
  nodes.forEach((o, i) => {
    ctx.beginPath(); ctx.moveTo(hub.x, hub.y);
    if (jag) {
      const mx = lerp(hub.x, o.x, .5) + rnd(-40, 40), my = lerp(hub.y, o.y, .5) + rnd(-40, 40);
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(o.x, o.y); ctx.stroke();
    // long decor curve to the edge
    ctx.strokeStyle = rgba(ink, .28);
    ctx.beginPath(); ctx.moveTo(o.x, o.y);
    ctx.bezierCurveTo(o.x + o.side * W * .2, o.y - 80 + Math.sin(t + i) * 30, o.side * W * .7 + W * .5, o.y + 120, o.side < 0 ? -20 : W + 20, H * (.1 + .12 * i) % H);
    ctx.stroke();
    ctx.strokeStyle = rgba(ink, .85);
    ctx.fillRect(lerp(hub.x, o.x, .5) - 3, lerp(hub.y, o.y, .5) - 3, 6, 6);
  });
  // ruler
  ctx.strokeStyle = rgba(ink, .5); ctx.beginPath();
  const rx = W < 700 ? 6 : 18, y0 = H * .3;
  for (let i = 0; i < 40; i++) { const y = y0 + i * 8; ctx.moveTo(rx, y); ctx.lineTo(rx + (i % 5 ? 6 : 13), y); }
  ctx.stroke();
}
function drawBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const p = bursts[i];
    p.age += dt; if (p.age > p.life) { bursts.splice(i, 1); continue; }
    p.x += p.vx; p.y += p.vy; p.vx *= .95; p.vy *= .95; p.rot += .1;
    const al = 1 - p.age / p.life;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.strokeStyle = ctx.fillStyle = rgba(p.blue ? blue : ink, al);
    ctx.lineWidth = 1.3;
    if (p.kind === 0) ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
    else if (p.kind === 1) { ctx.beginPath(); ctx.moveTo(-p.r, 0); ctx.lineTo(p.r, 0); ctx.moveTo(0, -p.r); ctx.lineTo(0, p.r); ctx.stroke(); }
    else if (p.kind === 2) { ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r, p.r); ctx.lineTo(-p.r, p.r); ctx.closePath(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, 0, p.r * .7, 0, 6.2832); ctx.stroke(); }
    ctx.restore();
  }
}
function drawGlitch() {
  if (g < .06 && Math.random() > .03) return;
  const n = g > .06 ? Math.ceil(g * 7) : 1;
  const cw = cv.width, ch = cv.height;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < n; i++) {
    const sy = (Math.random() * ch) | 0, sh = (4 + Math.random() * 60 * (.4 + g)) | 0, dx = ((Math.random() - .5) * 140 * (.3 + g)) | 0;
    ctx.drawImage(cv, 0, sy, cw, Math.min(sh, ch - sy), dx, sy, cw, Math.min(sh, ch - sy));
  }
  if (g > .25) {
    for (let i = 0; i < 2; i++) {
      const y = Math.random() * ch, x = Math.random() * cw * .6, w = cw * rnd(.2, .6);
      const gr = ctx.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, '#ff2a6d'); gr.addColorStop(.35, '#ffe14a'); gr.addColorStop(.7, '#05d9e8'); gr.addColorStop(1, '#6a5cf0');
      ctx.fillStyle = gr; ctx.fillRect(x, y, w, 2 + Math.random() * 4 * DPR);
    }
  }
  if (g > .6 && Math.random() < .5) { ctx.fillStyle = inkc; ctx.fillRect(0, Math.random() * ch, cw * rnd(.3, 1), 5 * DPR); }
  ctx.restore();
}

/* ---------- main loop ---------- */
let last = performance.now();
function frame(ms) {
  requestAnimationFrame(frame);
  t = ms / 1000;
  const dt = Math.min(.05, (ms - last) / 1000); last = ms;

  // beat events
  const bp = (t % BEAT) / BEAT;
  if (bp < lastBp) {
    beatN++;
    if (!RM && Math.random() < .22) kick(.3);
    if (beatN % 24 === 0) setTarget(target ? 0 : 1);
  }
  lastBp = bp;
  g *= RM ? .8 : .92;
  d += (target - d) * (RM ? 1 : .09);
  document.body.classList.toggle('gl', g > .3 && !RM);

  // palette
  const bgc = mix3([236, 236, 236], [10, 9, 19], d);
  ink = mix3([18, 18, 26], [255, 255, 255], d); inkc = rgb(ink);
  blue = mix3([91, 120, 238], [165, 150, 255], d);
  const big = mix3([108, 134, 236], [255, 255, 255], d);
  const rs = document.documentElement.style;
  rs.setProperty('--ink', inkc); rs.setProperty('--blue', rgb(blue)); rs.setProperty('--big', rgb(big));
  document.body.style.background = rgb(bgc);
  const pulse = Math.exp(-bp * 5);
  bigs.style.transform = `scale(${1 + pulse * .018 + g * .015})`;

  // nodes physics
  cp.x += (mouse.x - cp.x) * .22; cp.y += (mouse.y - cp.y) * .22;
  cur.style.transform = `translate(${cp.x}px,${cp.y}px)`; dot.style.transform = `translate(${mouse.x}px,${mouse.y}px)`;
  hub.x = W * .5 + Math.sin(t * .5) * 12 + (mouse.x - W / 2) * .015;
  hub.y = H * .47 + Math.cos(t * .4) * 10 + (mouse.y - H / 2) * .015;
  hubEl.style.transform = `translate(${hub.x}px,${hub.y}px) rotate(${t * 40}deg) scale(${1 + pulse * .35})`;
  ringEl.style.transform = `translate(${hub.x}px,${hub.y}px) perspective(700px) rotateX(${Math.sin(t * .7) * 30}deg) rotateY(${Math.cos(t * .5) * 35}deg) rotateZ(${Math.sin(t * .3) * 25 + g * 20}deg)`;

  nodes.forEach((o, i) => {
    if (!o.drag) {
      const tx = o.hx + Math.sin(t * .6 + i * 2) * 16 + Math.sin(t * 1.7 + i) * 6 + (mouse.x - W / 2) * .02 * o.depth;
      const ty = o.hy + Math.cos(t * .5 + i * 3) * 14 + (mouse.y - H / 2) * .02 * o.depth;
      o.vx += (tx - o.x) * .05; o.vy += (ty - o.y) * .05;
      o.vx *= .82; o.vy *= .82; o.x += o.vx; o.y += o.vy;
    }
    const gx = g > .35 ? rnd(-6, 6) : 0;
    o.el.style.transform = `translate3d(${o.x + gx}px,${o.y}px,0)`;
    let tr;
    if (o.hov) {
      const r = o.txt.getBoundingClientRect();
      const ry = clamp(((mouse.x - (r.left + r.width / 2)) / r.width) * 40, -25, 25);
      const rx = clamp(-((mouse.y - (r.top + r.height / 2)) / r.height) * 30, -20, 20);
      tr = `perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.05)`;
    } else {
      tr = `perspective(500px) rotateX(${Math.sin(t * .9 + i) * 9}deg) rotateY(${Math.cos(t * .7 + i * 2) * 12}deg) rotate(${o.rot}deg) skewX(${Math.sin(t * 1.3 + i) * 3 + (g > .4 ? rnd(-8, 8) : 0)}deg)`;
    }
    o.txt.style.transform = tr;
  });

  // canvas
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = rgb(bgc); ctx.fillRect(0, 0, W, H);
  if (1 - d > .01) drawLight(1 - d);
  if (d > .01) drawDark(d);
  drawLines();
  drawBursts(dt);
  drawGlitch();
}
requestAnimationFrame(frame);
})();
