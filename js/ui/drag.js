/* js/ui/drag.js — make any element freely draggable (mouse, touch, pen).
   Used by every piece of the player. A small movement is still a click/tap, a real drag is not.
   Positions are remembered (as fractions of the screen) so layouts survive resizes and reloads. */
import { S } from '../core/state.js';
import { clamp, store } from '../core/util.js';

const THRESH = 6;
export const pieces = [];

/* el: the element that gets translated.  handle: where a drag may start (default: el itself). */
export function makeDraggable(el, { id, handle = el, onDrop } = {}) {
  const p = { el, id, x: 0, y: 0, hx: 0, hy: 0, drag: false, moved: false, ph: pieces.length * 1.7, custom: false, onDrop };
  pieces.push(p);
  el.classList.add('pc');
  el.style.position = 'absolute'; el.style.left = '0'; el.style.top = '0';

  let st = null;
  /* move/up are listened for on the window, so a fast drag can't "outrun" a small piece */
  const move = e => {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.sx, dy = e.clientY - st.sy;
    if (!st.live && Math.hypot(dx, dy) > THRESH) { st.live = true; p.drag = true; p.moved = true; el.classList.add('dragging'); }
    if (st.live) setPos(p, st.ox + dx, st.oy + dy);
  };
  const up = e => {
    if (!st || e.pointerId !== st.id) return;
    removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
    if (st.live) {
      p.drag = false; p.custom = true; el.classList.remove('dragging');
      save(p);
      p.onDrop && p.onDrop(p);
      setTimeout(() => { p.moved = false; }, 60);      // swallow the click that follows a drag
    }
    st = null;
  };
  handle.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    st = { sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, id: e.pointerId, live: false };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
  /* a drag must never fire the button underneath it */
  el.addEventListener('click', e => { if (p.moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  el.addEventListener('dragstart', e => e.preventDefault());
  return p;
}

export function setPos(p, x, y) {
  const w = p.el.offsetWidth || 40, h = p.el.offsetHeight || 40;
  p.x = clamp(x, 4, Math.max(4, S.W - w - 4));
  p.y = clamp(y, 4, Math.max(4, S.H - h - 4));
}

function save(p) { if (p.id) store.set('pc:' + p.id, [p.x / S.W, p.y / S.H]); }

/* place a piece at its default home, unless the visitor moved it before */
export function home(p, x, y) {
  p.hx = x; p.hy = y;
  const s = p.id && store.get('pc:' + p.id, null);
  if (s && Array.isArray(s)) { setPos(p, s[0] * S.W, s[1] * S.H); p.custom = true; }
  else { setPos(p, x, y); p.custom = false; }
}

export function resetAll(relayout) {
  pieces.forEach(p => { if (p.id) store.set('pc:' + p.id, null); p.custom = false; });
  relayout();
}
