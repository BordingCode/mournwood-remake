// Cards. Effects = list of ops run by the engine. `tag` drives the Hunt (matching a monster's
// weakness = +50%). Text is short & keyworded for phone + tap-to-inspect.
export const CARDS = {
  // ---------- Houndmaster starter ----------
  rake:  { id: 'rake', name: 'Rake', cost: 1, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 5. Apply 1 Bleed.', effects: [{ k: 'damage', amount: 5 }, { k: 'status', status: 'bleed', amount: 1 }] },
  brace: { id: 'brace', name: 'Brace', cost: 1, type: 'skill', target: 'self',
           text: 'Gain 6 Block.', effects: [{ k: 'block', amount: 6 }] },
  sicem: { id: 'sicem', name: "Sic 'Em", cost: 1, type: 'skill', target: 'enemy',
           text: 'Your Hound savages a foe.', effects: [{ k: 'houndAttack', times: 1 }] },
  feed:  { id: 'feed', name: 'Feed', cost: 1, type: 'skill', target: 'self', exhaust: true,
           text: 'Feed the Hound: +3 attack, +4 max HP. Exhaust.', effects: [{ k: 'feedHound', atk: 3, hp: 4 }] },

  // ---------- Houndmaster reward pool ----------
  maul:  { id: 'maul', name: 'Maul', cost: 1, type: 'attack', target: 'enemy', tag: 'blunt',
           text: 'Deal 8. Break 3 (armor).', effects: [{ k: 'damage', amount: 8 }, { k: 'break', amount: 3 }] },
  rend:  { id: 'rend', name: 'Rend', cost: 2, type: 'attack', target: 'enemy', tag: 'bleed',
           text: 'Deal 4 twice. Apply 2 Bleed.', effects: [{ k: 'damage', amount: 4, times: 2 }, { k: 'status', status: 'bleed', amount: 2 }] },
  bloodscent: { id: 'bloodscent', name: 'Bloodscent', cost: 0, type: 'skill', target: 'enemy', tag: 'bleed',
           text: 'Apply 3 Bleed. Draw 1.', effects: [{ k: 'status', status: 'bleed', amount: 3 }, { k: 'draw', amount: 1 }] },
  gut:   { id: 'gut', name: 'Gut', cost: 2, type: 'attack', target: 'enemy', tag: 'bleed',
           text: "Deal damage equal to 2× the target's Bleed.", effects: [{ k: 'damage', fromTargetStatus: { status: 'bleed', per: 2 } }] },
  packbond: { id: 'packbond', name: 'Pack Bond', cost: 1, type: 'power', target: 'self',
           text: 'Each Attack you play makes your Hound +1 stronger this fight.', effects: [{ k: 'status', status: 'packbond', amount: 1, to: 'self' }] },
  frenzy: { id: 'frenzy', name: 'Frenzy', cost: 1, type: 'skill', target: 'enemy',
           text: 'Your Hound strikes twice.', effects: [{ k: 'houndAttack', times: 2 }] },
  mend:  { id: 'mend', name: 'Mend', cost: 1, type: 'skill', target: 'self',
           text: 'Heal your Hound 10. Revives it if downed.', effects: [{ k: 'healHound', amount: 10 }] },
  snare: { id: 'snare', name: "Trapper's Snare", cost: 1, type: 'skill', target: 'enemy',
           text: 'Apply 2 Vulnerable and 2 Weak.', effects: [{ k: 'status', status: 'vulnerable', amount: 2 }, { k: 'status', status: 'weak', amount: 2 }] },
  gorge: { id: 'gorge', name: 'Gorge', cost: 2, type: 'skill', target: 'self', exhaust: true,
           text: 'Lose 4 HP. Hound gains +6 attack, +8 max HP. Exhaust.', effects: [{ k: 'selfDamage', amount: 4 }, { k: 'feedHound', atk: 6, hp: 8 }] },

  // ---------- curse (the price of power) ----------
  ashdoubt: { id: 'ashdoubt', name: 'Ash-Doubt', cost: 0, type: 'curse', target: 'self', unplayable: true,
           text: 'Unplayable. A dead draw — corruption clogs your hand.', effects: [] },
};

let _uid = 0;
export function instantiate(id) {
  const def = CARDS[id];
  if (!def) throw new Error('Unknown card: ' + id);
  return { ...def, uid: 'c' + (++_uid) };
}
