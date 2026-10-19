/* js/shapes/wire.js — rotating 3D wireframes projected onto the 2D canvas.
   Caller sets strokeStyle / lineWidth / globalAlpha first. */
const T = (1 + Math.sqrt(5)) / 2;
const norm = p => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l]; };

function edgesByLength(v, max) {
  const e = [];
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
    if (Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]) < max) e.push([i, j]);
  }
  return e;
}

const icoV = [[-1, T, 0], [1, T, 0], [-1, -T, 0], [1, -T, 0], [0, -1, T], [0, 1, T], [0, -1, -T], [0, 1, -T], [T, 0, -1], [T, 0, 1], [-T, 0, -1], [-T, 0, 1]].map(norm);
const octV = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const cubV = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(norm);

export const SHAPES = {
  ico: { v: icoV, e: edgesByLength(icoV, 1.1) },
  octa: { v: octV, e: edgesByLength(octV, 1.5) },
  cube: { v: cubV, e: edgesByLength(cubV, 1.2) }
};

/* jit = per-vertex wobble (0 = clean). Used for glitchy distortion. */
export function drawWire(ctx, shape, x, y, size, rx, ry, jit = 0, persp = 3) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
  const pts = shape.v.map((p, i) => {
    let [X, Y, Z] = p;
    const x1 = X * cy + Z * sy, z1 = -X * sy + Z * cy;
    const y2 = Y * cx - z1 * sx, z2 = Y * sx + z1 * cx;
    const s = persp / (persp - z2);
    const w = jit ? (Math.sin(i * 12.9 + rx * 40) * jit) : 0;
    return [x + (x1 + w) * size * s, y + (y2 + w * 0.6) * size * s];
  });
  ctx.beginPath();
  for (const [a, b] of shape.e) { ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); }
  ctx.stroke();
}
