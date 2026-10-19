/* js/audio/player.js — playlist logic around a single <audio> element.
   UI talks to this module only; it never touches the DOM except the hidden <audio>.
   Events: 'track' 'state' 'error' 'list' 'volume' 'empty' */
import { PLAYLIST } from '../../config/playlist.js';
import { SITE } from '../../config/site.js';
import * as engine from './engine.js';
import { store, clamp } from '../core/util.js';

const L = {};
const emit = (e, d) => (L[e] || []).forEach(f => f(d));
export const on = (e, f) => { (L[e] = L[e] || []).push(f); };

export const tracks = PLAYLIST.map((t, i) => ({
  title: t.title || `Track ${i + 1}`,
  artist: t.artist || SITE.name,
  album: t.album || '',
  file: t.file,
  cover: t.cover || SITE.player.defaultCover,
  bpm: t.bpm || SITE.fallbackBpm,
  duration: 0,
  ok: null                                   // null = unknown, true = loads, false = missing / unsupported
}));

export const el = document.createElement('audio');
el.preload = 'metadata';
el.setAttribute('playsinline', '');
el.style.display = 'none';
document.body.appendChild(el);

export const state = {
  index: 0, playing: false, wantPlay: false,
  vol: store.get('vol', SITE.player.startVolume),
  muted: store.get('muted', false)
};
let errRun = 0, unlocked = false, unlocking = false;

export const current = () => tracks[state.index] || { title: '—', artist: '', cover: SITE.player.defaultCover, bpm: SITE.fallbackBpm, ok: false };

export function load(i, autoplay = false) {
  if (!tracks.length) { emit('empty'); return; }
  state.index = ((i % tracks.length) + tracks.length) % tracks.length;
  const t = current();
  el.src = t.file;
  el.loop = tracks.length === 1;
  el.load();
  emit('track', t);
  mediaSession();
  if (autoplay) play();
}

export function play() {
  if (!tracks.length) return;
  state.wantPlay = true;
  engine.attach(el); engine.connectElement(); engine.resume();
  const p = el.play();
  if (p && p.catch) p.catch(err => {
    if (err && err.name === 'NotAllowedError') { state.wantPlay = false; emit('state'); }
  });
}
export function pause() { state.wantPlay = false; el.pause(); }
export const toggle = () => (el.paused ? play() : pause());
export const next = () => load(state.index + 1, state.wantPlay);
export function prev() {
  if (el.currentTime > 3) { el.currentTime = 0; return; }
  load(state.index - 1, state.wantPlay);
}
export const duration = () => (isFinite(el.duration) ? el.duration : 0);
export const seek = s => { if (duration()) el.currentTime = clamp(s, 0, duration()); };
export const seekRatio = r => seek(clamp(r, 0, 1) * duration());

export function setVolume(v) { state.vol = clamp(v, 0, 1); if (state.vol > 0) state.muted = false; commitVolume(); }
export function toggleMute() { state.muted = !state.muted; commitVolume(); }
function commitVolume() {
  engine.setVolume(state.vol, state.muted);
  store.set('vol', state.vol); store.set('muted', state.muted);
  emit('volume');
}

/* call inside the first user gesture: warms up Web Audio + Safari's autoplay gate */
export function unlock() {
  engine.attach(el); engine.connectElement(); engine.resume();
  if (unlocked || !tracks.length) return;
  unlocked = true; unlocking = true;
  const was = el.muted; el.muted = true;
  const p = el.play();
  const done = () => { el.muted = was; unlocking = false; };
  if (p && p.then) p.then(() => { if (!state.wantPlay) { el.pause(); el.currentTime = 0; } done(); }).catch(done);
  else done();
}

/* ---- element events ---- */
el.addEventListener('play', () => { if (unlocking) return; state.playing = true; emit('state'); });
el.addEventListener('pause', () => { if (unlocking) return; state.playing = false; emit('state'); });
el.addEventListener('playing', () => { errRun = 0; });
el.addEventListener('ended', () => { if (tracks.length > 1) load(state.index + 1, true); });
el.addEventListener('loadedmetadata', () => {
  const t = current(); t.duration = duration(); t.ok = true; emit('list');
});
el.addEventListener('error', () => {
  if (!el.getAttribute('src')) return;
  const t = current(); t.ok = false; state.playing = false;
  emit('error', t); emit('list'); emit('state');
  if (state.wantPlay && tracks.some(x => x.ok !== false) && ++errRun < tracks.length) setTimeout(next, 1200);
});

/* quietly check every file once so the playlist can show durations / missing files */
function probe() {
  tracks.forEach((t, i) => {
    if (i === state.index) return;
    const a = new Audio(); a.preload = 'metadata';
    a.addEventListener('loadedmetadata', () => { t.duration = a.duration; t.ok = true; emit('list'); });
    a.addEventListener('error', () => { t.ok = false; emit('list'); });
    a.src = t.file;
  });
}

function mediaSession() {
  if (!('mediaSession' in navigator)) return;
  const t = current();
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title, artist: t.artist, album: t.album || SITE.name,
      artwork: [{ src: new URL(t.cover, document.baseURI).href }]
    });
  } catch (e) {}
}

export function init() {
  engine.attach(el);
  engine.setVolume(state.vol, state.muted);
  if ('mediaSession' in navigator) {
    const set = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch (e) {} };
    set('play', play); set('pause', pause); set('previoustrack', prev); set('nexttrack', next);
  }
  load(0, false);
  setTimeout(probe, 500);
}
