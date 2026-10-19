/* js/core/glitch.js — glitch energy + the photosensitivity safety valve.
   Everything "flashy" goes through kick() / flash() so rates stay capped. */
import { S } from './state.js';
import { SITE } from '../../config/site.js';

let lastKick = -9, lastFlash = -9;
const CAP = SITE.safeMode ? 1.0 : 1.4;

/* add glitch energy. Scaled by chaos; heavily damped for reduced-motion */
export function kick(v = 0.5) {
  if (S.reduced) v *= 0.12;
  if (S.t - lastKick < 0.09) v *= 0.35;            // rapid re-kicks count for less
  lastKick = S.t;
  S.g = Math.min(CAP, S.g + v * (0.35 + S.chaos * 0.9));
}

/* soft light pulse (used on beats). Max ~3 per second, low amplitude. */
export function flash(amount = 1) {
  const gap = SITE.safeMode ? 0.34 : 0.15;
  if (S.reduced || S.t - lastFlash < gap) return false;
  lastFlash = S.t;
  S.flash = Math.min(1, amount);
  return true;
}

export function update(dt) {
  S.g *= S.reduced ? 0.8 : Math.pow(0.92, dt * 60);
  S.flash *= Math.pow(0.86, dt * 60);
}
