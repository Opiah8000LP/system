/* js/ui/title.js — the giant distorted RDWEEB, corner tags, the pulsing hub and 3D ring,
   and the contact note. All DOM; the canvas sits behind. */
import { S } from '../core/state.js';
import { SITE } from '../../config/site.js';
import { mk, rnd, pick, GL } from '../core/util.js';
import { scramble } from './links.js';
import { onBeat } from '../audio/engine.js';

const bigs = mk('div', 'layer'); bigs.id = 'bigs';
const letters = [];
const word = SITE.name.toUpperCase();
['top', 'bot'].forEach(pos => {
  const d = mk('div', 'big ' + pos, bigs);
  d.setAttribute('aria-hidden', 'true');
  word.split('').forEach(ch => { const i = mk('i', '', d, ch); i.dataset.c = ch; letters.push(i); });
});

const corners = mk('div', 'layer');
const cL = mk('div', 'corner l', corners, '[ dweeb ]');
const cR = mk('div', 'corner r', corners, '[ contact ]');
const CORNER_WORDS = ['[ dweeb ]', '[ contact ]', `[ ${SITE.name.toLowerCase()} ]`, '[ send it ]', '[ say hi ]'];

/* hub square + 3D ring */
const hubEl = mk('div', 'hub'); mk('b', '', hubEl);
const ringEl = mk('div', 'ring');
const ring = { c: mk('div', '', ringEl), a: mk('span', '', ringEl, 'send'), b: mk('span', '', ringEl, 'receive'), h: mk('hr', '', ringEl) };

/* the note — a quiet line under the chaos */
export const note = mk('p', 'note');
note.textContent = SITE.note;

/* distortion rhythm: ambient + extra on beats */
function mutate(L) {
  const m = Math.random();
  if (m < 0.4) L.style.transform = `scale(${rnd(0.5, 1.8)},${rnd(0.6, 1.3)}) skewX(${rnd(-30, 30)}deg)`;
  else if (m < 0.55) L.style.transform = 'rotate(180deg)';
  else if (m < 0.7) L.textContent = pick(GL);
  else if (m < 0.85) L.style.transform = `translateY(${rnd(-8, 8)}%) scaleY(-1)`;
  else L.style.transform = '';
  setTimeout(() => { L.style.transform = ''; L.textContent = L.dataset.c; }, rnd(80, 420));
}

export function init() {
  setInterval(() => {
    if (S.reduced || S.introActive) return;
    const n = Math.max(0, Math.round(S.chaos * 3 * (1 - S.calm)));
    for (let k = 0; k < n; k++) if (Math.random() < 0.8) mutate(pick(letters));
  }, 110);
  setInterval(() => {
    if (S.reduced || S.introActive) return;
    if (Math.random() < 0.5) scramble(pick([cL, cR]), pick(CORNER_WORDS), 300);
  }, 2100);
  onBeat(str => {
    if (S.reduced || S.introActive) return;
    if (str > 0.6 && Math.random() < 0.5) mutate(pick(letters));
  });
}

export function layout() {
  const rs = Math.min(S.W * 0.46, 300);
  ring.c.style.cssText = `left:${-rs / 2}px;top:${-rs / 2}px;width:${rs}px;height:${rs}px`;
  ring.a.style.cssText = `left:${-rs * 0.36}px;top:${-rs * 0.2}px`;
  ring.b.style.cssText = `left:${-rs * 0.4}px;top:${rs * 0.02}px`;
  ring.h.style.cssText = `left:${-rs * 0.47}px;top:${-rs * 0.03}px;width:${rs * 0.62}px`;
}

export function update() {
  const { t, mouse, W, H, g } = S, A = S.a;
  const px = (mouse.x / W - 0.5), py = (mouse.y / H - 0.5);
  /* bigs breathe with the kick and parallax away from the cursor (a layer behind the nodes) */
  bigs.style.transform = `translate3d(${-px * 22}px,${-py * 14}px,0) scale(${1 + A.beat * 0.02 + A.bass * 0.012 + g * 0.012})`;

  S.hub.x = W * S.hubFx + Math.sin(t * 0.5) * 12 + (mouse.x - W / 2) * 0.015;
  S.hub.y = H * 0.47 + Math.cos(t * 0.4) * 10 + (mouse.y - H / 2) * 0.015;
  hubEl.style.transform = `translate(${S.hub.x}px,${S.hub.y}px) rotate(${t * 40 + A.mid * 60}deg) scale(${1 + A.beat * 0.45 + A.bass * 0.2})`;
  ringEl.style.transform = `translate(${S.hub.x}px,${S.hub.y}px) perspective(700px) rotateX(${Math.sin(t * 0.7) * 30 + py * 40}deg) rotateY(${Math.cos(t * 0.5) * 35 + px * 60}deg) rotateZ(${Math.sin(t * 0.3) * 25 + g * 20 + S.spin * 40}deg) scale(${1 + A.bass * 0.15})`;
}
