// Wealdedge monsters. The Hunt system: each shows a WEAKNESS (weakTo a damage tag → +50%)
// and/or ARMOR (flat reduction per hit until Broken). Intents are telegraphed. RNG injected.
// Move types: attack | block | buff | debuff | ramp | summon | charge | maul (targets the Hound).

export const ENEMIES = {
  thornwretch: {
    id: 'thornwretch', name: 'Thornwretch', emoji: '🌿', hp: [26, 32],
    weakTo: 'fire', // briar horror — burns
    moves: [
      { id: 'rake', type: 'attack', amount: 7, weight: 5 },
      { id: 'grasp', type: 'debuff', status: 'weak', amount: 2, weight: 2 },
      { id: 'bristle', type: 'block', amount: 6, weight: 2 },
    ],
  },
  gloomwolf: {
    id: 'gloomwolf', name: 'Gloomwolf', emoji: '🐺', hp: [28, 34],
    weakTo: 'bleed', // a beast — bleeds out fast
    moves: [
      { id: 'bite', type: 'attack', amount: 8, weight: 4 },
      { id: 'savage', type: 'maul', amount: 7, weight: 3 }, // lunges at your Hound
      { id: 'howl', type: 'buff', status: 'strength', amount: 2, weight: 2 },
    ],
  },
  bonehusk: {
    id: 'bonehusk', name: 'Bonehusk', emoji: '💀', hp: [30, 38], armor: 3,
    weakTo: 'blunt', // armoured undead — shatter it
    moves: [
      { id: 'cleave', type: 'attack', amount: 9, weight: 5 },
      { id: 'brace', type: 'block', amount: 8, weight: 3 },
    ],
  },
  mireling: {
    id: 'mireling', name: 'Mireling', emoji: '🫧', hp: [20, 26],
    moves: [
      { id: 'spit', type: 'debuff', status: 'vulnerable', amount: 2, weight: 4 },
      { id: 'nip', type: 'attack', amount: 5, weight: 3 },
    ],
  },

  // ---- elite ----
  hollowstag: {
    id: 'hollowstag', name: 'The Hollow Stag', emoji: '🦌', elite: true, hp: [78, 90],
    weakTo: 'bleed',
    moves: [
      { id: 'gore', type: 'attack', amount: 14, weight: 4 },
      { id: 'trample', type: 'maul', amount: 10, weight: 2 }, // crushes the Hound
      { id: 'lower_antlers', type: 'charge', amount: 26, releaseId: 'impale', weight: 2 }, // telegraphed big hit
      { id: 'rut', type: 'buff', status: 'strength', amount: 3, weight: 2 },
    ],
  },

  // ---- region boss (multi-phase great-beast) ----
  briarmother: {
    id: 'briarmother', name: 'The Briar Mother', emoji: '🥀', boss: true, hp: [180, 180],
    phases: [
      { weakTo: 'fire', line: 'The wood drinks deep, little hunter.', moves: [
        { id: 'thorn_lash', type: 'attack', amount: 12, weight: 5 },
        { id: 'entangle', type: 'debuff', status: 'weak', amount: 2, weight: 2 },
        { id: 'barkskin', type: 'block', amount: 14, weight: 2 },
        { id: 'creep', type: 'ramp', amount: 1, weight: 2 } ] },
      { weakTo: 'bleed', enterBlock: 16, line: 'You bleed. Good. The roots are thirsty.', moves: [
        { id: 'rend', type: 'attack', amount: 10, times: 2, weight: 4 },
        { id: 'maul_hound', type: 'maul', amount: 12, weight: 2 },
        { id: 'spores', type: 'debuff', status: 'vulnerable', amount: 3, weight: 2 } ] },
      { weakTo: 'fire', enterStrength: 4, line: 'THEN BURN WITH ME.', moves: [
        { id: 'wrath', type: 'charge', amount: 30, releaseId: 'cataclysm', weight: 4 },
        { id: 'flurry', type: 'attack', amount: 7, times: 3, weight: 3 } ] },
    ],
  },
};

export const INTENT_ICON = { attack: '⚔️', block: '🛡️', buff: '⬆️', debuff: '🌀', ramp: '📈', summon: '☠️', charge: '💥', maul: '🐾' };

let _eid = 0;
export function makeEnemy(rng, id) {
  const def = ENEMIES[id];
  if (!def) throw new Error('Unknown enemy: ' + id);
  const maxHp = rng.int(def.hp[0], def.hp[1]);
  const ph0 = def.boss ? def.phases[0] : def;
  const e = {
    uid: 'e' + (++_eid), id: def.id, name: def.name, emoji: def.emoji,
    maxHp, hp: maxHp, block: 0, statuses: {}, def, history: [], intent: null,
    boss: !!def.boss, elite: !!def.elite, phase: 0,
    armor: def.armor || 0, weakTo: ph0.weakTo || null,
    moves: def.boss ? def.phases[0].moves : def.moves,
  };
  rollIntent(rng, e);
  return e;
}

export function rollIntent(rng, e) {
  if (e.forcedNext) { // a charge release bypasses the weighted roll
    const f = e.forcedNext; e.forcedNext = null;
    e.intent = { moveId: f.moveId, type: f.type, amount: f.amount || 0, times: f.times || 1, status: f.status || null, icon: INTENT_ICON[f.type] || '❔' };
    e.history.push(f.moveId);
    return e.intent;
  }
  const moves = e.moves || e.def.moves;
  const last2 = e.history.slice(-2);
  let pool = moves.filter((m) => !(last2.length === 2 && last2.every((x) => x === m.id)));
  if (pool.length === 0) pool = moves;
  const total = pool.reduce((s, m) => s + m.weight, 0);
  let r = rng.next() * total, move = pool[pool.length - 1];
  for (const m of pool) { if ((r -= m.weight) < 0) { move = m; break; } }
  e.intent = {
    moveId: move.id, type: move.type, amount: move.amount || 0, times: move.times || 1,
    status: move.status || null, icon: INTENT_ICON[move.type] || '❔',
    summonId: move.summonId, cap: move.cap, releaseId: move.releaseId, max: move.max,
  };
  e.history.push(move.id);
  return e.intent;
}

export function advanceBoss(rng, e) {
  if (!e.boss) return null;
  const frac = e.hp / e.maxHp;
  const target = frac <= 0.33 ? 2 : frac <= 0.66 ? 1 : 0;
  if (target > e.phase) {
    e.phase = target;
    const ph = e.def.phases[target];
    e.moves = ph.moves; e.history = []; e.forcedNext = null;
    if (ph.weakTo !== undefined) e.weakTo = ph.weakTo; // boss weakness shifts between phases
    if (ph.enterBlock) e.block += ph.enterBlock;
    if (ph.enterStrength) e.statuses.strength = (e.statuses.strength || 0) + ph.enterStrength;
    rollIntent(rng, e);
    return ph.line || null;
  }
  return null;
}
