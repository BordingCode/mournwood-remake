// Playable hunters. M1 implements the Houndmaster fully. Assassin/Tinker arrive in M3.
export const HUNTERS = {
  houndmaster: {
    id: 'houndmaster', name: 'Houndmaster', emoji: '🐺',
    maxHp: 70,
    tagline: 'Bond & Feed — grow a monstrous hound, but guard it with your life.',
    hound: { name: 'Hound', maxHp: 22, atk: 6 },
    startDeck: ['rake', 'rake', 'rake', 'rake', 'brace', 'brace', 'brace', 'sicem', 'sicem', 'feed'],
    pool: ['maul', 'rend', 'bloodscent', 'gut', 'packbond', 'frenzy', 'mend', 'snare', 'gorge'],
  },
  // assassin: { ... }  // M3
  // tinker:   { ... }  // M3
};
