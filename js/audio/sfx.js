/* js/audio/sfx.js — tiny UI blips. Silent until the visitor's first interaction
   creates the AudioContext, and silent whenever the player is muted. */
import * as engine from './engine.js';
import { rnd } from '../core/util.js';

export function blip(f = 220, dur = 0.06, type = 'square', v = 0.025) {
  const c = engine.ctx();
  if (!c || c.state !== 'running' || engine.isMuted()) return;
  try {
    const o = c.createOscillator(), g = c.createGain(), n = c.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(f, n);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f * rnd(0.25, 3)), n + dur);
    g.gain.setValueAtTime(v * Math.max(0.2, engine.getDuck()), n);
    g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(n + dur);
  } catch (e) {}
}
