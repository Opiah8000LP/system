/* js/scenes/overlay.js — everything drawn ON TOP of the worlds:
   hub wires, ruler, click bursts, drifting symbol shards, soft beat flash, and the
   canvas glitch pass (slice shifts, RGB-ish bars, noise). */
import { S } from '../core/state.js';
import { rnd, pick, lerp, rgba, TAU } from '../core/util.js';
import { SYM, SHARD_SET } from '../shapes/symbols.js';
import { nodes } from '../ui/links.js';

/* ---------- click / tap bursts ---------- */
const bursts = [];
export function burst(x, y, n = 16) {
  if (S.reduced) n = 5;
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), s = rnd(1.5, 9);
    bursts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.7, 1.5), age: 0, kind: (Math.random() * 5) | 0, r: rnd(4, 16), rot: rnd(6), blue: Math.random() < 0.5 });
  }
  if (bursts.length > 240) bursts.splice(0, bursts.length - 240);
}

/* ---------- symbol shards: faint, drifting, beat-pulsed ---------- */
const shards = [];
function spawnShard() {
  const side = Math.random() < 0.5 ? -1 : 1;
  shards.push({
    x: side < 0 ? rnd(-0.05, 0.3) : rnd(0.7, 1.05), y: rnd(0.08, 0.95),
    vx: rnd(-0.01, 0.01), vy: rnd(-0.012, 0.012), r: rnd(18, 54), rot: rnd(TAU), vr: rnd(-0.4, 0.4),
    name: pick(SHARD_SET), seed: (Math.random() * 99) | 0, life: rnd(5, 11), age: 0, flick: 0
  });
}
export function pulseShards(strength) { for (const s of shards) s.flick = Math.max(s.flick, strength); }

function drawShards(ctx, dt) {
  const cap = S.reduced ? 2 : (S.W < 700 ? 5 : 9);
  if (shards.length < cap && Math.random() < dt * 0.9) spawnShard();
  for (let i = shards.length - 1; i >= 0; i--) {
    const s = shards[i];
    s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt; s.flick *= 0.9;
    if (s.age > s.life) { shards.splice(i, 1); continue; }
    const fade = Math.min(1, s.age / 1.2, (s.life - s.age) / 1.2);
    const al = fade * (0.16 + s.flick * 0.22 + S.a.level * 0.12);
    ctx.save();
    ctx.translate(s.x * S.W, s.y * S.H); ctx.rotate(s.rot);
    const sc = 1 + S.a.bass * 0.25 + s.flick * 0.2, sx = S.g > 0.4 ? 1 + rnd(-0.3, 0.3) * S.g : 1;
    ctx.scale(sc * sx, sc);
    ctx.strokeStyle = rgba(S.ink, al); ctx.lineWidth = 1.1;
    SYM[s.name](ctx, s.r, s.seed);
    ctx.restore();
  }
}

/* ---------- hub wires, ruler ---------- */
function drawWires(ctx) {
  const { hub, W, g, t } = S;
  ctx.strokeStyle = rgba(S.ink, 0.85); ctx.fillStyle = S.inkc; ctx.lineWidth = 1.1 + S.a.beat * 0.8;
  const jag = g > 0.3;
  nodes.forEach((o, i) => {
    ctx.beginPath(); ctx.moveTo(hub.x, hub.y);
    if (jag) ctx.lineTo(lerp(hub.x, o.x, 0.5) + rnd(-40, 40) * g, lerp(hub.y, o.y, 0.5) + rnd(-40, 40) * g);
    ctx.lineTo(o.x, o.y); ctx.stroke();
    /* long decor curve to the screen edge */
    ctx.strokeStyle = rgba(S.ink, 0.22 + S.a.level * 0.2);
    ctx.beginPath(); ctx.moveTo(o.x, o.y);
    ctx.bezierCurveTo(o.x + o.side * W * 0.2, o.y - 80 + Math.sin(t + i) * 30, o.side * W * 0.7 + W * 0.5, o.y + 120, o.side < 0 ? -20 : W + 20, (S.H * (0.1 + 0.12 * i)) % S.H);
    ctx.stroke();
    ctx.strokeStyle = rgba(S.ink, 0.85);
    const mx = lerp(hub.x, o.x, 0.5), my = lerp(hub.y, o.y, 0.5), q = 3 + S.a.beat * 2;
    ctx.fillRect(mx - q, my - q, q * 2, q * 2);
  });
  /* ruler */
  ctx.strokeStyle = rgba(S.ink, 0.5); ctx.beginPath();
  const rx = W < 700 ? 6 : 18, y0 = S.H * 0.3;
  for (let i = 0; i < 40; i++) { const y = y0 + i * 8; ctx.moveTo(rx, y); ctx.lineTo(rx + (i % 5 ? 6 : 13), y); }
  ctx.stroke();
}

