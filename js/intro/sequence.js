/* js/intro/sequence.js — the opening ritual. A single tap begins it.
   Phase 1 CHAOS   every fearsome / sacred symbol, strobing-but-safe, glitching, contradicting itself
   Phase 2 TURN    the symbols lose their names: forms melt, stroke softens, colour warms
   Phase 3 BEAUTY  halo, dove, rosettes, hearts, rising light — the same lines, now tender
   Phase 4 OUTRO   a bloom of light wipes into the site.
   Photosensitivity: swaps are limited to ~4/s, the flash is a low-alpha radial wash (no full-screen
   white/black alternation), and reduced-motion replaces everything with slow crossfades. */
import { INTRO } from '../../config/intro.js';
import { SITE } from '../../config/site.js';
import { S } from '../core/state.js';
import { mk, rnd, pick, lerp, clamp, ease, TAU, rgba, GL } from '../core/util.js';
import { SYM, CHAOS_SET } from '../shapes/symbols.js';
import { SHAPES, drawWire } from '../shapes/wire.js';
import * as engine from '../audio/engine.js';
import { IntroSynth } from '../audio/introSynth.js';

const TENDER = ['halo', 'dove', 'heart', 'rosette', 'rays', 'dove', 'heart'];
const CHAOS_WORDS = ['666', 'Ω', '†', '✠', 'ⵣ', '☩', '⸸', 'INRI', 'AGNUS', 'HAIL', 'AMEN', '█▓▒░', 'לא', 'Ꙩ', '☽', 'ΧΡ', '777'];
const TENDER_WORDS = ['stay', 'breathe', 'held', 'still here', 'soft', 'light', 'home', 'ok', 'yes'];

let root, cv, cx, capEl, tapEl, skipBtn, running = false, raf = 0, t0 = 0, synth = null, done = null;
let curSym = { name: 'cross', seed: 1, born: 0 }, lastSwap = 0, lastCap = '', stars = [], fin = false;

const D = () => {
  const k = S.reduced ? 0.55 : 1, d = INTRO.durations;
  return { chaos: d.chaos * k, turn: d.turn * k, beauty: d.beauty * k, outro: d.outro * k };
};

function build() {
  root = mk('div', 'intro');
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Intro');
  cv = mk('canvas', 'intro-cv', root); cx = cv.getContext('2d');
  capEl = mk('div', 'intro-cap', root);
  tapEl = mk('button', 'intro-tap', root, `<span class="g">${INTRO.gateText}</span><small>${INTRO.warning}</small>`);
  skipBtn = mk('button', 'intro-skip', root, 'skip ›'); skipBtn.hidden = true;
  skipBtn.addEventListener('click', e => { e.stopPropagation(); finish(true); });
  tapEl.addEventListener('click', start);
  addEventListener('resize', fit);
  fit();
}
function fit() { if (!cv) return; const dpr = Math.min(devicePixelRatio || 1, 1.5); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }

/* gate: wait for the first tap, then run */
export function play(onDone) {
  done = onDone;
  S.introActive = true;
  if (!root) build();
  root.style.display = 'block'; root.classList.remove('out');
  document.body.classList.add('in-intro');
  tapEl.hidden = false; skipBtn.hidden = true; capEl.textContent = '';
  running = false; fin = false;
  stars = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), z: rnd(0.2, 1), p: rnd(TAU) }));
  idle();
  setTimeout(() => tapEl.focus({ preventScroll: true }), 60);
}

