// Cards. effects = ops run by the engine. `tag` drives the Hunt (+50% vs matching weakness).
// `up` = the upgraded variant's overrides (applied when the deck entry ends with '+').

// Tinker contraptions: persistent devices that act on their own each player turn.
export const CONTRAPTIONS = {
  turret:      { name: 'Turret',       icon: '🔩', kind: 'attack' },   // strikes the weakest foe
  heavyturret: { name: 'Heavy Turret', icon: '⚙️', kind: 'attack' },
  grinder:     { name: 'Grinder',      icon: '🛡️', kind: 'block' },    // grants Block (lasting defense)
  bellows:     { name: 'Bellows',      icon: '💨', kind: 'strength' },  // grants Strength
  needler:     { name: 'Needler',      icon: '📍', kind: 'bleed' },     // applies Bleed
};

export const CARDS = {
  // ---------- Houndmaster starter ----------
  rake:  { id: 'rake', name: 'Rake', cost: 1, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 5. Apply 1 Bleed.', effects: [{ k: 'damage', amount: 5 }, { k: 'status', status: 'bleed', amount: 1 }],
           up: { text: 'Deal 7. Apply 2 Bleed.', effects: [{ k: 'damage', amount: 7 }, { k: 'status', status: 'bleed', amount: 2 }] } },
  brace: { id: 'brace', name: 'Brace', cost: 1, type: 'skill', target: 'self',
           text: 'Gain 6 Block.', effects: [{ k: 'block', amount: 6 }],
           up: { text: 'Gain 9 Block.', effects: [{ k: 'block', amount: 9 }] } },
  sicem: { id: 'sicem', name: "Sic 'Em", cost: 1, type: 'skill', target: 'enemy',
           text: 'Your Hound savages a foe.', effects: [{ k: 'houndAttack', times: 1 }],
           up: { cost: 0, text: 'Your Hound savages a foe. (cost 0)' } },
  feed:  { id: 'feed', name: 'Feed', cost: 1, type: 'skill', target: 'self', exhaust: true,
           text: 'Feed the Hound: +3 attack, +4 max HP. Exhaust.', effects: [{ k: 'feedHound', atk: 3, hp: 4 }],
           up: { text: 'Feed: +4 attack, +6 max HP. Exhaust.', effects: [{ k: 'feedHound', atk: 4, hp: 6 }] } },

  // ---------- Houndmaster reward pool ----------
  maul:  { id: 'maul', name: 'Maul', cost: 1, type: 'attack', target: 'enemy', tag: 'blunt',
           text: 'Deal 8. Break 3 (armor).', effects: [{ k: 'damage', amount: 8 }, { k: 'break', amount: 3 }],
           up: { text: 'Deal 11. Break 4 (armor).', effects: [{ k: 'damage', amount: 11 }, { k: 'break', amount: 4 }] } },
  rend:  { id: 'rend', name: 'Rend', cost: 2, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 4 twice. Apply 2 Bleed.', effects: [{ k: 'damage', amount: 4, times: 2 }, { k: 'status', status: 'bleed', amount: 2 }],
           up: { text: 'Deal 5 twice. Apply 3 Bleed.', effects: [{ k: 'damage', amount: 5, times: 2 }, { k: 'status', status: 'bleed', amount: 3 }] } },
  bloodscent: { id: 'bloodscent', name: 'Bloodscent', cost: 0, type: 'skill', target: 'enemy', tag: 'bleed',
           text: 'Apply 3 Bleed. Draw 1.', effects: [{ k: 'status', status: 'bleed', amount: 3 }, { k: 'draw', amount: 1 }],
           up: { text: 'Apply 4 Bleed. Draw 1.', effects: [{ k: 'status', status: 'bleed', amount: 4 }, { k: 'draw', amount: 1 }] } },
  gut:   { id: 'gut', name: 'Gut', cost: 2, type: 'attack', target: 'enemy', tag: 'bleed',
           text: "Deal damage equal to 2× the target's Bleed.", effects: [{ k: 'damage', fromTargetStatus: { status: 'bleed', per: 2 } }],
           up: { text: "Deal damage equal to 3× the target's Bleed.", effects: [{ k: 'damage', fromTargetStatus: { status: 'bleed', per: 3 } }] } },
  packbond: { id: 'packbond', name: 'Pack Bond', cost: 1, type: 'power', target: 'self',
           text: 'Each Attack you play makes your Hound +1 stronger this fight.', effects: [{ k: 'status', status: 'packbond', amount: 1, to: 'self' }],
           up: { text: 'Each Attack you play makes your Hound +2 stronger this fight.', effects: [{ k: 'status', status: 'packbond', amount: 2, to: 'self' }] } },
  frenzy: { id: 'frenzy', name: 'Frenzy', cost: 1, type: 'skill', target: 'enemy',
           text: 'Your Hound strikes twice.', effects: [{ k: 'houndAttack', times: 2 }],
           up: { cost: 0, text: 'Your Hound strikes twice. (cost 0)' } },
  mend:  { id: 'mend', name: 'Mend', cost: 1, type: 'skill', target: 'self',
           text: 'Heal your Hound 10. Revives it if downed.', effects: [{ k: 'healHound', amount: 10 }],
           up: { text: 'Heal your Hound 16. Revives it if downed.', effects: [{ k: 'healHound', amount: 16 }] } },
  snare: { id: 'snare', name: "Trapper's Snare", cost: 1, type: 'skill', target: 'enemy',
           text: 'Apply 2 Vulnerable and 2 Weak.', effects: [{ k: 'status', status: 'vulnerable', amount: 2 }, { k: 'status', status: 'weak', amount: 2 }],
           up: { text: 'Apply 3 Vulnerable and 3 Weak.', effects: [{ k: 'status', status: 'vulnerable', amount: 3 }, { k: 'status', status: 'weak', amount: 3 }] } },
  gorge: { id: 'gorge', name: 'Gorge', cost: 2, type: 'skill', target: 'self', exhaust: true,
           text: 'Lose 4 HP. Hound gains +6 attack, +8 max HP. Exhaust.', effects: [{ k: 'selfDamage', amount: 4 }, { k: 'feedHound', atk: 6, hp: 8 }],
           up: { text: 'Lose 2 HP. Hound gains +8 attack, +10 max HP. Exhaust.', effects: [{ k: 'selfDamage', amount: 2 }, { k: 'feedHound', atk: 8, hp: 10 }] } },

  // ========== ASSASSIN — Combo Chains (cheap cards pump finishers; cardsThisTurn = combo) ==========
  // starter
  nick:  { id: 'nick', name: 'Nick', cost: 0, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 3. (a cheap link in the chain)', effects: [{ k: 'damage', amount: 3 }],
           up: { text: 'Deal 5.', effects: [{ k: 'damage', amount: 5 }] } },
  dart:  { id: 'dart', name: 'Throwing Dart', cost: 0, type: 'attack', target: 'enemy',
           text: 'Deal 2. Draw 1.', effects: [{ k: 'damage', amount: 2 }, { k: 'draw', amount: 1 }],
           up: { text: 'Deal 3. Draw 1.', effects: [{ k: 'damage', amount: 3 }, { k: 'draw', amount: 1 }] } },
  guard: { id: 'guard', name: 'Parry', cost: 1, type: 'skill', target: 'self',
           text: 'Gain 5 Block.', effects: [{ k: 'block', amount: 5 }],
           up: { text: 'Gain 8 Block.', effects: [{ k: 'block', amount: 8 }] } },
  slip:  { id: 'slip', name: 'Slip', cost: 1, type: 'skill', target: 'self',
           text: 'Gain 4 Block. Draw 1.', effects: [{ k: 'block', amount: 4 }, { k: 'draw', amount: 1 }],
           up: { text: 'Gain 6 Block. Draw 1.', effects: [{ k: 'block', amount: 6 }, { k: 'draw', amount: 1 }] } },
  eviscerate: { id: 'eviscerate', name: 'Eviscerate', cost: 1, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 4, +2 per card played this turn (this one counts).', effects: [{ k: 'damage', amount: { base: 4, perCombo: 2 } }],
           up: { text: 'Deal 5, +3 per card played this turn.', effects: [{ k: 'damage', amount: { base: 5, perCombo: 3 } }] } },
  // pool
  shadowstep: { id: 'shadowstep', name: 'Shadowstep', cost: 1, type: 'skill', target: 'self',
           text: 'Gain 1 energy. Draw 1.', effects: [{ k: 'energy', amount: 1 }, { k: 'draw', amount: 1 }],
           up: { text: 'Gain 1 energy. Draw 2.', effects: [{ k: 'energy', amount: 1 }, { k: 'draw', amount: 2 }] } },
  bloodrush: { id: 'bloodrush', name: 'Bloodrush', cost: 0, type: 'skill', target: 'self', exhaust: true,
           text: 'Draw 2. Lose 2 HP. Exhaust.', effects: [{ k: 'draw', amount: 2 }, { k: 'selfDamage', amount: 2 }],
           up: { text: 'Draw 2. Exhaust.', effects: [{ k: 'draw', amount: 2 }] } },
  twinfang: { id: 'twinfang', name: 'Twin Fang', cost: 1, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 3 twice. If 3+ cards played this turn, apply 3 Bleed.',
           effects: [{ k: 'damage', amount: 3, times: 2 }, { k: 'if', combo: 3, then: [{ k: 'status', status: 'bleed', amount: 3 }] }],
           up: { text: 'Deal 4 twice. If 3+ cards played, apply 4 Bleed.', effects: [{ k: 'damage', amount: 4, times: 2 }, { k: 'if', combo: 3, then: [{ k: 'status', status: 'bleed', amount: 4 }] }] } },
  assassinate: { id: 'assassinate', name: 'Assassinate', cost: 2, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 8. If 4+ cards played this turn, deal 8 more.',
           effects: [{ k: 'damage', amount: 8 }, { k: 'if', combo: 4, then: [{ k: 'damage', amount: 8 }] }],
           up: { text: 'Deal 10. If 4+ cards played, deal 10 more.', effects: [{ k: 'damage', amount: 10 }, { k: 'if', combo: 4, then: [{ k: 'damage', amount: 10 }] }] } },
  whirl: { id: 'whirl', name: 'Whirlblades', cost: 1, type: 'attack', target: 'all', tag: 'bleed',
           text: 'Deal 4 to ALL, +1 per card played this turn.', effects: [{ k: 'damage', amount: { base: 4, perCombo: 1 } }],
           up: { text: 'Deal 5 to ALL, +2 per card played.', effects: [{ k: 'damage', amount: { base: 5, perCombo: 2 } }] } },
  pierce: { id: 'pierce', name: 'Pierce', cost: 1, type: 'attack', target: 'enemy',
           text: 'Deal 5. Apply 2 Vulnerable.', effects: [{ k: 'damage', amount: 5 }, { k: 'status', status: 'vulnerable', amount: 2 }],
           up: { text: 'Deal 7. Apply 3 Vulnerable.', effects: [{ k: 'damage', amount: 7 }, { k: 'status', status: 'vulnerable', amount: 3 }] } },
  momentum: { id: 'momentum', name: 'Momentum', cost: 0, type: 'skill', target: 'self',
           text: 'Draw 1. If 2+ cards played this turn, gain 1 energy.', effects: [{ k: 'draw', amount: 1 }, { k: 'if', combo: 2, then: [{ k: 'energy', amount: 1 }] }],
           up: { text: 'Draw 1. Gain 1 energy.', effects: [{ k: 'draw', amount: 1 }, { k: 'energy', amount: 1 }] } },
  coupdegrace: { id: 'coupdegrace', name: 'Coup de Grâce', cost: 2, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 4, +4 per card played this turn.', effects: [{ k: 'damage', amount: { base: 4, perCombo: 4 } }],
           up: { text: 'Deal 6, +5 per card played.', effects: [{ k: 'damage', amount: { base: 6, perCombo: 5 } }] } },
  exsang: { id: 'exsang', name: 'Exsanguinate', cost: 1, type: 'attack', target: 'enemy', tag: 'bleed',
           text: "Deal damage equal to 2× the target's Bleed.", effects: [{ k: 'damage', fromTargetStatus: { status: 'bleed', per: 2 } }],
           up: { text: "Deal damage equal to 3× the target's Bleed.", effects: [{ k: 'damage', fromTargetStatus: { status: 'bleed', per: 3 } }] } },

  // ========== TINKER — Contraptions (deploy devices that act every turn on their own) ==========
  // starter
  bolt:  { id: 'bolt', name: 'Bolt', cost: 1, type: 'attack', target: 'enemy', tag: 'blunt',
           text: 'Deal 6.', effects: [{ k: 'damage', amount: 6 }],
           up: { text: 'Deal 9.', effects: [{ k: 'damage', amount: 9 }] } },
  plating: { id: 'plating', name: 'Plating', cost: 1, type: 'skill', target: 'self',
           text: 'Gain 6 Block.', effects: [{ k: 'block', amount: 6 }],
           up: { text: 'Gain 9 Block.', effects: [{ k: 'block', amount: 9 }] } },
  deployturret: { id: 'deployturret', name: 'Deploy Turret', cost: 1, type: 'skill', target: 'self',
           text: 'Deploy a 🔩 Turret (strikes the weakest foe for 4 each turn).', effects: [{ k: 'deploy', dep: 'turret', value: 4 }],
           up: { text: 'Deploy a 🔩 Turret (strikes for 6 each turn).', effects: [{ k: 'deploy', dep: 'turret', value: 6 }] } },
  deploygrinder: { id: 'deploygrinder', name: 'Deploy Grinder', cost: 1, type: 'skill', target: 'self',
           text: 'Deploy a 🛡️ Grinder (gain 5 Block each turn).', effects: [{ k: 'deploy', dep: 'grinder', value: 5 }],
           up: { text: 'Deploy a 🛡️ Grinder (gain 7 Block each turn).', effects: [{ k: 'deploy', dep: 'grinder', value: 7 }] } },
  crank: { id: 'crank', name: 'Crank', cost: 0, type: 'skill', target: 'self',
           text: 'Draw 1. If you have a contraption, gain 1 energy.', effects: [{ k: 'draw', amount: 1 }, { k: 'if', hasContraption: true, then: [{ k: 'energy', amount: 1 }] }],
           up: { text: 'Draw 1. Gain 1 energy.', effects: [{ k: 'draw', amount: 1 }, { k: 'energy', amount: 1 }] } },
  // pool
  deploybellows: { id: 'deploybellows', name: 'Deploy Bellows', cost: 1, type: 'skill', target: 'self',
           text: 'Deploy a 💨 Bellows (gain 1 Strength each turn).', effects: [{ k: 'deploy', dep: 'bellows', value: 1 }],
           up: { text: 'Deploy a 💨 Bellows (gain 2 Strength each turn).', effects: [{ k: 'deploy', dep: 'bellows', value: 2 }] } },
  deployneedler: { id: 'deployneedler', name: 'Deploy Needler', cost: 1, type: 'skill', target: 'self',
           text: 'Deploy a 📍 Needler (apply 2 Bleed to a random foe each turn).', effects: [{ k: 'deploy', dep: 'needler', value: 2 }],
           up: { text: 'Deploy a 📍 Needler (apply 3 Bleed each turn).', effects: [{ k: 'deploy', dep: 'needler', value: 3 }] } },
  megacannon: { id: 'megacannon', name: 'Deploy Mega-Cannon', cost: 2, type: 'skill', target: 'self',
           text: 'Deploy a ⚙️ Heavy Turret (strikes for 9 each turn).', effects: [{ k: 'deploy', dep: 'heavyturret', value: 9 }],
           up: { text: 'Deploy a ⚙️ Heavy Turret (strikes for 12 each turn).', effects: [{ k: 'deploy', dep: 'heavyturret', value: 12 }] } },
  overclock: { id: 'overclock', name: 'Overclock', cost: 1, type: 'skill', target: 'self', exhaust: true,
           text: 'Gain 2 energy. Draw 1. Exhaust.', effects: [{ k: 'energy', amount: 2 }, { k: 'draw', amount: 1 }],
           up: { text: 'Gain 2 energy. Draw 2. Exhaust.', effects: [{ k: 'energy', amount: 2 }, { k: 'draw', amount: 2 }] } },
  overdrive: { id: 'overdrive', name: 'Overdrive', cost: 1, type: 'skill', target: 'self',
           text: 'All your contraptions trigger again now.', effects: [{ k: 'overdrive' }],
           up: { cost: 0, text: 'All your contraptions trigger again now. (cost 0)' } },
  scrapblast: { id: 'scrapblast', name: 'Scrapblast', cost: 1, type: 'attack', target: 'enemy', tag: 'blunt',
           text: 'Deal 4, +3 per contraption you have.', effects: [{ k: 'damage', amount: { base: 4, perContraption: 3 } }],
           up: { text: 'Deal 6, +4 per contraption.', effects: [{ k: 'damage', amount: { base: 6, perContraption: 4 } }] } },
  reinforce: { id: 'reinforce', name: 'Reinforce', cost: 1, type: 'skill', target: 'self',
           text: 'Gain 5 Block, +2 per contraption.', effects: [{ k: 'block', amount: { base: 5, perContraption: 2 } }],
           up: { text: 'Gain 7 Block, +3 per contraption.', effects: [{ k: 'block', amount: { base: 7, perContraption: 3 } }] } },
  piston: { id: 'piston', name: 'Piston Punch', cost: 1, type: 'attack', target: 'enemy', tag: 'blunt',
           text: 'Deal 5 twice.', effects: [{ k: 'damage', amount: 5, times: 2 }],
           up: { text: 'Deal 7 twice.', effects: [{ k: 'damage', amount: 7, times: 2 }] } },

  // ========== PACT CARDS (cross-synergy; offered to any hunter who took that Pact) ==========
  // Worm Pact — Rot (poison)
  corrode: { id: 'corrode', name: 'Corrode', cost: 1, type: 'attack', target: 'enemy',
           text: 'Deal 4. Apply 3 Rot.', effects: [{ k: 'damage', amount: 4 }, { k: 'status', status: 'poison', amount: 3 }],
           up: { text: 'Deal 5. Apply 4 Rot.', effects: [{ k: 'damage', amount: 5 }, { k: 'status', status: 'poison', amount: 4 }] } },
  pestilence: { id: 'pestilence', name: 'Pestilence', cost: 1, type: 'skill', target: 'all',
           text: 'Apply 2 Rot to ALL foes.', effects: [{ k: 'status', status: 'poison', amount: 2 }],
           up: { text: 'Apply 3 Rot to ALL foes.', effects: [{ k: 'status', status: 'poison', amount: 3 }] } },
  fester: { id: 'fester', name: 'Fester', cost: 1, type: 'attack', target: 'enemy',
           text: "Deal damage equal to 2× the target's Rot.", effects: [{ k: 'damage', fromTargetStatus: { status: 'poison', per: 2 } }],
           up: { text: "Deal damage equal to 3× the target's Rot.", effects: [{ k: 'damage', fromTargetStatus: { status: 'poison', per: 3 } }] } },
  // Iron Pact — Thorns / block
  bulwark: { id: 'bulwark', name: 'Bulwark', cost: 1, type: 'skill', target: 'self',
           text: 'Gain 9 Block.', effects: [{ k: 'block', amount: 9 }],
           up: { text: 'Gain 13 Block.', effects: [{ k: 'block', amount: 13 }] } },
  bramblemail: { id: 'bramblemail', name: 'Bramble Mail', cost: 1, type: 'power', target: 'self',
           text: 'Gain 3 Thorns (deal it back when struck).', effects: [{ k: 'status', status: 'thorns', amount: 3, to: 'self' }],
           up: { text: 'Gain 5 Thorns.', effects: [{ k: 'status', status: 'thorns', amount: 5, to: 'self' }] } },
  ironcrush: { id: 'ironcrush', name: 'Iron Crush', cost: 1, type: 'attack', target: 'enemy', tag: 'blunt',
           text: 'Deal 6. Gain 4 Block.', effects: [{ k: 'damage', amount: 6 }, { k: 'block', amount: 4 }],
           up: { text: 'Deal 8. Gain 6 Block.', effects: [{ k: 'damage', amount: 8 }, { k: 'block', amount: 6 }] } },
  // Moon Pact — Beast-frenzy (Strength/energy)
  moonrise: { id: 'moonrise', name: 'Moonrise', cost: 1, type: 'power', target: 'self',
           text: 'Gain 2 Strength.', effects: [{ k: 'status', status: 'strength', amount: 2, to: 'self' }],
           up: { text: 'Gain 3 Strength.', effects: [{ k: 'status', status: 'strength', amount: 3, to: 'self' }] } },
  bloodmoon: { id: 'bloodmoon', name: 'Blood Moon', cost: 0, type: 'skill', target: 'self',
           text: 'Gain 1 energy. Lose 3 HP.', effects: [{ k: 'energy', amount: 1 }, { k: 'selfDamage', amount: 3 }],
           up: { text: 'Gain 1 energy. Lose 1 HP.', effects: [{ k: 'energy', amount: 1 }, { k: 'selfDamage', amount: 1 }] } },
  frenzystrike: { id: 'frenzystrike', name: 'Frenzy Strike', cost: 1, type: 'attack', target: 'enemy', tag: 'beast',
           text: 'Deal 4 twice.', effects: [{ k: 'damage', amount: 4, times: 2 }],
           up: { text: 'Deal 6 twice.', effects: [{ k: 'damage', amount: 6, times: 2 }] } },
  // Ash Pact — Sacrifice (pay HP for power)
  immolate: { id: 'immolate', name: 'Immolate', cost: 1, type: 'attack', target: 'enemy', tag: 'fire',
           text: 'Lose 3 HP. Deal 12.', effects: [{ k: 'selfDamage', amount: 3 }, { k: 'damage', amount: 12 }],
           up: { text: 'Lose 2 HP. Deal 16.', effects: [{ k: 'selfDamage', amount: 2 }, { k: 'damage', amount: 16 }] } },
  pyre: { id: 'pyre', name: 'Pyre', cost: 1, type: 'skill', target: 'self',
           text: 'Lose 4 HP. Gain 2 energy.', effects: [{ k: 'selfDamage', amount: 4 }, { k: 'energy', amount: 2 }],
           up: { text: 'Lose 2 HP. Gain 2 energy.', effects: [{ k: 'selfDamage', amount: 2 }, { k: 'energy', amount: 2 }] } },
  ashenpact: { id: 'ashenpact', name: 'Ashen Pact', cost: 1, type: 'power', target: 'self',
           text: 'Lose 5 HP. Gain 3 Strength.', effects: [{ k: 'selfDamage', amount: 5 }, { k: 'status', status: 'strength', amount: 3, to: 'self' }],
           up: { text: 'Lose 3 HP. Gain 4 Strength.', effects: [{ k: 'selfDamage', amount: 3 }, { k: 'status', status: 'strength', amount: 4, to: 'self' }] } },
  // Mist Pact — Stealth (block + setup)
  vanish: { id: 'vanish', name: 'Vanish', cost: 1, type: 'skill', target: 'self',
           text: 'Gain 8 Block. Draw 1.', effects: [{ k: 'block', amount: 8 }, { k: 'draw', amount: 1 }],
           up: { text: 'Gain 11 Block. Draw 1.', effects: [{ k: 'block', amount: 11 }, { k: 'draw', amount: 1 }] } },
  mistveil: { id: 'mistveil', name: 'Mist Veil', cost: 1, type: 'skill', target: 'all',
           text: 'Apply 2 Weak to ALL foes.', effects: [{ k: 'status', status: 'weak', amount: 2 }],
           up: { text: 'Apply 3 Weak to ALL foes.', effects: [{ k: 'status', status: 'weak', amount: 3 }] } },
  ambush: { id: 'ambush', name: 'Ambush', cost: 1, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 6. If it is the first card you play this turn, deal 6 more.',
           effects: [{ k: 'damage', amount: 6 }, { k: 'if', firstCard: true, then: [{ k: 'damage', amount: 6 }] }],
           up: { text: 'Deal 8. If first card this turn, deal 8 more.', effects: [{ k: 'damage', amount: 8 }, { k: 'if', firstCard: true, then: [{ k: 'damage', amount: 8 }] }] } },

  // ---------- curses (the price of power) ----------
  ashdoubt: { id: 'ashdoubt', name: 'Ash-Doubt', cost: 0, type: 'curse', target: 'self', unplayable: true,
           text: 'Unplayable. A dead draw — corruption clogs your hand.', effects: [] },
  taint:   { id: 'taint', name: 'Creeping Taint', cost: 0, type: 'curse', target: 'self', unplayable: true,
           text: 'Unplayable. The rot spreads through your pack — a dead draw.', effects: [] },
};

let _uid = 0;
export function instantiate(spec) {
  const up = typeof spec === 'string' && spec.endsWith('+');
  const id = up ? spec.slice(0, -1) : spec;
  const def = CARDS[id];
  if (!def) throw new Error('Unknown card: ' + spec);
  const c = { ...def, uid: 'c' + (++_uid) };
  if (up && def.up) { Object.assign(c, def.up); c.upgraded = true; c.name = def.name + '+'; }
  delete c.up;
  return c;
}

// Can a deck entry be upgraded? (has an `up` and isn't already upgraded / a curse)
export function canUpgrade(spec) {
  if (typeof spec !== 'string' || spec.endsWith('+')) return false;
  return !!CARDS[spec]?.up;
}
