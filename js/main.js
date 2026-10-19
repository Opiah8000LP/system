/* js/main.js — the conductor. Boots modules, runs the single animation loop.
   Order each frame:  audio analysis → glitch/mood → palette → input → DOM layers → canvas. */
import { ctx, resize, onResize } from './ui/dom.js';
import { S } from './core/state.js';
import { SITE } from '../config/site.js';

import * as glitch from './core/glitch.js';
import * as mood from './core/mood.js';
import * as world from './core/world.js';
import * as engine from './audio/engine.js';
import * as Player from './audio/player.js';
import * as links from './ui/links.js';
import * as title from './ui/title.js';
import * as playerUI from './ui/playerUI.js';
import * as input from './ui/input.js';
import * as gate from './ui/gate.js';
import { drawDark } from './scenes/dark.js';
import { drawLight } from './scenes/light.js';
import { drawOverlay, pulseShards, tickShards } from './scenes/overlay.js';

/* ---------- boot ---------- */
if (S.reduced) document.body.classList.add('reduced-fx');
Player.init();
links.init(input.cursor);
title.init();
playerUI.init();
input.init();
document.body.appendChild(title.note);

/* favicon from config (your own file) */
if (SITE.favicon) {
  let l = document.querySelector('link[rel="icon"]');
  if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); }
  l.href = SITE.favicon;
}

onResize(() => { links.layout(); title.layout(); playerUI.layout(); });
resize();

/* ---------- tap to enter: the gesture that unlocks audio ---------- */
gate.init(() => {
  engine.ensureCtx(); engine.resume();
  if (SITE.player.autoplayOnEnter) Player.play(); else Player.unlock();
  glitch.kick(1.0);
});

/* ---------- beat reactions: low = slow & heavy, high = fast & dense ---------- */
let lowHits = 0, lastAuto = 0;
engine.onBeat((band, str) => {
  if (S.gated) return;
  if (band === 'low') {
    glitch.flash(0.5 + str * 0.5);                 // soft, rate-limited wash
    if (str > 0.55) glitch.kick(0.1 + str * 0.25);
    pulseShards(str);
    lowHits++;
    const { everyBeats, minSeconds } = SITE.autoSwitch;
    if (lowHits >= everyBeats && S.t - lastAuto > minSeconds && S.calm < 0.2) { lowHits = 0; lastAuto = S.t; world.toggleWorld(); }
  } else {
    glitch.kick(0.03 + str * 0.05);                // many tiny glitch nudges
    tickShards(str);
  }
});

/* ---------- main loop ---------- */
let last = performance.now();
function frame(ms) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ms - last) / 1000); last = ms;
  S.t = ms / 1000; S.dt = dt;

  engine.update(dt, Player.state.playing);
  glitch.update(dt);
  mood.update(dt);
  world.updatePalette();
  input.update(dt);
  title.update();
  links.update(dt);
  playerUI.update();
  document.body.classList.toggle('gl', S.g > 0.3 && !S.reduced);

  /* canvas */
  ctx.setTransform(S.DPR, 0, 0, S.DPR, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgb(${S.bg[0] | 0},${S.bg[1] | 0},${S.bg[2] | 0})`;
  ctx.fillRect(0, 0, S.W, S.H);
  if (1 - S.d > 0.01) drawLight(ctx, 1 - S.d);
  if (S.d > 0.01) drawDark(ctx, S.d);
  drawOverlay(ctx, dt);
}
requestAnimationFrame(frame);

window.RDWEEB = { S, Player, world };   // handy in the console
