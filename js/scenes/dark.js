/* js/scenes/dark.js — the dark world: a 3D dome of dust, horizon, beam, orbiting outlines,
   and wireframe solids. Reacts to the music: bass swells the dome, highs brighten the dust,
   beats pulse rings and wire geometry, mids spin things faster. */
import { S } from '../core/state.js';
import { rnd, TAU } from '../core/util.js';
import { SHAPES, drawWire } from '../shapes/wire.js';
import { SYM } from '../shapes/symbols.js';

/* ---- particle dome (built once) ---- */
const N = innerWidth < 700 ? 3200 : 7500;
const P = { x: new Float32Array(N), y: new Float32Array(N), z: new Float32Array(N), b: new Uint8Array(N), s: new Uint8Array(N) };
{
  const tmp = [];
  for (let i = 0; i < N; i++) {
    const yy = Math.pow(Math.random(), 1.7), th = Math.random() * TAU, r = Math.sqrt(1 - yy * yy);
    const k = 0.86 + Math.pow(Math.random(), 3) * 0.4;
    tmp.push({ x: r * Math.cos(th) * k, y: yy * k, z: r * Math.sin(th) * k, b: Math.min(5, (yy * 6) | 0), s: Math.random() < 0.12 ? 2 : 1 });
  }
  tmp.sort((a, b) => a.b - b.b).forEach((p, i) => { P.x[i] = p.x; P.y[i] = p.y; P.z[i] = p.z; P.b[i] = p.b; P.s[i] = p.s; });
}
const mixc = (b) => { const k = b / 5; return `rgba(${255 + (138 - 255) * k | 0},${246 + (108 - 246) * k | 0},${255},${.5 + .4 * (1 - k)})`; };
const bucketCol = [0, 1, 2, 3, 4, 5].map(mixc);
const dust = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), p: rnd(6) }));

