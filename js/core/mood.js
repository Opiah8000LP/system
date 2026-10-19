/* js/core/mood.js — slow "breathing" so the chaos has moments of calm.
   chaos rises with the music's energy, and every ~50 s the site exhales for a few seconds. */
import { S } from './state.js';
import { clamp, smooth } from './util.js';

const CYCLE = 52, CALM_START = 43;          // seconds: last 9 s of each cycle are calm

export function update(dt) {
  const inCalm = (S.t % CYCLE) > CALM_START && !S.gated;
  S.calm = smooth(S.calm, inCalm ? 1 : 0, 0.02, 0.03, dt);

  let c = 0.32 + 0.28 * Math.sin(S.t * 0.13) + S.a.level * 0.65;
  if (!S.a.playing) c = 0.28 + 0.12 * Math.sin(S.t * 0.2);
  c *= 1 - S.calm * 0.85;
  if (S.reduced) c *= 0.3;
  S.chaos = clamp(c, 0.04, 1);
}
