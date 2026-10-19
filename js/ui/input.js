/* js/ui/input.js — mouse, touch, wheel and keyboard. One place for every gesture.
     move            → parallax + dust repel
     click / tap     → symbol burst; on empty space swaps the world
     wheel / drag    → spin + zoom the dome (touch: drag on empty space)
     keys            → Space world · P play · N next · B back · M mute · L playlist · R reset layout · Esc close */
import { S } from '../core/state.js';
import { mk, clamp } from '../core/util.js';
import { kick } from '../core/glitch.js';
import { blip } from '../audio/sfx.js';
import * as engine from '../audio/engine.js';
import * as Player from '../audio/player.js';
import { toggleWorld } from '../core/world.js';
import { burst } from '../scenes/overlay.js';
import { toggleList, closeList, resetLayout } from './playerUI.js';

export const cursor = mk('div'); cursor.id = 'cur';
const dot = mk('div'); dot.id = 'dot';
const cp = { x: S.mouse.x, y: S.mouse.y };

let drag = null;

const INTERACTIVE = '.node, .pcw, .gate, button, a, input, [role="slider"]';

export function init() {
  addEventListener('pointermove', e => {
    const sp = Math.hypot(e.clientX - S.mouse.x, e.clientY - S.mouse.y);
    S.mouse.x = e.clientX; S.mouse.y = e.clientY;
    if (sp > 40 && !S.gated) kick(Math.min(0.12, sp * 0.0008));
    if (drag) {
      const dx = e.clientX - drag.x;
      S.spinV += dx * 0.0016; drag.x = e.clientX;
      if (Math.abs(e.clientX - drag.sx) > 8 || Math.abs(e.clientY - drag.sy) > 8) drag.moved = true;
    }
  }, { passive: true });

  addEventListener('pointerdown', e => {
    engine.ensureCtx(); engine.resume();
    if (S.gated) return;
    burst(e.clientX, e.clientY);
    kick(0.5);
    blip(120 + Math.random() * 380, 0.09, 'sawtooth', 0.035);
    if (!e.target.closest || !e.target.closest(INTERACTIVE)) drag = { x: e.clientX, sx: e.clientX, sy: e.clientY, moved: false };
  });
  addEventListener('pointerup', () => {
    /* a tap on empty space (not a drag) swaps worlds */
    if (drag && !drag.moved && !S.gated) toggleWorld();
    drag = null;
  });
  addEventListener('pointercancel', () => { drag = null; });

  addEventListener('wheel', e => {
    if (S.gated || (e.target.closest && e.target.closest('.pc-panel'))) return;
    S.spinV += clamp(e.deltaY, -120, 120) * 0.0009;
    S.zoomT = clamp(S.zoomT + e.deltaY * 0.0006, -1, 1);
    kick(0.06);
  }, { passive: true });

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase(), onCtl = tag === 'button' || tag === 'a' || e.target.getAttribute('role') === 'slider';
    const k = e.key.toLowerCase();
    if (S.gated) return;
    if (k === 'escape') { closeList(); return; }
    if (e.code === 'Space' && !onCtl) { e.preventDefault(); toggleWorld(); }
    else if (k === 'p') Player.toggle();
    else if (k === 'n') Player.next();
    else if (k === 'b') Player.prev();
    else if (k === 'm') Player.toggleMute();
    else if (k === 'l') toggleList();
    else if (k === 'r') resetLayout();
  });

  /* keep the 100vh sane on phones with collapsing toolbars */
  const vh = () => document.documentElement.style.setProperty('--vh', innerHeight * 0.01 + 'px');
  vh(); addEventListener('resize', vh); addEventListener('orientationchange', () => setTimeout(vh, 200));
}

export function update(dt) {
  S.spin += S.spinV; S.spinV *= Math.pow(0.93, dt * 60);
  S.zoom += (S.zoomT - S.zoom) * 0.08; S.zoomT *= Math.pow(0.97, dt * 60);
  cp.x += (S.mouse.x - cp.x) * 0.22; cp.y += (S.mouse.y - cp.y) * 0.22;
  cursor.style.transform = `translate(${cp.x}px,${cp.y}px) scale(${1 + S.a.beat * 0.25})`;
  dot.style.transform = `translate(${S.mouse.x}px,${S.mouse.y}px)`;
}
