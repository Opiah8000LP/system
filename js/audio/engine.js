/* js/audio/engine.js — Web Audio plumbing + beat analysis.
   <audio> → analyser → master gain → speakers.
   Writes bass / mid / high / beat into S.a every frame.
   If the analyser is unavailable (blocked, silent, nothing playing) it falls back
   to a steady clock at the track's bpm so the visuals still breathe. */
import { S } from '../core/state.js';
import { SITE } from '../../config/site.js';
import { smooth } from '../core/util.js';

const E = { ctx: null, el: null, analyser: null, master: null, ready: false, vol: 0.8, muted: false, duck: 1 };
const bins = new Uint8Array(512);              // fftSize 1024 → 512 bins
S.a.freq = bins;

const beatCbs = [];
let prevBass = 0, hist = [], lastBeat = -1, silent = 0, lastPhase = 0;

export const onBeat = fn => { beatCbs.push(fn); };
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
    E.analyser.fftSize = 1024;
    E.analyser.smoothingTimeConstant = 0.55;
    E.master = c.createGain();
    src.connect(E.analyser); E.analyser.connect(E.master); E.master.connect(c.destination);
    E.ready = true;
    applyVolume();
  } catch (err) { console.warn('[audio] analyser unavailable, using clock pulses', err); }
  return E.ready;
}

function applyVolume() {
  const v = (E.muted ? 0 : Math.pow(E.vol, 1.6)) * E.duck;
  if (E.ready) { E.master.gain.setTargetAtTime(v, E.ctx.currentTime, 0.03); E.el.volume = 1; }
  else if (E.el) E.el.volume = Math.min(1, Math.max(0, v));
}
export function setVolume(v, muted) { E.vol = v; E.muted = muted; applyVolume(); }
export function setDuck(x) { E.duck = x; applyVolume(); }

/* called once per frame */
export function update(dt, playing, bpm) {
  const a = S.a;
  a.playing = playing;
  let b = 0, m = 0, h = 0, real = false, beat = false, strength = 1;

  if (E.ready && playing && E.ctx.state === 'running') {
    E.analyser.getByteFrequencyData(bins);
    let sb = 0, sm = 0, sh = 0;
    for (let i = 1; i <= 6; i++) sb += bins[i];
    for (let i = 7; i < 40; i++) sm += bins[i];
    for (let i = 40; i < 200; i++) sh += bins[i];
    if (sb + sm + sh > 0) { real = true; silent = 0; b = sb / (6 * 255); m = sm / (33 * 255); h = sh / (160 * 255); }
    else silent++;
  }

  if (real || (playing && E.ready && silent < 45)) {
    /* real audio → spectral-flux onset detection on the bass band */
    const flux = Math.max(0, b - prevBass);
    hist.push(flux); if (hist.length > 40) hist.shift();
    const avg = hist.reduce((s, x) => s + x, 0) / hist.length;
    if (flux > avg * 1.6 + 0.02 && S.t - lastBeat > 0.14) { beat = true; strength = Math.min(1, 0.5 + flux * 3); }
    prevBass = b;
    a.real = true;
  } else {
    /* fallback clock */
    const period = 60 / (playing && bpm ? bpm : SITE.fallbackBpm);
    const amp = playing ? 1 : 0.3;
    const phase = (S.t % period) / period;
    if (phase < lastPhase) { beat = true; strength = amp; }
    lastPhase = phase;
    b = Math.exp(-phase * 5) * 0.65 * amp;
    m = (0.2 + 0.08 * Math.sin(S.t * 2)) * amp;
    h = 0.18 * amp;
    a.real = false;
  }

  a.bass = smooth(a.bass, b, 0.65, 0.14, dt);
  a.mid = smooth(a.mid, m, 0.5, 0.12, dt);
  a.high = smooth(a.high, h, 0.5, 0.15, dt);
  a.level = a.bass * 0.5 + a.mid * 0.3 + a.high * 0.2;

  if (beat) {
    lastBeat = S.t; a.beat = 1;
    for (const f of beatCbs) f(strength);
  }
  a.beat *= Math.exp(-dt * 7);
}
