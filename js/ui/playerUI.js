/* js/ui/playerUI.js — the music player, in pieces.
   Every element is its own free-floating, draggable piece (like the social nodes):
   cover · title · artist · elapsed · seek bar · total · prev · play/pause · next · mute · volume · playlist button
   plus the playlist panel (drag it by its header).
   Icons come from config/site.js → player.icons (your own files). Missing icon = plain text label. */
import * as P from '../audio/player.js';
import { S } from '../core/state.js';
import { SITE } from '../../config/site.js';
import { mk, fmtTime, clamp } from '../core/util.js';
import { kick } from '../core/glitch.js';
import { blip } from '../audio/sfx.js';
import { makeDraggable, setPos, home, resetAll, pieces } from './drag.js';

export const root = mk('section', 'layer pcs');
root.setAttribute('aria-label', 'Music player');

const ICONS = SITE.player.icons || {};
const badIcon = new Set();

/* icon button content: your image, or a text fallback */
function setIcon(btn, key, text) {
  btn.textContent = '';
  const src = ICONS[key];
  if (!src || badIcon.has(key)) { mk('span', 'tx', btn, text); return; }
  const im = mk('img', 'ic', btn);
  im.alt = text; im.draggable = false; im.src = src;
  im.onerror = () => { badIcon.add(key); setIcon(btn, key, text); };
}

/* ---------- build the pieces ---------- */
const piece = (id, inner, cls = '') => {
  const el = mk('div', 'pcw ' + cls, root);
  el.dataset.id = id;
  if (typeof inner === 'string') el.innerHTML = inner; else if (inner) el.appendChild(inner);
  return makeDraggable(el, { id });
};
const button = (cls, label) => { const b = document.createElement('button'); b.className = 'pb ' + cls; b.setAttribute('aria-label', label); b.type = 'button'; return b; };

const artImg = document.createElement('img'); artImg.alt = ''; artImg.draggable = false;
const art = piece('art', null, 'pc-art'); art.el.appendChild(artImg);
const titleP = piece('title', '<b class="pl-title">—</b>', 'pc-title');
const artistP = piece('artist', '<span class="pl-artist"></span>', 'pc-artist');
const curP = piece('cur', '<span class="pl-cur">0:00</span>', 'pc-time');
const durP = piece('dur', '<span class="pl-dur">0:00</span>', 'pc-time');

const sliderHTML = (cls, label) => `<button class="grip" type="button" aria-label="Move ${label}"></button><div class="track ${cls}" role="slider" aria-label="${label}" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="buf"></div><div class="fill"></div><i class="knob"></i></div>`;

/* a slider piece: the grip moves it, the track changes the value */
function makeSlider(id, label) {
  const el = mk('div', 'pcw pc-slider pc-' + id, root);
  el.dataset.id = id;
  el.innerHTML = sliderHTML(id, label);
  const g = el.querySelector('.grip');
  const src = ICONS.grip;
  if (src) { const im = mk('img', 'ic', g); im.alt = ''; im.draggable = false; im.src = src; im.onerror = () => { im.remove(); g.textContent = '::'; }; }
  else g.textContent = '::';
  const p = makeDraggable(el, { id, handle: g });
  p.track = el.querySelector('.track'); p.fill = el.querySelector('.fill'); p.knob = el.querySelector('.knob'); p.buf = el.querySelector('.buf');
  return p;
}
const seekP = makeSlider('seek', 'Seek');
const volP = makeSlider('vol', 'Volume');

const mkBtn = (id, cls, label) => { const p = piece(id, null, 'pc-btn'); const b = button(cls, label); p.el.appendChild(b); return { p, b }; };
const prev = mkBtn('prev', 'prev', 'Previous track');
const play = mkBtn('play', 'play', 'Play');
const next = mkBtn('next', 'next', 'Next track');
const mute = mkBtn('mute', 'mute', 'Mute');
const listB = mkBtn('list', 'list', 'Playlist'); listB.b.setAttribute('aria-expanded', 'false');

/* playlist panel — a draggable piece, dragged by its header */
const panelEl = mk('div', 'pcw pc-panel', root);
panelEl.hidden = true;
panelEl.innerHTML = `<div class="ph"><span>playlist</span><button class="pb close" type="button" aria-label="Close playlist"></button></div><ol></ol>`;
const panel = makeDraggable(panelEl, { id: 'panel', handle: panelEl.querySelector('.ph') });
const closeB = panelEl.querySelector('.close'), ol = panelEl.querySelector('ol');

const $ = (el, s) => el.querySelector(s);
const titleEl = $(titleP.el, '.pl-title'), artistEl = $(artistP.el, '.pl-artist'), curEl = $(curP.el, '.pl-cur'), durEl = $(durP.el, '.pl-dur');
let scrubbing = false, scrubR = 0;
const seek = seekP, vol = volP;