function idle() {
  cancelAnimationFrame(raf);
  const loop = ms => {
    if (running || fin) return;
    const W = innerWidth, H = innerHeight, t = ms / 1000;
    cx.fillStyle = '#05040a'; cx.fillRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(165,150,255,.5)'; cx.lineWidth = 1;
    cx.save(); cx.translate(W / 2, H / 2 - 40); cx.rotate(Math.sin(t * 0.4) * 0.1);
    SYM.rosette(cx, Math.min(W, H) * (0.12 + Math.sin(t * 1.3) * 0.006), 12); cx.restore();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

function start() {
  if (running) return;
  running = true; tapEl.hidden = true; skipBtn.hidden = false;
  engine.ensureCtx(); engine.resume();
  if (INTRO.sound && !S.reduced) {
    const c = engine.ctx();
    if (c) { try { synth = new IntroSynth(c); synth.start(); } catch (e) { synth = null; } }
  }
  t0 = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

/* ---------- drawing helpers ---------- */
function caption(txt) {
  if (txt === lastCap) return; lastCap = txt;
  capEl.classList.remove('show'); void capEl.offsetWidth;
  capEl.textContent = txt; capEl.classList.add('show');
}
function glitchText(txt, p) {
  return [...txt].map(c => (Math.random() < p && c !== ' ' ? pick(GL) : c)).join('');
}

function frame(ms) {
  if (fin) return;
  raf = requestAnimationFrame(frame);
  const el = Math.max(0, (ms - t0) / 1000), d = D(), W = innerWidth, H = innerHeight, m = Math.min(W, H);
  const T1 = d.chaos, T2 = T1 + d.turn, T3 = T2 + d.beauty, T4 = T3 + d.outro;
  if (el >= T4) { finish(false); return; }

  /* m: 0 chaos → 1 beauty (drives sound + look) */
  const morph = el < T1 ? 0 : el < T2 ? ease((el - T1) / d.turn) : 1;
  if (synth) synth.update(morph);

  /* ---- background ---- */
  const bgA = [lerp(6, 14, morph), lerp(4, 10, morph), lerp(10, 28, morph)];
  cx.globalAlpha = 1; cx.fillStyle = `rgb(${bgA[0] | 0},${bgA[1] | 0},${bgA[2] | 0})`; cx.fillRect(0, 0, W, H);

  /* drifting starfield turns from falling ash to rising light */
  stars.forEach(s => {
    s.y += (morph < 0.5 ? 0.0006 : -0.0009) * s.z * 60 * 0.016; if (s.y > 1) s.y = 0; if (s.y < 0) s.y = 1;
    const al = (0.2 + 0.3 * Math.sin(el * 2 + s.p)) * s.z;
    cx.fillStyle = morph < 0.5 ? `rgba(200,200,220,${al * 0.5})` : `rgba(255,${220 + 30 * morph | 0},${200 + 55 * morph | 0},${al})`;
    cx.fillRect(s.x * W, s.y * H, 1.4 * s.z, 1.4 * s.z);
  });

  const cxn = W / 2, cyn = H / 2 - (H < 500 ? 10 : 20);

  /* ---- PHASE 1: chaos ---- */
  if (el < T2) {
    const chaos = 1 - morph;
    const rate = lerp(0.24, 0.5, morph);                       // seconds between swaps (≥ 0.24 → max ~4/s)
    if (el - lastSwap > rate) {
      lastSwap = el;
      curSym = { name: pick(CHAOS_SET), seed: (Math.random() * 99) | 0, born: el };
      if (S.reduced) curSym.name = pick(['cross', 'sigil', 'crescent', 'ouroboros']);
    }
    const age = el - curSym.born;
    const size = m * (0.2 + 0.05 * Math.sin(el * 3) + (S.reduced ? 0 : (1 - age / rate) * 0.04));
    /* layered ghost copies (echo) */
    for (let k = 3; k >= 0; k--) {
      cx.save();
      cx.translate(cxn + (S.reduced ? 0 : rnd(-1, 1) * chaos * 30 * (k ? 1 : 0.3)), cyn + (S.reduced ? 0 : rnd(-1, 1) * chaos * 18 * (k ? 1 : 0.3)));
      cx.rotate(Math.sin(el * 0.7 + k) * 0.08 * (1 + chaos * 2) + (curSym.name.startsWith('inverted') ? 0 : 0));
      const sx = S.reduced ? 1 : 1 + rnd(-0.4, 0.4) * chaos * (k ? 1 : 0.2);
      cx.scale(sx, 1 / sx);
      const al = (k ? 0.18 : 0.95) * (0.4 + chaos * 0.6);
      const red = lerp(255, 255, chaos);
      cx.strokeStyle = k % 2 ? `rgba(0,230,255,${al})` : `rgba(${red},${lerp(40, 215, morph) | 0},${lerp(60, 200, morph) | 0},${al})`;
      cx.lineWidth = lerp(2.2, 1.2, morph);
      cx.globalAlpha = 1;
      SYM[curSym.name](cx, size * (1 + k * 0.05), curSym.seed);
      cx.restore();
    }
    /* small orbiting glyph words & wire solids */
    cx.font = `700 ${m * 0.05}px "Helvetica Neue",Arial,sans-serif`; cx.textAlign = 'center';
    for (let i = 0; i < 6; i++) {
      const a = el * (0.3 + i * 0.07) + i * 1.05, r = m * (0.36 + 0.05 * Math.sin(el + i));
      cx.fillStyle = `rgba(255,${60 + 160 * morph | 0},${80 + 140 * morph | 0},${0.55 * chaos + 0.15})`;
      const w = CHAOS_WORDS[(Math.floor(el * 2.2) + i * 5) % CHAOS_WORDS.length];
      cx.fillText(glitchText(w, chaos * 0.5), cxn + Math.cos(a) * r * 1.4, cyn + Math.sin(a) * r * 0.8);
    }
    cx.strokeStyle = `rgba(255,255,255,${0.25 * chaos})`; cx.lineWidth = 1;
    drawWire(cx, SHAPES.ico, cxn, cyn, m * 0.34, el * 0.8, el * 1.1, chaos * 0.12);
    /* slice glitch: horizontally displaced bands (not a full-screen strobe) */
    if (!S.reduced && chaos > 0.1) {
      const dpr = cv.width / W;
      for (let i = 0; i < 2 + chaos * 4; i++) {
        const sy = (Math.random() * H) | 0, sh = (3 + Math.random() * 40) | 0;
        cx.drawImage(cv, 0, sy * dpr, cv.width, sh * dpr, (Math.random() - 0.5) * 120 * chaos, sy, W, sh);
      }
    }
  }

  /* ---- PHASE 2/3: tender forms ---- */
  if (el > T1 * 0.9) {
    const k = ease((el - T1 * 0.9) / (d.turn + 0.2)), life = clamp((el - T2) / d.beauty, 0, 1);
    const sw = lerp(1.2, 2.4, k);
    const warm = (a) => `rgba(255,${200 + 40 * k | 0},${190 + 55 * k | 0},${a})`;
    cx.lineWidth = sw;
    /* rising halo */
    cx.save(); cx.translate(cxn, cyn - m * (0.2 + 0.06 * life)); cx.strokeStyle = warm(0.9 * k);
    SYM.halo(cx, m * (0.16 + 0.02 * Math.sin(el * 2)));
    cx.restore();
    /* central bloom: rosette that opens as the cross fades */
    cx.save(); cx.translate(cxn, cyn); cx.rotate(el * 0.1);
    cx.strokeStyle = warm(0.85 * k);
    SYM.rosette(cx, m * (0.05 + 0.18 * k), Math.round(lerp(5, 14, k)));
    cx.restore();
    /* heart + dove drifting up */
    if (el > T1 + d.turn * 0.4) {
      const u = clamp((el - (T1 + d.turn * 0.4)) / (d.turn * 0.6 + d.beauty * 0.4), 0, 1);
      cx.save(); cx.translate(cxn, cyn + m * 0.02); cx.strokeStyle = warm(ease(u) * 0.95); cx.lineWidth = 2.2;
      cx.scale(1 + Math.sin(el * 4) * 0.02 * life, 1 + Math.sin(el * 4) * 0.02 * life);
      SYM.heart(cx, m * 0.11); cx.restore();
      cx.save(); cx.translate(cxn + Math.sin(el * 0.9) * m * 0.2, cyn - m * (0.28 + u * 0.12) + Math.sin(el * 1.7) * 6);
      cx.rotate(-0.15 + Math.sin(el) * 0.08); cx.strokeStyle = warm(ease(u) * 0.9); SYM.dove(cx, m * 0.09); cx.restore();
    }
    /* rays */
    cx.save(); cx.translate(cxn, cyn); cx.rotate(-el * 0.06); cx.strokeStyle = warm(0.35 * k * (0.6 + 0.4 * Math.sin(el * 2))); cx.lineWidth = 1;
    SYM.rays(cx, m * (0.3 + 0.1 * life), 36); cx.restore();
    /* soft light wash */
    const g = cx.createRadialGradient(cxn, cyn, 0, cxn, cyn, m * 0.7);
    g.addColorStop(0, `rgba(255,214,230,${0.22 * k * (0.7 + 0.3 * life)})`); g.addColorStop(1, 'rgba(255,214,230,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    /* tender words */
    if (life > 0.1) {
      cx.font = `300 ${m * 0.04}px "Helvetica Neue",Arial,sans-serif`; cx.textAlign = 'center';
      for (let i = 0; i < 4; i++) {
        const w = TENDER_WORDS[(i * 2 + Math.floor(el * 0.4)) % TENDER_WORDS.length];
        const a = ((el * 0.12 + i / 4) % 1);
        cx.fillStyle = `rgba(255,235,240,${Math.sin(a * Math.PI) * 0.6 * life})`;
        cx.fillText(w, cxn + Math.sin(i * 2.4 + el * 0.2) * m * 0.45, H * (0.9 - a * 0.8));
      }
    }
  }

  /* ---- captions ---- */
  const phase = el < T1 ? 'chaos' : el < T2 ? 'turn' : el < T3 ? 'beauty' : 'out';
  if (phase !== 'out') {
    const list = INTRO.captions[phase] || [], s = phase === 'chaos' ? 0 : phase === 'turn' ? T1 : T2, len = phase === 'chaos' ? T1 : phase === 'turn' ? d.turn : d.beauty;
    if (list.length) caption(list[Math.min(list.length - 1, Math.floor(((el - s) / len) * list.length))]);
  } else caption(INTRO.finale);

  /* ---- outro bloom: radial white-lavender wash, then the site appears beneath ---- */
  if (el > T3) {
    const o = (el - T3) / d.outro;
    /* no white-out: the intro layer dissolves, revealing the site beneath */
    root.style.opacity = String(1 - ease((o - 0.35) / 0.65));
  }
}

export function finish(skipped) {
  if (fin) return;
  fin = true; running = false;
  cancelAnimationFrame(raf);
  if (synth) { synth.stop(skipped ? 0.5 : 2.2); synth = null; }
  root.classList.add('out');
  setTimeout(() => {
    root.style.display = 'none'; root.style.opacity = ''; root.classList.remove('out');
    document.body.classList.remove('in-intro');
    S.introActive = false;
    done && done(skipped);
  }, skipped ? 250 : 120);
}

export const isRunning = () => S.introActive;
export const skip = () => { if (S.introActive) { if (!running) finish(true); else finish(true); } };
