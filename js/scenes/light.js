/* js/scenes/light.js — the pale world: contour map, sky collage, spiky burst, pearls, scribble.
   Same language as the dark world, but flat, printed, analogue. Music nudges every layer. */
import { S } from '../core/state.js';
import { sr, rnd, TAU } from '../core/util.js';
import { SHAPES, drawWire } from '../shapes/wire.js';

/* sky texture (rendered once) */
const tex = document.createElement('canvas');
tex.width = tex.height = 512;
{
  const c = tex.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#587cae'); gr.addColorStop(1, '#a8b5c6');
  c.fillStyle = gr; c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) {
    const x = rnd(512), y = rnd(80, 512), r = rnd(26, 110);
    const rg = c.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,255,255,.85)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = rg; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 3500; i++) {
    c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(20,30,60,.18)';
    c.fillRect(rnd(512), rnd(512), rnd(1, 3), rnd(1, 3));
  }
}

const BASE = [[-1.05, -0.55], [-0.1, -0.55], [0.35, -0.55], [1, -0.55], [1, -0.12], [0.5, -0.1], [0.52, 0.32], [0.1, 0.36], [-0.4, 0.3], [-0.62, 0.58], [-0.82, 0.58]];

export function drawLight(ctx, a) {
  const { W, H, t, mouse } = S, A = S.a;
  const bass = A.bass, beat = A.beat;
  const step = Math.floor(t * 5) + A.lowN;       // geometry reshuffles on every bass hit
  const gl = S.g > 0.2;
  ctx.globalAlpha = a;

  /* contour map — wobble amplitude rides the bass */
  const ccx = W * 0.5 + Math.sin(t * 0.3) * W * 0.05 + (mouse.x - W / 2) * 0.04;
  const ccy = H * 0.5 + (mouse.y - H / 2) * 0.04;
  const maxR = Math.max(W, H) * 0.55 * (1 + S.zoom * 0.12);
  const amp = 0.1 * (1 + bass * 1.6);
  ctx.strokeStyle = `rgba(20,20,30,${0.17 + beat * 0.08 + A.tick * 0.1})`; ctx.lineWidth = 1;
  for (let k = 0; k < 16; k++) {
    const r = ((k + 1) / 16) * maxR;
    ctx.beginPath();
    for (let s = 0; s <= 80; s++) {
      const an = (s / 80) * TAU;
      const rr = r * (1 + amp * Math.sin(3 * an + t * 0.5 + k * 0.4 + S.spin) + 0.06 * Math.sin(7 * an - t * 0.9 + k) + (gl ? rnd(-0.03, 0.03) * S.g : 0));
      const x = ccx + Math.cos(an) * rr * 1.25, y = ccy + Math.sin(an) * rr * 0.8;
      s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }

  /* sky collage polygon with stepped jitter */
  const Sz = Math.min(W, H) * 0.52, bx = W * 0.5, by = H * 0.47;
  ctx.save();
  ctx.beginPath();
  BASE.forEach(([x, y], i) => {
    const j = (sr(step * 9 + i) - 0.5) * 0.14, j2 = (sr(step * 7 + i * 3) - 0.5) * 0.12;
    const px = bx + (x + j) * Sz * 1.1 + Math.sin(t * 0.4 + i) * 6, py = by + (y + j2) * Sz * 0.95;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.closePath(); ctx.clip();
  ctx.drawImage(tex, bx - Sz * 1.3 + Math.sin(t * 0.2) * 40, by - Sz * 1.1, Sz * 2.6, Sz * 2.2);
  ctx.restore();

  /* spiky burst — kicks outward on the beat */
  ctx.save();
  ctx.translate(bx + Sz * 0.32, by - Sz * 0.1);
  ctx.rotate(t * 0.25 + A.mid * 0.4 + (gl ? rnd(-0.2, 0.2) * S.g : 0));
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#f3f3f3';
  ctx.beginPath();
  const sp = 11, pk = 1 + beat * 0.14 + bass * 0.12;
  for (let i = 0; i < sp * 2; i++) {
    const an = (i * Math.PI) / sp, rr = i % 2 ? Sz * 0.09 : Sz * (0.2 + 0.22 * sr(i + step));
    const x = Math.cos(an) * rr * pk, y = Math.sin(an) * rr * pk;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();

  /* blue disc + dither bar */
  ctx.fillStyle = '#5b6fe0';
  ctx.beginPath(); ctx.arc(bx + Math.sin(t * 0.6) * Sz * 0.1, by - Sz * 0.62, 19 + beat * 6, 0, TAU); ctx.fill();
  const dx = W * 0.16, dy = H * 0.66, dw = 130, dh = 40;
  const dg = ctx.createLinearGradient(dx, 0, dx + dw, 0);
  dg.addColorStop(0, '#6a5cf0'); dg.addColorStop(1, '#f2f2f2');
  ctx.fillStyle = dg; ctx.fillRect(dx, dy, dw * (1 + bass * 0.3), dh);
  for (let i = 0; i < 110; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#4b3fd0';
    ctx.fillRect(dx + Math.random() * dw * Math.random(), dy + Math.random() * dh, 1.5, 1.5);
  }

  /* 3D pearls */
  for (let k = 0; k < 4; k++) {
    const x = W * (0.12 + 0.26 * k) + Math.sin(t * 0.7 + k * 2) * 40, y = H * (0.2 + 0.5 * ((k * 0.37) % 1)) + Math.cos(t * 0.6 + k) * 30;
    const r = (16 + k * 7) * (1 + bass * 0.25), sx = 0.55 + 0.45 * Math.abs(Math.cos(t * 0.9 + k));
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
    const rg = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 1, 0, 0, r);
    rg.addColorStop(0, '#fff'); rg.addColorStop(0.35, '#a3aef8'); rg.addColorStop(1, '#4650c4');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ink wireframes (the dark world's solids, printed) */
  ctx.strokeStyle = '#14141c'; ctx.lineWidth = 1.2;
  drawWire(ctx, SHAPES.ico, W * 0.82, H * 0.3, Sz * 0.16 * (1 + bass * 0.5 + beat * 0.15), t * 0.5 + S.spin, t * 0.6, gl ? S.g * 0.18 : 0);
  drawWire(ctx, SHAPES.octa, W * 0.2, H * 0.28, Sz * 0.08 * (1 + beat * 0.4), -t * 0.7, t * 0.9);

  /* scribble (stepped) */
  const ss = Math.floor(t * 7) + A.tickN, sx0 = W * 0.46, sy0 = H * 0.72;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < 40; i++) {
    const an = i * 0.9 + sr(ss) * 6, rr = 8 + i * 0.9 + sr(ss + i) * 14;
    const x = sx0 + Math.cos(an) * rr, y = sy0 + Math.sin(an) * rr * 0.8;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}
