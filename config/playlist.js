/* =====================================================================
   config/playlist.js — your tracks.
   Drop audio into /music and artwork into /covers, then list them here.
   Paths are relative to index.html. Order = playlist order.

   Fields
     title   shown in the player
     artist  shown under the title
     file    path to the audio (mp3 / ogg / wav / m4a / flac*)
     cover   path to artwork (jpg / png / webp / svg). Optional.
     bpm     optional. Used only if the browser blocks the audio analyser.
     album   optional (shown on lock-screen controls)
   ===================================================================== */
export const PLAYLIST = [
  {
    title: 'Demo Loop (replace me)',
    artist: 'RDweeb',
    file: 'music/demo-loop.wav',
    cover: 'covers/default.svg',
    bpm: 172
  }

  /* Copy this block for every new song:
  ,{
    title: 'Song Name',
    artist: 'RDweeb',
    file: 'music/song-name.mp3',
    cover: 'covers/song-name.jpg',
    bpm: 170
  }
  */
];
