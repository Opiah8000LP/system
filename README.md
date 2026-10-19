# RDweeb // contact

An interactive, music-reactive contact piece. Pure static files — no build step, no dependencies.

```
index.html            page shell (loads style.css + js/main.js)
style.css             layout, typography, the 3D player, the intro overlay
config/               ← the only place you normally edit
  site.js             email, Discord, socials, the bottom note, colours, motion/safety settings
  playlist.js         your songs (title, artist, file path, cover path, bpm)
  intro.js            opening sequence: on/off, captions, timings
music/                put audio here   (mp3, ogg, wav, m4a …)
covers/               put artwork here (jpg, png, webp, svg) — default.svg is the fallback
assets/img/           favicon and any other images
js/
  main.js             boots everything, runs the single animation loop
  core/               util · state · glitch (+ flash limiter) · mood (calm/chaos) · world (dark⇄light + palette)
  audio/              engine (analyser + beat detection) · player (playlist logic) · sfx · introSynth
  scenes/             dark.js · light.js (the two worlds) · overlay.js (wires, shards, bursts, glitch pass)
  shapes/             wire.js (3D wireframes) · symbols.js (vector symbol library)
  ui/                 dom (canvas) · title · links (draggable nodes) · playerUI · input (mouse/touch/keys)
  intro/              sequence.js (the opening ritual)
```

## Add / replace a song
1. Copy the audio into `music/` and the artwork into `covers/`.
2. Add an entry in `config/playlist.js` (copy the commented block). Done.
   A missing audio file is greyed out ("file not found") and skipped; a missing cover falls back to `covers/default.svg`.
   `bpm` is optional — it's only used for the pulse clock if the browser blocks audio analysis.

## Change contacts / the note
Edit `config/site.js`. Leave `discord.url` empty to make clicking copy the handle.

## Run locally
ES modules need a server: `python3 -m http.server` in this folder, then open http://localhost:8000.

## Host on GitHub Pages
Push the folder, then Settings → Pages → deploy from the `main` branch (root). Use relative paths only (already the case).

## Controls
Mouse/touch: move for parallax · tap empty space for the other world · drag or scroll to spin the dome · drag link nodes.
Keys: `Space` world · `P` play/pause · `N` next · `B` back · `M` mute · `L` playlist · `I` replay intro · `Esc` skip intro/close list.

## Safety
`safeMode` (config/site.js) caps flash rate and keeps beat flashes to a low-alpha wash; nothing alternates full-screen
black/white. `prefers-reduced-motion` shortens the intro to slow crossfades and tones down glitching. Audio only starts
after the visitor's first tap.
