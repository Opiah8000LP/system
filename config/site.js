/* =====================================================================
   config/site.js — everything about YOU lives here.
   Change contacts, the note, colours and behaviour without touching /js.
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

  /* ---- music player ---- */
  player: {
    startVolume: 0.8,                           // 0..1 (remembered afterwards)
    autoplayAfterIntro: true,                   // starts only after the visitor's first tap
    defaultCover: 'covers/default.svg'          // used when a cover is missing
  },

  /* ---- motion + safety ---- */
  fallbackBpm: 172,                             // pulse tempo when nothing is playing / analyser blocked
  safeMode: true,                               // caps flash rate + brightness jumps (photosensitivity)
  autoSwitch: { everyBeats: 32, minSeconds: 12 }, // dark <-> light world swaps on its own

  /* ---- colours (R,G,B) ---- */
  palette: {
    dark:  { bg: [10, 9, 19],    ink: [255, 255, 255], blue: [165, 150, 255], big: [255, 255, 255] },
    light: { bg: [236, 236, 236], ink: [18, 18, 26],    blue: [91, 120, 238],  big: [108, 134, 236] }
  }
};
