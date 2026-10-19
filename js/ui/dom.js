/* js/ui/dom.js — the one full-screen canvas + resize handling.
   Imported first so the canvas sits underneath every other layer. */
import { mk } from '../core/util.js';
import { S } from '../core/state.js';

export const cv = mk('canvas');
cv.id = 'bg';
export const ctx = cv.getContext('2d', { alpha: false });

const cbs = [];
export const onResize = f => { cbs.push(f); };

export function resize() {
  S.DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  S.W = innerWidth; S.H = innerHeight;
  cv.width = (S.W * S.DPR) | 0;
  cv.height = (S.H * S.DPR) | 0;
  cbs.forEach(f => f());
}
addEventListener('resize', resize);
