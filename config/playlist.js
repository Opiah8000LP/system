/* =====================================================================
   config/playlist.js — your tracks.
   Drop audio into /music and artwork into /covers, then list them here.
   Paths are relative to index.html. Order = playlist order.

   Fields
     title   shown in the player
     artist  shown under the title
     file    path to the audio (mp3 / ogg / wav / m4a)
     cover   path to artwork (jpg / png / webp / svg). Optional.
     album   optional (shown on lock-screen controls)

   Beats are detected automatically from the audio — no bpm needed.
   ===================================================================== */
export const PLAYLIST = [
  {
    title: 'somewhere...',
    artist: '5L, safe n sound, 2 star',
    file: 'music/1.mp3',
    cover: 'covers/1.png'
  }

  /* Copy this block for every new song (don't forget the comma above):
  ,{
    title: 'Song Name',
    artist: 'RDweeb',
    file: 'music/song-name.mp3',
    cover: 'covers/song-name.jpg'
  }
  */
];