export function drawDark(ctx, a) {
  const { W, H, t, mouse } = S, A = S.a;
  const bass = A.bass, beat = A.beat;
  const hy = H * 0.56, cx = W * S.hubFx;
  const R = Math.min(W, H) * 0.36 * (1 + bass * 0.1 + beat * 0.03) * (1 + S.zoom * 0.18);
  const ay = t * (0.12 + A.mid * 0.25) + S.spin + (mouse.x / W - 0.5) * 1.3;
  const ca = Math.cos(ay), sa = Math.sin(ay);
  const tl = 0.26 + (mouse.y / H - 0.5) * 0.3 + S.zoom * 0.1, ct = Math.cos(tl), sT = Math.sin(tl);
  const glitchy = S.g > 0.25;

  ctx.globalAlpha = a;
  /* reactive light: halo breathes with bass, soft pulse on limited beats */
  const hg = ctx.createRadialGradient(cx, hy, 0, cx, hy, R * 1.35);
  hg.addColorStop(0, `rgba(150,120,255,${Math.min(0.62, 0.3 + bass * 0.32 + S.flash * 0.12)})`);
  hg.addColorStop(1, 'rgba(150,120,255,0)');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);

  /* dust dome */
  ctx.globalAlpha = Math.min(1, a * (0.8 + A.high * 0.7));
  let cb = -1;
  const glOff = glitchy ? rnd(-40, 40) * S.g : 0;
  for (let i = 0; i < N; i++) {
    const x = P.x[i], y = P.y[i], z = P.z[i];
    const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
    const y2 = y * ct - z1 * sT, z2 = y * sT + z1 * ct;
    const s = 1 / (1 - z2 * 0.3), k = 1 + bass * 0.06 * (0.4 + (i % 5) / 5);
    let sx = cx + x1 * R * s * k, sy = hy - y2 * R * s * k;
    if (sy > hy + 2) continue;
    const mdx = sx - mouse.x, mdy = sy - mouse.y, md = mdx * mdx + mdy * mdy;
    if (md < 9000) { const m = Math.sqrt(md) + 0.01, f = (95 - m) * 0.6; sx += mdx / m * f; sy += mdy / m * f; }
    if (glOff && i % 97 < 9) sx += glOff;
    const b = P.b[i];
    if (b !== cb) { cb = b; ctx.fillStyle = bucketCol[b]; }
    ctx.fillRect(sx, sy, P.s[i], P.s[i]);
  }
  ctx.globalAlpha = a;

  /* ground */
  ctx.beginPath();
  ctx.moveTo(0, hy + R * 0.14); ctx.lineTo(cx - R * 1.35, hy + R * 0.12);
  ctx.quadraticCurveTo(cx, hy - R * 0.16, cx + R * 1.35, hy + R * 0.12);
  ctx.lineTo(W, hy + R * 0.14); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = '#06050d'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx - R * 1.35, hy + R * 0.12);
  ctx.quadraticCurveTo(cx, hy - R * 0.16, cx + R * 1.35, hy + R * 0.12); ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,.55)';
  dust.forEach(p => { if (Math.sin(t * 3 + p.p) > -0.3) ctx.fillRect(p.x * W, hy + R * 0.2 + p.y * (H - hy - R * 0.2), 1.3, 1.3); });

  /* beam + chained rings (width and size follow the kick) */
  const bg = ctx.createLinearGradient(0, hy, 0, H);
  bg.addColorStop(0, `rgba(160,130,255,${0.26 + bass * 0.2})`); bg.addColorStop(1, 'rgba(160,130,255,0)');
  ctx.fillStyle = bg; ctx.fillRect(cx - R * (0.09 + bass * 0.05), hy, R * (0.18 + bass * 0.1), H - hy);
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1;
  for (let k = 0; k < 6; k++) {
    const r = (3 + k * 3.4) * (1 + beat * 0.25 + bass * 0.15) * (R / 260);
    const y = hy + R * 0.2 + k * R * 0.15 + Math.sin(t * 2 + k) * 3;
    ctx.beginPath(); ctx.arc(cx, y, r, 0, TAU); ctx.stroke();
  }

  /* orbiting outlines */
  [[-0.5, -0.62, 0.22, 0.6], [0.1, -0.95, 0.05, 1.1], [0.62, -0.45, 0.12, 0.8]].forEach(([ox, oy, rr, sp], i) => {
    ctx.beginPath();
    ctx.arc(cx + ox * R + Math.sin(t * sp + i) * 14, hy + oy * R + Math.cos(t * sp * 0.8 + i) * 10, rr * R * (1 + beat * 0.06 + A.mid * 0.2), 0, TAU);
    ctx.stroke();
  });
  const bx = cx + Math.sin(t * 0.35) * R * 0.55;
  ctx.beginPath(); ctx.arc(bx, hy - R * 0.06 + Math.abs(Math.sin(t * 0.35)) * R * 0.05, 11, 0, TAU); ctx.stroke();

  /* crescent */
  ctx.save();
  ctx.translate(cx - R * 0.6, hy + R * 0.5); ctx.rotate(Math.sin(t * 0.3) * 0.5);
  SYM.crescent(ctx, R * 0.2);
  ctx.restore();

  /* floating 3D wireframes — pulse with the beat, distort with glitch */
  const jit = glitchy ? S.g * 0.18 : 0;
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  drawWire(ctx, SHAPES.ico, cx, hy - R * 1.12 + Math.sin(t) * 6, R * 0.16 * (1 + bass * 0.6 + beat * 0.2), t * 0.5 + A.mid * 2 + S.spin, t * 0.7, jit);
  ctx.strokeStyle = 'rgba(190,175,255,.8)';
  drawWire(ctx, SHAPES.octa, cx + Math.cos(t * 0.4) * R * 0.95, hy - R * 0.55 + Math.sin(t * 0.4) * R * 0.15, R * 0.07 * (1 + beat * 0.5), t * 0.9, t * 1.2, jit);
  drawWire(ctx, SHAPES.cube, cx - R * 0.95, hy - R * 0.2 + Math.cos(t * 0.5) * 14, R * 0.06 * (1 + bass * 0.5), -t * 0.8, t * 0.6, jit);
  ctx.globalAlpha = 1;
}
