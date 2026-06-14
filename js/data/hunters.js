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
  assassin: {
    id: 'assassin', name: 'Assassin', emoji: '🗡️',
    maxHp: 62,
    tagline: 'Combo Chains — string cheap cards together, then land a finisher that scales with the chain.',
    startDeck: ['nick', 'nick', 'nick', 'nick', 'dart', 'guard', 'guard', 'guard', 'slip', 'eviscerate'],
    pool: ['shadowstep', 'bloodrush', 'twinfang', 'assassinate', 'whirl', 'pierce', 'momentum', 'coupdegrace', 'exsang', 'eviscerate'],
  },
  tinker: {
    id: 'tinker', name: 'Tinker', emoji: '⚙️',
    maxHp: 66,
    tagline: 'Contraptions — deploy devices that fight on their own every turn; build a self-running machine.',
    startDeck: ['bolt', 'bolt', 'bolt', 'plating', 'plating', 'plating', 'deployturret', 'deploygrinder', 'crank', 'crank'],
    pool: ['deploybellows', 'deployneedler', 'megacannon', 'overclock', 'overdrive', 'scrapblast', 'reinforce', 'piston', 'deployturret', 'deploygrinder'],
  },
};
