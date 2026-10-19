/* =====================================================================
   config/site.js — everything about YOU lives here.
   Change contacts, the note, your own icons and colours without touching /js.
   ===================================================================== */
export const SITE = {
  name: 'RDweeb',
  alias: 'Dweeb',

  /* ---- contacts (only these appear on the page) ---- */
  email: 'your@email.com',
  discord: { handle: 'rdweeb', url: '' },      // url optional. Empty = clicking copies the handle
  socials: [                                    // add / remove / reorder freely
    { label: 'Instagram',  handle: '@rdweeb', url: 'https://instagram.com/rdweeb' },
    { label: 'X',          handle: '@rdweeb', url: 'https://x.com/rdweeb' },
    { label: 'YouTube',    handle: '@rdweeb', url: 'https://youtube.com/@rdweeb' },
    { label: 'SoundCloud', handle: 'rdweeb',  url: 'https://soundcloud.com/rdweeb' },
    { label: 'TikTok',     handle: '@rdweeb', url: 'https://tiktok.com/@rdweeb' }
  ],

  /* ---- little note at the bottom of the page ---- */
  note: 'Hi, if you want to contact me, please feel free to message me. I try to respond to all messages.',

  /* ---- the "tap to enter" screen (needed so the browser lets music play) ---- */
  gate: { text: '[ tap to enter ]', hint: 'sound on' },

  /* ---- browser tab icon: put your own file here (png / svg / ico) ---- */
  favicon: 'assets/img/favicon.png',

  /* ---- music player ---- */
  player: {
    startVolume: 0.8,                           // 0..1 (remembered afterwards)
    autoplayOnEnter: true,                      // starts when the visitor taps the gate

    /* Your own artwork for every player button. Drop the files in assets/ui/.
       A file that is missing falls back to a plain text label, so nothing breaks. */
    icons: {
      play:     'assets/ui/play.png',
      pause:    'assets/ui/pause.png',
      prev:     'assets/ui/prev.png',
      next:     'assets/ui/next.png',
      volume:   'assets/ui/volume.png',
      mute:     'assets/ui/mute.png',
      playlist: 'assets/ui/playlist.png',
      close:    'assets/ui/close.png',
      grip:     'assets/ui/grip.png'            // little handle on the sliders (they can't be dragged by the track)
    }
  },

  /* ---- motion + safety ---- */
  safeMode: true,                               // caps flash rate + brightness jumps (photosensitivity)
  autoSwitch: { everyBeats: 32, minSeconds: 12 }, // dark <-> light swaps on its own (counts bass hits)

  /* ---- colours (R,G,B) ---- */
  palette: {
    dark:  { bg: [10, 9, 19],    ink: [255, 255, 255], blue: [165, 150, 255], big: [255, 255, 255] },
    light: { bg: [236, 236, 236], ink: [18, 18, 26],    blue: [91, 120, 238],  big: [108, 134, 236] }
  }
};
