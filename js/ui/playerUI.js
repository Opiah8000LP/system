/* js/ui/playerUI.js — the music player: artwork, title / artist, play-pause, prev / next,
   seek bar with elapsed + total time, volume slider (+ mute), and the playlist drawer.
   It floats as a tilting 3D card. Collapses to a compact bar on small screens. */
import * as P from '../audio/player.js';
import { S } from '../core/state.js';
import { SITE } from '../../config/site.js';
import { mk, fmtTime, clamp } from '../core/util.js';
import { kick } from '../core/glitch.js';
import { blip } from '../audio/sfx.js';

const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4.2v16H6zM13.8 4H18v16h-4.2z"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M6 5h2.4v14H6zM20 5v14L9.5 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M15.6 5H18v14h-2.4zM4 5l10.5 7L4 19z"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M3 6h14v2H3zM3 11h14v2H3zM3 16h9v2H3zM19 11.5V6l3 1.2V9l-1-.4v6.4a2.5 2.5 0 1 1-2-2.45z"/></svg>',
  vol: '<svg viewBox="0 0 24 24"><path d="M3 9.5h4L12 5v14l-5-4.5H3zM15 8.5a5 5 0 0 1 0 7M17.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M3 9.5h4L12 5v14l-5-4.5H3z"/><path d="M15 9l6 6M21 9l-6 6" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>'
};

export const root = mk('section', 'player');
root.setAttribute('aria-label', 'Music player');
root.innerHTML = `
  <div class="pl-card">
    <div class="pl-art"><img alt="" draggable="false"><i class="pl-ring"></i></div>
    <div class="pl-main">
      <div class="pl-meta"><b class="pl-title">—</b><span class="pl-artist"></span></div>
      <div class="pl-seekrow">
        <span class="pl-cur">0:00</span>
        <div class="pl-seek" role="slider" aria-label="Seek" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="pl-buf"></div><div class="pl-fill"></div><i class="pl-knob"></i></div>
        <span class="pl-dur">0:00</span>
      </div>
      <div class="pl-ctrls">
        <button class="pl-btn pl-prev" aria-label="Previous track">${ICON.prev}</button>
        <button class="pl-btn pl-pp" aria-label="Play">${ICON.play}</button>
        <button class="pl-btn pl-next" aria-label="Next track">${ICON.next}</button>
        <div class="pl-vol">
          <button class="pl-btn pl-mute" aria-label="Mute">${ICON.vol}</button>
          <div class="pl-vslider" role="slider" aria-label="Volume" tabindex="0" aria-valuemin="0" aria-valuemax="100"><div class="pl-vfill"></div><i class="pl-vknob"></i></div>
        </div>
        <button class="pl-btn pl-listbtn" aria-label="Playlist" aria-expanded="false">${ICON.list}</button>
      </div>
    </div>
  </div>
  <div class="pl-list" hidden><div class="pl-listhead"><span>playlist</span><button class="pl-btn pl-close" aria-label="Close playlist">✕</button></div><ol></ol></div>
`;
const $ = s => root.querySelector(s);
const img = $('.pl-art img'), title = $('.pl-title'), artist = $('.pl-artist'), cur = $('.pl-cur'), dur = $('.pl-dur');
const seek = $('.pl-seek'), fill = $('.pl-fill'), knob = $('.pl-knob'), buf = $('.pl-buf');
const pp = $('.pl-pp'), muteB = $('.pl-mute'), vs = $('.pl-vslider'), vfill = $('.pl-vfill'), vknob = $('.pl-vknob');
const listBtn = $('.pl-listbtn'), list = $('.pl-list'), ol = list.querySelector('ol');
let scrubbing = false, scrubR = 0;

/* drag helper for both sliders (mouse + touch + pen) */
function slider(el, onMove, onEnd) {
  const rat = e => { const r = el.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1); };
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); el.setPointerCapture(e.pointerId); onMove(rat(e), true);
    const mv = ev => onMove(rat(ev), true);
    const up = ev => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); onEnd && onEnd(rat(ev)); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
}

function setCover(src) {
  img.onerror = () => { if (!img.src.endsWith(SITE.player.defaultCover)) img.src = SITE.player.defaultCover; else img.style.visibility = 'hidden'; };
  img.style.visibility = 'visible';
  img.src = src || SITE.player.defaultCover;
}