function drawBursts(ctx, dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const p = bursts[i];
    p.age += dt; if (p.age > p.life) { bursts.splice(i, 1); continue; }
    p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.rot += 0.1;
    const al = 1 - p.age / p.life;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.strokeStyle = ctx.fillStyle = rgba(p.blue ? S.blue : S.ink, al);
    ctx.lineWidth = 1.3;
    if (p.kind === 0) ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
    else if (p.kind === 1) { ctx.beginPath(); ctx.moveTo(-p.r, 0); ctx.lineTo(p.r, 0); ctx.moveTo(0, -p.r); ctx.lineTo(0, p.r); ctx.stroke(); }
    else if (p.kind === 2) { ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r, p.r); ctx.lineTo(-p.r, p.r); ctx.closePath(); ctx.stroke(); }
    else if (p.kind === 3) { ctx.beginPath(); ctx.arc(0, 0, p.r * 0.7, 0, TAU); ctx.stroke(); }
    else SYM.cross(ctx, p.r * 0.9);
    ctx.restore();
  }
}

/* ---------- canvas glitch pass: slice shifts + coloured scanline bars ---------- */
function drawGlitch(ctx) {
  const g = S.g;
  if (g < 0.06 && Math.random() > 0.03) return;
  const cv = ctx.canvas, cw = cv.width, ch = cv.height;
  const n = g > 0.06 ? Math.ceil(g * 7) : 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < n; i++) {
    const sy = (Math.random() * ch) | 0, sh = (4 + Math.random() * 60 * (0.4 + g)) | 0, dx = ((Math.random() - 0.5) * 140 * (0.3 + g)) | 0;
    ctx.drawImage(cv, 0, sy, cw, Math.min(sh, ch - sy), dx, sy, cw, Math.min(sh, ch - sy));
  }
  if (g > 0.25) {
    for (let i = 0; i < 2; i++) {
      const y = Math.random() * ch, x = Math.random() * cw * 0.6, w = cw * rnd(0.2, 0.6);
      const gr = ctx.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, '#ff2a6d'); gr.addColorStop(0.35, '#ffe14a'); gr.addColorStop(0.7, '#05d9e8'); gr.addColorStop(1, '#6a5cf0');
      ctx.fillStyle = gr; ctx.fillRect(x, y, w, 2 + Math.random() * 4 * S.DPR);
    }
  }
  if (g > 0.6 && Math.random() < 0.5) { ctx.fillStyle = S.inkc; ctx.fillRect(0, Math.random() * ch, cw * rnd(0.3, 1), 5 * S.DPR); }
  ctx.restore();
}

/* soft vignette flash on beats (low alpha — never a full-screen strobe) */
function drawFlash(ctx) {
  if (S.flash < 0.02) return;
  const a = Math.min(0.14, S.flash * 0.14);
  const g = ctx.createRadialGradient(S.hub.x, S.hub.y, 0, S.hub.x, S.hub.y, Math.max(S.W, S.H) * 0.7);
  g.addColorStop(0, rgba(S.blue, a)); g.addColorStop(1, rgba(S.blue, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, S.W, S.H);
}

export function drawOverlay(ctx, dt) {
  drawShards(ctx, dt);
  drawWires(ctx);
  drawFlash(ctx);
  drawBursts(ctx, dt);
  drawGlitch(ctx);
}
