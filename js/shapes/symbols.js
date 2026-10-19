/* js/shapes/symbols.js — vector symbol library (centered on 0,0, radius r).
   Used by the intro and as faint glitch "shards" on the main page.
   Stroke-only: set strokeStyle / lineWidth before calling. */
import { TAU, sr } from '../core/util.js';

const ln = (c, x1, y1, x2, y2) => { c.moveTo(x1, y1); c.lineTo(x2, y2); };
const circ = (c, r, x = 0, y = 0) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); };

export const SYM = {
  /* ---------- contradictory / unsettling set ---------- */
  cross(c, r) { c.beginPath(); ln(c, 0, -r, 0, r); ln(c, -r * 0.5, -r * 0.38, r * 0.5, -r * 0.38); c.stroke(); },
  invertedCross(c, r) { c.save(); c.rotate(Math.PI); SYM.cross(c, r); c.restore(); },
  pentagram(c, r) {
    circ(c, r);
    c.beginPath();
    for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 2 * TAU / 5; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  },
  invertedPentagram(c, r) { c.save(); c.rotate(Math.PI); SYM.pentagram(c, r); c.restore(); },
  sigil(c, r, seed = 1) {
    circ(c, r);
    const n = 7, p = [];
    for (let i = 0; i < n; i++) { const a = sr(seed + i) * TAU, d = r * (0.35 + 0.6 * sr(seed * 3 + i)); p.push([Math.cos(a) * d, Math.sin(a) * d]); }
    c.beginPath();
    p.forEach((q, i) => { i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); });
    for (let i = 0; i < 3; i++) { const a = p[(sr(seed + i * 5) * n) | 0], b = p[(sr(seed + i * 9) * n) | 0]; ln(c, a[0], a[1], b[0], b[1]); }
    c.stroke();
    p.forEach(q => circ(c, r * 0.05, q[0], q[1]));
  },
  eyeTriangle(c, r) {
    c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.87, r * 0.5); c.lineTo(-r * 0.87, r * 0.5); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(-r * 0.32, r * 0.05); c.quadraticCurveTo(0, -r * 0.3, r * 0.32, r * 0.05); c.quadraticCurveTo(0, r * 0.3, -r * 0.32, r * 0.05); c.stroke();
    circ(c, r * 0.08, 0, r * 0.05);
    c.beginPath(); for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * 0.28; ln(c, Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1 + r * 0.1, Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35 + r * 0.1); } c.stroke();
  },
  ouroboros(c, r) {
    c.beginPath();
    for (let i = 0; i <= 80; i++) { const p = i / 80, a = 0.4 + p * (TAU - 0.5), rr = r * (0.82 + 0.18 * p); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    const a = TAU - 0.1, x = Math.cos(a) * r, y = Math.sin(a) * r;
    c.beginPath(); c.moveTo(x + r * 0.12, y - r * 0.1); c.lineTo(x - r * 0.05, y + r * 0.05); c.lineTo(x + r * 0.1, y + r * 0.14); c.closePath(); c.stroke();
  },
  crescent(c, r) { c.beginPath(); c.arc(0, 0, r, 0.55 * Math.PI, 1.45 * Math.PI); c.arc(r * 0.42, 0, r * 0.78, 1.5 * Math.PI, 0.5 * Math.PI, true); c.closePath(); c.stroke(); },
  chiRho(c, r) {
    c.beginPath(); ln(c, 0, -r, 0, r); ln(c, -r * 0.7, -r * 0.7, r * 0.7, r * 0.7); ln(c, r * 0.7, -r * 0.7, -r * 0.7, r * 0.7); c.stroke();
    c.beginPath(); c.arc(r * 0.02, -r * 0.62, r * 0.3, -Math.PI / 2, Math.PI / 2); c.stroke();
  },
  ichthys(c, r) {
    c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(-r * 0.1, -r * 0.8, r * 0.95, r * 0.42);
    c.moveTo(-r, 0); c.quadraticCurveTo(-r * 0.1, r * 0.8, r * 0.95, -r * 0.42); c.stroke();
    circ(c, r * 0.05, -r * 0.6, -r * 0.05);
  },
  ankh(c, r) {
    c.beginPath(); c.ellipse(0, -r * 0.5, r * 0.3, r * 0.42, 0, 0, TAU); ln(c, 0, -r * 0.08, 0, r); ln(c, -r * 0.55, r * 0.12, r * 0.55, r * 0.12); c.stroke();
  },
  thorns(c, r) {
    c.beginPath();
    for (let i = 0; i < 56; i++) { const a = (i / 56) * TAU, rr = i % 2 ? r : r * (1.08 + sr(i * 3) * 0.25); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); c.stroke();
  },
  seals(c, r) {
    circ(c, r); circ(c, r * 0.82); circ(c, r * 0.45);
    c.beginPath(); for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; ln(c, Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); } c.stroke();
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + 0.2; circ(c, r * 0.07, Math.cos(a) * r * 0.64, Math.sin(a) * r * 0.64); }
  },

  /* ---------- tender set ---------- */
  halo(c, r) { c.save(); c.scale(1, 0.28); circ(c, r); circ(c, r * 0.86); c.restore(); },
  dove(c, r) {
    c.beginPath();
    c.moveTo(-r * 0.6, r * 0.12); c.bezierCurveTo(-r * 0.2, r * 0.38, r * 0.35, r * 0.3, r * 0.62, -r * 0.08);
    c.bezierCurveTo(r * 0.7, -r * 0.2, r * 0.58, -r * 0.3, r * 0.5, -r * 0.2);
    c.bezierCurveTo(r * 0.3, -r * 0.14, -r * 0.1, -r * 0.1, -r * 0.6, r * 0.12);
    c.moveTo(-r * 0.05, -r * 0.08); c.bezierCurveTo(-r * 0.2, -r * 0.6, r * 0.1, -r * 0.98, r * 0.45, -r * 0.88);
    c.bezierCurveTo(r * 0.3, -r * 0.55, r * 0.26, -r * 0.25, r * 0.16, -r * 0.1);
    c.moveTo(-r * 0.6, r * 0.12); c.lineTo(-r * 0.95, r * 0.02); c.moveTo(-r * 0.6, r * 0.12); c.lineTo(-r * 0.92, r * 0.25);
    c.stroke();
  },
  heart(c, r) {
    c.beginPath(); c.moveTo(0, r * 0.55); c.bezierCurveTo(-r * 1.1, -r * 0.25, -r * 0.5, -r * 0.9, 0, -r * 0.3); c.bezierCurveTo(r * 0.5, -r * 0.9, r * 1.1, -r * 0.25, 0, r * 0.55); c.stroke();
  },
  rosette(c, r, petals = 8) {
    for (let i = 0; i < petals; i++) { c.save(); c.rotate((i / petals) * TAU); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(r * 0.38, -r * 0.5, 0, -r); c.quadraticCurveTo(-r * 0.38, -r * 0.5, 0, 0); c.stroke(); c.restore(); }
  },
  rays(c, r, n = 24) {
    c.beginPath(); for (let i = 0; i < n; i++) { const a = (i / n) * TAU, in_ = r * (i % 2 ? 0.7 : 0.55); ln(c, Math.cos(a) * in_, Math.sin(a) * in_, Math.cos(a) * r, Math.sin(a) * r); } c.stroke();
  }
};

export const CHAOS_SET = ['invertedCross', 'invertedPentagram', 'sigil', 'eyeTriangle', 'ouroboros', 'crescent', 'chiRho', 'ichthys', 'thorns', 'seals', 'ankh', 'cross'];
/* faint shards on the main page mix both moods */
export const SHARD_SET = [...CHAOS_SET, 'dove', 'heart', 'rosette', 'halo'];
