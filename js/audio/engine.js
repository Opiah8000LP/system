/* js/audio/engine.js — Web Audio plumbing + automatic beat detection (no bpm needed).
   <audio> → analyser → master gain → speakers.

   Two onset detectors run on the live spectrum:
     LOW  band  (~40–220 Hz)  : kicks / sub bass → rare, heavy hits  → SLOW reactions
     HIGH band  (~3–12 kHz)   : hats / snares / sparkle → dense hits → FAST reactions
   Each looks at spectral flux (how much new energy appeared) against a running average,
   so it adapts to any track and loudness. Results land in S.a every frame:
     bass / mid / high   smoothed band levels (0..1)   — bass eases slowly, high snaps
     beat                slow-decaying pulse on LOW onsets   (~0.3 s tail)
     tick                fast-decaying pulse on HIGH onsets  (~0.05 s tail)
     lowN / tickN        counters (handy for "do something once per hit")
   When nothing is playing there are no beats; visuals just breathe. */
import { S } from '../core/state.js';
import { smooth, clamp } from '../core/util.js';

const FFT = 2048, NB = FFT / 2;
const E = { ctx: null, el: null, analyser: null, master: null, ready: false, vol: 0.8, muted: false, duck: 1 };
const bins = new Uint8Array(NB);
const prev = new Float32Array(NB);
S.a.freq = bins;
S.a.lowN = 0; S.a.tickN = 0; S.a.tick = 0;

const beatCbs = [];
let silent = 0;

export const onBeat = fn => { beatCbs.push(fn); };      // fn(band: 'low' | 'high', strength 0..1)
export const ctx = () => E.ctx;
export const isMuted = () => E.muted;
export const getDuck = () => E.duck;

export function ensureCtx() {
  if (!E.ctx) {
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) E.ctx = new AC(); } catch (e) {}
  }
  return E.ctx;
}
export function resume() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}
export function attach(el) { E.el = el; }

export function connectElement() {
  if (E.ready || !E.el) return E.ready;
  const c = ensureCtx();
  if (!c) return false;
  try {
    const src = c.createMediaElementSource(E.el);
    E.analyser = c.createAnalyser();
    E.analyser.fftSize = FFT;
    E.analyser.smoothingTimeConstant = 0.35;          // low smoothing so transients stay sharp
    E.master = c.createGain();
    src.connect(E.analyser); E.analyser.connect(E.master); E.master.connect(c.destination);
    E.ready = true;
    applyVolume();
  } catch (err) { console.warn('[audio] analyser unavailable — beats disabled', err); }
  return E.ready;
}

function applyVolume() {
  const v = (E.muted ? 0 : Math.pow(E.vol, 1.6)) * E.duck;
  if (E.ready) { E.master.gain.setTargetAtTime(v, E.ctx.currentTime, 0.03); E.el.volume = 1; }
  else if (E.el) E.el.volume = Math.min(1, Math.max(0, v));
}
export function setVolume(v, muted) { E.vol = v; E.muted = muted; applyVolume(); }
export function setDuck(x) { E.duck = x; applyVolume(); }

/* ---------- onset detector for one frequency band ---------- */
class Band {
  constructor(loHz, hiHz, refractory, k, floor, histLen) {
    Object.assign(this, { loHz, hiHz, refractory, k, floor, histLen, hist: [], last: -9, lo: 0, hi: 0, energy: 0, flux: 0 });
  }
  setRange(sr) {
    const hz = sr / 2 / NB;
    this.lo = Math.max(1, Math.floor(this.loHz / hz));
    this.hi = Math.min(NB - 1, Math.ceil(this.hiHz / hz));
  }
  /* returns strength (0..1) when an onset happens, else 0 */
  step(t) {
    let flux = 0, e = 0;
    for (let i = this.lo; i <= this.hi; i++) {
      const v = bins[i] / 255, d = v - prev[i];
      if (d > 0) flux += d;
      e += v; prev[i] = v;
    }
    const n = this.hi - this.lo + 1;
    flux /= n; e /= n;
    this.energy = e; this.flux = flux;
    const h = this.hist;
    let mean = 0; for (let i = 0; i < h.length; i++) mean += h[i];
    mean = h.length ? mean / h.length : 0;
    h.push(flux); if (h.length > this.histLen) h.shift();
    const thr = mean * this.k + this.floor;
    if (flux > thr && e > 0.04 && t - this.last > this.refractory) {
      this.last = t;
      return clamp(0.35 + (flux - thr) * 14, 0.35, 1);
    }
    return 0;
  }
}
const LOW = new Band(40, 220, 0.22, 1.7, 0.012, 36);      // heavy, spaced-out hits
const HIGH = new Band(3000, 12000, 0.05, 1.45, 0.006, 24); // dense, fast hits
const MID = new Band(220, 3000, 1, 99, 99, 1);             // level only

/* called once per frame */
export function update(dt, playing) {
  const a = S.a;
  a.playing = playing;
  let b = 0, m = 0, h = 0, real = false;

  if (E.ready && playing && E.ctx.state === 'running') {
    E.analyser.getByteFrequencyData(bins);
    let sum = 0;
    for (let i = 1; i < 300; i++) sum += bins[i];
    if (sum > 0) {
      real = true; silent = 0;
      LOW.setRange(E.ctx.sampleRate); HIGH.setRange(E.ctx.sampleRate); MID.setRange(E.ctx.sampleRate);

      const lo = LOW.step(S.t), hi = HIGH.step(S.t);
      MID.step(S.t);
      b = LOW.energy; m = MID.energy; h = HIGH.energy;

      if (lo) { a.beat = Math.max(a.beat, lo); a.lowN++; for (const f of beatCbs) f('low', lo); }
      if (hi) { a.tick = Math.max(a.tick, hi); a.tickN++; for (const f of beatCbs) f('high', hi); }
    } else silent++;
  }
  a.real = real;

  /* bass eases in and out slowly; highs snap */
  a.bass = smooth(a.bass, clamp(b * 1.6, 0, 1), 0.3, 0.05, dt);
  a.mid = smooth(a.mid, clamp(m * 1.8, 0, 1), 0.4, 0.1, dt);
  a.high = smooth(a.high, clamp(h * 3.2, 0, 1), 0.75, 0.38, dt);
  a.level = a.bass * 0.5 + a.mid * 0.3 + a.high * 0.2;

  a.beat *= Math.exp(-dt * 3.2);      // slow tail  (~0.3 s)
  a.tick *= Math.exp(-dt * 22);       // fast tail  (~0.05 s)
}
