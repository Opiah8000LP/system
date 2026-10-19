/* js/core/world.js — the two worlds (dark dome / pale collage) and the live palette. */
import { S } from './state.js';
import { SITE } from '../../config/site.js';
import { mix3, rgb } from './util.js';
import { kick } from './glitch.js';
import { blip } from '../audio/sfx.js';

let lastToggle = -9;

export function setWorld(v) {
  /* cooldown stops rapid clicking from turning the screen into a strobe */
  if (SITE.safeMode && S.t - lastToggle < 1.2) return;
  lastToggle = S.t;
  S.target = v;
  kick(1);
  blip(90, 0.2, 'sawtooth', 0.04);
}
export const toggleWorld = () => setWorld(S.target ? 0 : 1);

export function updatePalette() {
  const P = SITE.palette;
  const r = S.reduced ? 1 : 1 - Math.pow(1 - (SITE.safeMode ? 0.06 : 0.09), S.dt * 60);   // frame-rate independent
  S.d += (S.target - S.d) * r;
  S.bg = mix3(P.light.bg, P.dark.bg, S.d);
  S.ink = mix3(P.light.ink, P.dark.ink, S.d);
  S.blue = mix3(P.light.blue, P.dark.blue, S.d);
  S.big = mix3(P.light.big, P.dark.big, S.d);
  S.inkc = rgb(S.ink);
  const rs = document.documentElement.style;
  rs.setProperty('--ink', S.inkc);
  rs.setProperty('--blue', rgb(S.blue));
  rs.setProperty('--big', rgb(S.big));
  rs.setProperty('--bg', rgb(S.bg));
  document.body.style.background = rgb(S.bg);
}