/* drag-to-set behaviour for a slider track (mouse + touch + pen) */
function slider(track, onMove, onEnd) {
  const rat = e => { const r = track.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1); };
  track.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); track.setPointerCapture(e.pointerId); onMove(rat(e));
    const mv = ev => onMove(rat(ev));
    const up = ev => { track.removeEventListener('pointermove', mv); track.removeEventListener('pointerup', up); track.removeEventListener('pointercancel', up); onEnd && onEnd(rat(ev)); };
    track.addEventListener('pointermove', mv); track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
  });
}

/* ---------- renderers ---------- */
function setCover(src) {
  artImg.onerror = () => { artImg.style.visibility = 'hidden'; };
  artImg.onload = () => { artImg.style.visibility = 'visible'; };
  if (!src) { artImg.removeAttribute('src'); artImg.style.visibility = 'hidden'; return; }
  artImg.src = src;
}
function renderTrack() {
  const t = P.current();
  setCover(t.cover);
  titleEl.textContent = t.title;
  artistEl.textContent = t.artist;
  durEl.textContent = t.duration ? fmtTime(t.duration) : '0:00';
  root.classList.toggle('missing', t.ok === false);
  renderList();
}
function renderState() {
  const playing = P.state.playing;
  setIcon(play.b, playing ? 'pause' : 'play', playing ? 'PAUSE' : 'PLAY');
  play.b.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  root.classList.toggle('is-playing', playing);
}
function renderVolume() {
  const v = P.state.muted ? 0 : P.state.vol;
  vol.fill.style.width = vol.knob.style.left = (v * 100) + '%';
  vol.track.setAttribute('aria-valuenow', Math.round(v * 100));
  setIcon(mute.b, v === 0 ? 'mute' : 'volume', v === 0 ? 'MUTE' : 'VOL');
}
function renderList() {
  ol.innerHTML = '';
  P.tracks.forEach((t, i) => {
    const li = mk('li', (i === P.state.index ? 'cur ' : '') + (t.ok === false ? 'bad' : ''), ol);
    const b = mk('button', 'pl-item', li);
    b.type = 'button';
    b.innerHTML = '<img alt="" draggable="false"><span class="ti"><b></b><em></em></span><span class="du"></span><span class="eq"><i></i><i></i><i></i></span>';
    const im = b.querySelector('img');
    if (t.cover) { im.src = t.cover; im.onerror = () => { im.style.visibility = 'hidden'; }; } else im.style.visibility = 'hidden';
    b.querySelector('b').textContent = t.title;
    b.querySelector('em').textContent = t.ok === false ? 'file not found' : t.artist;
    b.querySelector('.du').textContent = t.duration ? fmtTime(t.duration) : '';
    b.addEventListener('click', () => { P.load(i, true); blip(520, 0.07); kick(0.5); });
  });
}
function openList(v) {
  panelEl.hidden = !v;
  root.classList.toggle('list-open', v);
  listB.b.setAttribute('aria-expanded', String(v));
  if (v) {
    if (!panel.custom) {
      const w = Math.min(340, S.W - 16);
      panelEl.style.width = w + 'px';
      const h = panelEl.offsetHeight;
      setPos(panel, listB.p.x + listB.p.el.offsetWidth - w, listB.p.y - h - 10);
      if (panel.y > S.H - h - 4 || panel.y < 4) setPos(panel, panel.x, 12);
    }
    const c = ol.querySelector('.cur'); c && c.scrollIntoView({ block: 'nearest' });
  }
}

/* ---------- layout: default homes (visitor drags override these) ---------- */
export function layout() {
  const { W, H } = S;
  const phone = W < 700, land = H < 520 && W > H;
  const A = phone ? 68 : land ? 56 : 96;                         // artwork size
  const Wd = phone ? W - 24 : land ? Math.min(W * 0.5, 440) : 540; // cluster width
  const L = land ? W - Wd - 12 : Math.round((W - Wd) / 2);
  const noteEl = document.querySelector('.note');
  const noteH = noteEl && noteEl.offsetHeight ? noteEl.offsetHeight + 14 : 56;
  const T = Math.round(H - noteH - A - (land ? 78 : 104));
  const x1 = L + A + 14;

  art.el.style.width = art.el.style.height = A + 'px';
  home(art, L, T);
  titleP.el.style.maxWidth = (Wd - A - 14) + 'px'; artistP.el.style.maxWidth = (Wd - A - 14) + 'px';
  home(titleP, x1, T + 2);
  home(artistP, x1, T + (phone || land ? 28 : 34));

  const rowB = T + A + 8, rowC = rowB + 30;
  const seekW = Math.max(120, Wd - 96);
  seekP.el.style.width = seekW + 'px';
  home(curP, L, rowB + 2);
  home(seekP, L + 44, rowB - 4);
  home(durP, L + Wd - 38, rowB + 2);

  const bs = phone ? 42 : 40;
  home(prev.p, L, rowC); home(play.p, L + bs + 6, rowC); home(next.p, L + (bs + 6) * 2 + 8, rowC);
  home(mute.p, L + (bs + 6) * 3 + 14, rowC);
  const volW = phone ? Math.max(70, Wd - (bs + 6) * 5 - 20) : 120;
  volP.el.style.width = volW + 'px';
  home(volP, L + (bs + 6) * 4 + 14, rowC + 8);
  home(listB.p, L + Wd - bs, rowC);

  /* keep an open panel on screen after a resize */
  if (!panelEl.hidden) { setPos(panel, panel.x, panel.y); }
}

