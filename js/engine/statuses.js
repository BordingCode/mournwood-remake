// Small, deep status vocabulary. Stored on an entity as { id: amount }. No DOM.
export const STATUSES = {
  strength:   { name: 'Strength',   icon: '🦷', kind: 'buff',
                desc: 'Attacks deal +X damage.' },
  bleed:      { name: 'Bleed',      icon: '🩸', kind: 'debuff', dot: true,
                desc: 'Loses X HP at the start of its turn, then X drops by 1.' },
  vulnerable: { name: 'Vulnerable', icon: '🎯', kind: 'debuff', decays: true,
                desc: 'Takes 50% more attack damage. -1 each turn.' },
  weak:       { name: 'Weak',       icon: '💧', kind: 'debuff', decays: true,
                desc: 'Its attacks deal 25% less. -1 each turn.' },
  packbond:   { name: 'Pack Bond',  icon: '🐾', kind: 'buff',
                desc: 'Each Attack you play makes the Hound +X stronger this fight.' },
  regen:      { name: 'Regen',      icon: '🌿', kind: 'buff', dot: true,
                desc: 'Heals X at the start of its turn, then X drops by 1.' },
  poison:     { name: 'Rot',        icon: '🧪', kind: 'debuff', dot: true,
                desc: 'Loses X HP at the start of its turn, then X drops by 1. (the Worm Pact)' },
  thorns:     { name: 'Thorns',     icon: '🌵', kind: 'buff',
                desc: 'When struck, deals X back to the attacker. (the Iron Pact)' },
};

export const amt = (e, id) => (e && e.statuses && e.statuses[id]) || 0;
export const has = (e, id) => amt(e, id) > 0;

export function addStatus(e, id, n) {
  if (!e.statuses) e.statuses = {};
  e.statuses[id] = (e.statuses[id] || 0) + n;
  if (e.statuses[id] <= 0) delete e.statuses[id];
}

// "decays" debuffs lose 1 stack at the end of the owner's turn.
export function decayTurnEnd(e) {
  if (!e.statuses) return;
  for (const id of Object.keys(e.statuses)) if (STATUSES[id]?.decays) addStatus(e, id, -1);
}
