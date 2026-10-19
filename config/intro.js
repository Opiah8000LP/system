/* =====================================================================
   config/intro.js — the opening sequence (chaos → tenderness → site).
   Edit the words, the timing, or switch it off.
   ===================================================================== */
export const INTRO = {
  enabled: true,                       // false = go straight to the site
  gateText: '[ tap to enter ]',
  warning: 'flickering imagery · sound on · skip anytime',

  /* seconds per phase (shortened automatically if reduced-motion is on) */
  durations: { chaos: 7, turn: 6, beauty: 6.5, outro: 2.6 },

  /* captions shown during each phase, spread evenly across it */
  captions: {
    chaos:  ['every symbol you were told to fear', 'every symbol you were told to worship'],
    turn:   ['strip the names away', 'and the shapes begin to soften'],
    beauty: ['what remains is only longing', 'for something to hold you back']
  },
  finale: 'you made it here. come say hi.',

  sound: true                          // synthesised drone that resolves from dissonance to a warm chord
};
