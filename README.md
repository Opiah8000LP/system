# RDweeb // contact

An interactive, music-reactive contact piece. Pure static files — no build step, no dependencies.

```
index.html            page shell (loads style.css + js/main.js)
style.css             layout, type, the flat player pieces, the tap-to-enter screen
config/               ← the only place you normally edit
  site.js             email, Discord, socials, bottom note, gate text, favicon path, player icon paths, colours, safety
  playlist.js         your songs (title, artist, file, cover)
music/                your audio files
covers/               your cover artwork
assets/ui/            your player button icons (play.png, pause.png, prev.png, next.png, volume.png, mute.png, playlist.png, close.png, grip.png)
assets/img/           your favicon (favicon.png) and any other images
js/                   all the code (core · audio · scenes · shapes · ui) — main.js runs the loop
```

No default images ship with this: covers, icons and favicon are all yours. Missing icons fall back to plain text
labels (PLAY, PREV…), a missing cover leaves an empty frame, and a missing audio file is greyed out and skipped.

## Add / replace a song
Put the audio in `music/`, the artwork in `covers/`, then add an entry in `config/playlist.js`:
```js
{ title: 'somewhere...', artist: '5L, safe n sound, 2 star', file: 'music/1.mp3', cover: 'covers/1.png' }
```
No bpm needed — beats are detected from the audio.

## Beat reactions
Two detectors listen to the live audio: **low notes** (kicks / bass, ~40–220 Hz) trigger slow, heavy reactions (dome swell,
ring size, slow glow, geometry reshuffles); **high notes** (hats / snares, ~3–12 kHz) trigger fast, dense reactions
(sparks across the dome, line flicker, quick glitch ticks, wireframe jitter, letter twitches).

## The player
Every piece (cover, title, artist, elapsed, seek bar, total, prev, play, next, mute, volume, playlist button, playlist panel)
is separately draggable, like the social nodes. Sliders: drag the little `::` grip to move them, drag the track to change value.
Positions are remembered in the visitor's browser. `R` resets the layout.

## Run locally / host
ES modules need a server: `python3 -m http.server` in this folder. On GitHub Pages: Settings → Pages → `main` branch, root.

## Controls
Move for parallax · tap empty space for the other world · drag or scroll empty space to spin the dome · drag the link nodes.
Keys: `Space` world · `P` play/pause · `N` next · `B` back · `M` mute · `L` playlist · `R` reset layout · `Esc` close playlist.

## Safety
`safeMode` (config/site.js) caps flash rate; beat light is a low-alpha wash and nothing alternates full-screen black/white.
`prefers-reduced-motion` tones down glitching. Audio starts only after the visitor taps "tap to enter".
