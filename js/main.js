/* js/main.js — the conductor. Boots modules, runs the single animation loop.
   Order each frame:  audio analysis → glitch/mood → palette → input → DOM layers → canvas. */
import { cv, ctx, resize, onResize } from './ui/dom.js';
import { S } from './core/state.js';
import { SITE } from '../config/site.js';
import { INTRO } from '../config/intro.js';
import { mk } from './core/util.js';

import * as glitch from './core/glitch.js';
import * as mood from './core/mood.js';
import * as world from './core/world.js';
import * as engine from './audio/engine.js';
import * as Player from './audio/player.js';
import * as links from './ui/links.js';
import * as title from './ui/title.js';
import * as playerUI from './ui/playerUI.js';
import * as input from './ui/input.js';
import * as intro from './intro/sequence.js';
import { drawDark } from './scenes/dark.js';
import { drawLight } from './scenes/light.js';
import { drawOverlay, pulseShards } from './scenes/overlay.js';

/* ---------- boot ---------- */
if (S.reduced) document.body.classList.add('reduced-fx');
Player.init();
links.init(input.cursor);
title.init();
playerUI.init();
input.init();

/* DOM stacking order is handled in CSS (z-index); nothing else to append except these two */
document.body.appendChild(title.note);
document.body.appendChild(playerUI.root);
const replay = mk('button', 'replay', document.body, '↻ intro');
replay.setAttribute('aria-label', 'Replay intro');
if (!INTRO.enabled) replay.hidden = true;

onResize(() => { links.layout(); title.layout(); });
resize();

/* ---------- audio start rules: only after a real gesture ---------- */
let started = false;
function firstGesture() {
  engine.ensureCtx(); engine.resume();
  Player.unlock();                         // warms Safari / iOS; does not make sound
  if (!INTRO.enabled && !started) { started = true; if (SITE.player.autoplayAfterIntro) Player.play(); }
}
addEventListener('pointerdown', firstGesture, { capture: true });
addEventListener('keydown', firstGesture, { capture: true });

/* ---------- beat reactions ---------- */
let beats = 0, lastAuto = 0;
engine.onBeat(str => {
  if (S.introActive) return;
  glitch.flash(0.5 + str * 0.5);
  if (str > 0.55) glitch.kick(0.1 + str * 0.25);
  pulseShards(str);
  beats++;
  const { everyBeats, minSeconds } = SITE.autoSwitch;
  if (beats >= everyBeats && S.t - lastAuto > minSeconds && S.calm < 0.2) { beats = 0; lastAuto = S.t; world.toggleWorld(); }
});

/* ---------- intro control ---------- */
function runIntro() {
  engine.setDuck(0.12);                    // music (if any) sinks beneath the intro
  S.target = 1;
  intro.play(() => {
    engine.setDuck(1);
    if (!started && SITE.player.autoplayAfterIntro) { started = true; Player.play(); }
    glitch.kick(1.0);
    document.body.classList.add('ready');
  });
}
replay.addEventListener('click', () => { document.body.classList.remove('ready'); runIntro(); });
input.onReplay(() => { if (INTRO.enabled && !S.introActive) { document.body.classList.remove('ready'); runIntro(); } });
input.onSkip(() => intro.skip());

if (INTRO.enabled) runIntro();
else document.body.classList.add('ready');

/* ---------- main loop ---------- */
let last = performance.now();
function frame(ms) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ms - last) / 1000); last = ms;
  S.t = ms / 1000; S.dt = dt;

  engine.update(dt, Player.state.playing, Player.current().bpm);
  glitch.update(dt);
  mood.update(dt);
  world.updatePalette();
  input.update(dt);
  title.update();
  links.update(dt);
  playerUI.update();
  document.body.classList.toggle('gl', S.g > 0.3 && !S.reduced);
  document.body.classList.toggle('light-ui', S.d < 0.5);

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

/* handy for debugging in the console */
window.RDWEEB = { S, Player, world };