function renderTrack() {
  const t = P.current();
  setCover(t.cover);
  title.textContent = t.title;
  artist.textContent = t.artist;
  dur.textContent = t.duration ? fmtTime(t.duration) : '0:00';
  root.classList.toggle('missing', t.ok === false);
  renderList();
}
function renderState() {
  const playing = P.state.playing;
  pp.innerHTML = playing ? ICON.pause : ICON.play;
  pp.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  root.classList.toggle('is-playing', playing);
}
function renderVolume() {
  const v = P.state.muted ? 0 : P.state.vol;
  vfill.style.width = vknob.style.left = (v * 100) + '%';
  vs.setAttribute('aria-valuenow', Math.round(v * 100));
  muteB.innerHTML = v === 0 ? ICON.mute : ICON.vol;
}
function renderList() {
  ol.innerHTML = '';
  P.tracks.forEach((t, i) => {
    const li = mk('li', (i === P.state.index ? 'cur ' : '') + (t.ok === false ? 'bad' : ''), ol);
    const b = mk('button', 'pl-item', li);
    b.innerHTML = `<img alt="" loading="lazy" draggable="false"><span class="ti"><b></b><em></em></span><span class="du"></span><span class="eq"><i></i><i></i><i></i></span>`;
    b.querySelector('img').src = t.cover;
    b.querySelector('img').onerror = function () { this.onerror = null; this.src = SITE.player.defaultCover; };
    b.querySelector('b').textContent = t.title;
    b.querySelector('em').textContent = t.ok === false ? 'file not found' : t.artist;
    b.querySelector('.du').textContent = t.duration ? fmtTime(t.duration) : '';
    b.addEventListener('click', () => { P.load(i, true); blip(520, 0.07); kick(0.5); });
  });
}
function openList(v) {
  list.hidden = !v;
  root.classList.toggle('list-open', v);
  listBtn.setAttribute('aria-expanded', String(v));
  if (v) { const c = ol.querySelector('.cur'); c && c.scrollIntoView({ block: 'nearest' }); }
}

export function init() {
  $('.pl-prev').addEventListener('click', () => { P.prev(); blip(380, 0.06); kick(0.5); });
  $('.pl-next').addEventListener('click', () => { P.next(); blip(620, 0.06); kick(0.5); });
  pp.addEventListener('click', () => { P.toggle(); blip(P.state.playing ? 300 : 700, 0.08); kick(0.6); });
  muteB.addEventListener('click', () => P.toggleMute());
  listBtn.addEventListener('click', () => openList(list.hidden));
  $('.pl-close').addEventListener('click', () => openList(false));

  slider(seek, (r) => { scrubbing = true; scrubR = r; paintSeek(r); }, (r) => { P.seekRatio(r); scrubbing = false; });
  slider(vs, (r) => P.setVolume(r));

  /* keyboard on the sliders */
  seek.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { P.seek(P.el.currentTime + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { P.seek(P.el.currentTime - 5); e.preventDefault(); }
  });
  vs.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { P.setVolume(P.state.vol + 0.05); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { P.setVolume(P.state.vol - 0.05); e.preventDefault(); }
  });

  /* player events */
  P.on('track', renderTrack); P.on('state', renderState); P.on('volume', renderVolume); P.on('list', () => { renderList(); const t = P.current(); if (t.duration) dur.textContent = fmtTime(t.duration); root.classList.toggle('missing', t.ok === false); });
  P.on('error', () => root.classList.add('missing'));
  P.on('empty', () => { title.textContent = 'no tracks yet'; artist.textContent = 'add songs in config/playlist.js'; });
  P.el.addEventListener('progress', () => { try { const b = P.el.buffered; if (b.length) buf.style.width = (b.end(b.length - 1) / (P.duration() || 1)) * 100 + '%'; } catch (e) {} });

  renderTrack(); renderState(); renderVolume();
}

function paintSeek(r) {
  fill.style.width = knob.style.left = (r * 100) + '%';
  seek.setAttribute('aria-valuenow', Math.round(r * 100));
}

export function toggleList() { openList(list.hidden); }
export function closeList() { openList(false); }

/* per-frame: progress + 3D tilt toward the cursor + beat pulse on the artwork */
export function update() {
  const d = P.duration(), c = P.el.currentTime || 0;
  if (!scrubbing) paintSeek(d ? c / d : 0);
  cur.textContent = fmtTime(scrubbing ? scrubR * d : c);
  if (d && dur.textContent === '0:00') dur.textContent = fmtTime(d);

  const r = root.getBoundingClientRect();
  const dx = (S.mouse.x - (r.left + r.width / 2)) / S.W, dy = (S.mouse.y - (r.top + r.height / 2)) / S.H;
  const m = S.coarse ? 0 : 1, A = S.a;
  root.style.setProperty('--tx', (clamp(dy, -0.5, 0.5) * -10 * m).toFixed(2) + 'deg');
  root.style.setProperty('--ty', (clamp(dx, -0.5, 0.5) * 14 * m).toFixed(2) + 'deg');
  root.style.setProperty('--pulse', (1 + A.beat * 0.05 + A.bass * 0.02).toFixed(3));
  root.style.setProperty('--glow', (0.25 + A.level * 0.6 + A.beat * 0.2).toFixed(2));
  root.style.setProperty('--spin', (S.t * 14).toFixed(1) + 'deg');
}
