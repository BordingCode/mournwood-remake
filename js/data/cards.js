// Cards. effects = ops run by the engine. `tag` drives the Hunt (+50% vs matching weakness).
// `up` = the upgraded variant's overrides (applied when the deck entry ends with '+').
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
