/* js/core/state.js — the single shared state object every module reads.
   Audio features (S.a) are written by audio/engine.js each frame. */
import { SITE } from '../../config/site.js';

const P = SITE.palette;

export const S = {
  W: 0, H: 0, DPR: 1,
  t: 0, dt: 0.016,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  coarse: matchMedia('(pointer: coarse)').matches,

  /* worlds: d = 1 dark, 0 light (eased); target = where it is heading */
  d: 1, target: 1,

  /* chaos controls: g = glitch energy, chaos = overall intensity, calm = breathing moments */
  g: 0, chaos: 0.5, calm: 0, flash: 0,

  /* camera-ish controls from wheel / drag */
  spin: 0, spinV: 0, zoom: 0, zoomT: 0,

  mouse: { x: innerWidth / 2, y: innerHeight / 2 },
  hub: { x: 0, y: 0 }, hubFx: 0.5,     // hubFx = horizontal centre of the composition (shifts left in short landscape)

  /* live palette (updated by core/world.js) */
  bg: P.dark.bg.slice(), ink: P.dark.ink.slice(), blue: P.dark.blue.slice(), big: P.dark.big.slice(),
  inkc: 'rgb(255,255,255)',

  /* audio features, 0..1 */
  a: { bass: 0, mid: 0, high: 0, level: 0, beat: 0, playing: false, real: false, freq: null },

  introActive: false
};