export function init() {
  prev.b.addEventListener('click', () => { P.prev(); blip(380, 0.06); kick(0.5); });
  next.b.addEventListener('click', () => { P.next(); blip(620, 0.06); kick(0.5); });
  play.b.addEventListener('click', () => { P.toggle(); blip(P.state.playing ? 300 : 700, 0.08); kick(0.6); });
  mute.b.addEventListener('click', () => P.toggleMute());
  listB.b.addEventListener('click', () => openList(panelEl.hidden));
  closeB.addEventListener('click', () => openList(false));
  setIcon(prev.b, 'prev', 'PREV'); setIcon(next.b, 'next', 'NEXT'); setIcon(listB.b, 'playlist', 'LIST'); setIcon(closeB, 'close', '✕');

  slider(seek.track, r => { scrubbing = true; scrubR = r; paintSeek(r); }, r => { P.seekRatio(r); scrubbing = false; });
  seek.track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { P.seek(P.el.currentTime + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { P.seek(P.el.currentTime - 5); e.preventDefault(); }
  });
  slider(vol.track, r => P.setVolume(r));
  vol.track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { P.setVolume(P.state.vol + 0.05); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { P.setVolume(P.state.vol - 0.05); e.preventDefault(); }
  });

  P.on('track', renderTrack); P.on('state', renderState); P.on('volume', renderVolume);
  P.on('list', () => { renderList(); const t = P.current(); if (t.duration) durEl.textContent = fmtTime(t.duration); root.classList.toggle('missing', t.ok === false); });
  P.on('error', () => root.classList.add('missing'));
  P.on('empty', () => { titleEl.textContent = 'no tracks yet'; artistEl.textContent = 'add songs in config/playlist.js'; });
  P.el.addEventListener('progress', () => { try { const b = P.el.buffered; if (b.length && seek.buf) seek.buf.style.width = (b.end(b.length - 1) / (P.duration() || 1)) * 100 + '%'; } catch (e) {} });

  renderTrack(); renderState(); renderVolume();
  layout();
}

function paintSeek(r) {
  seek.fill.style.width = seek.knob.style.left = (r * 100) + '%';
  seek.track.setAttribute('aria-valuenow', Math.round(r * 100));
}

export function toggleList() { openList(panelEl.hidden); }
export function closeList() { openList(false); }
export const resetLayout = () => resetAll(layout);

/* per-frame: progress + idle float + beat reactions on the pieces */
export function update() {
  const d = P.duration(), c = P.el.currentTime || 0;
  if (!scrubbing) paintSeek(d ? c / d : 0);
  curEl.textContent = fmtTime(scrubbing ? scrubR * d : c);
  if (d && durEl.textContent === '0:00') durEl.textContent = fmtTime(d);

  const { t, a: A } = S, calm = S.reduced ? 0.15 : 1 - S.calm * 0.6;
  for (const p of pieces) {
    let fx = 0, fy = 0, rot = 0, sc = 1;
    if (!p.drag) {
      fx = Math.sin(t * 0.7 + p.ph) * 2 * calm; fy = Math.cos(t * 0.6 + p.ph * 1.3) * 2.5 * calm;
      rot = Math.sin(t * 0.5 + p.ph) * 0.6 * calm;
    } else sc = 1.06;
    const id = p.id;
    if (id === 'art') { sc *= 1 + A.beat * 0.07; rot += (S.reduced ? 0 : (A.tick > 0.5 ? (p.ph % 2 > 1 ? 1.2 : -1.2) : 0)); }
    else if (id === 'play') sc *= 1 + A.beat * 0.08;
    else if (id === 'title') fx += S.g > 0.4 && !S.reduced ? (Math.random() - 0.5) * 6 * S.g : 0;
    p.el.style.transform = `translate3d(${(p.x + fx).toFixed(1)}px,${(p.y + fy).toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
  }
}
