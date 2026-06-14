// Run state: a branching node map (random-walk DAG), encounter selection, and save/resume.
import { makeRng } from '../engine/rng.js';
import { HUNTERS } from '../data/hunters.js';
import { PACTS } from '../data/pacts.js';
import { RELIC_POOL } from '../data/relics.js';

const W = 4, H = 11, PATHS = 6;        // map width, content rows, number of random-walk paths
const SAVE_KEY = 'mw_save_v1';

export const NODE = { combat: 'combat', elite: 'elite', rest: 'rest', shop: 'shop', event: 'event', cache: 'cache', hunt: 'hunt', boss: 'boss' };
export const NODE_META = {
  combat: { icon: '⚔️', label: 'Beast' }, elite: { icon: '★', label: 'Elite' },
  rest: { icon: '🔥', label: 'Camp' }, shop: { icon: '⚖️', label: 'Trader' },
  event: { icon: '❔', label: 'Omen' }, cache: { icon: '📦', label: 'Cache' },
  hunt: { icon: '🩸', label: 'Hunt' }, boss: { icon: '👑', label: 'Great Beast' },
};

export function generateMap(rng) {
  const nodes = {};
  const key = (r, c) => r + '-' + c;
  const edge = new Set();
  const add = (r, c) => { const k = key(r, c); if (!nodes[k]) nodes[k] = { id: k, r, c, type: NODE.combat, next: [] }; return k; };

  for (let p = 0; p < PATHS; p++) {
    let c = rng.int(0, W - 1);
    add(0, c);
    for (let r = 0; r < H - 1; r++) {
      let c2 = Math.max(0, Math.min(W - 1, c + rng.pick([-1, 0, 1])));
      add(r, c); add(r + 1, c2);
      const e = key(r, c) + '|' + key(r + 1, c2);
      if (!edge.has(e)) { edge.add(e); nodes[key(r, c)].next.push(key(r + 1, c2)); }
      c = c2;
    }
  }
  // boss node above the top content row; every top node leads to it
  nodes.boss = { id: 'boss', r: H, c: (W - 1) / 2, type: NODE.boss, next: [] };
  Object.values(nodes).forEach((n) => { if (n.r === H - 1) n.next = ['boss']; });

  // ---- type assignment ----
  let hasShop = false, huntPlaced = false;
  Object.values(nodes).forEach((n) => {
    if (n.type === NODE.boss) return;
    if (n.r === 0) { n.type = NODE.combat; return; }
    if (n.r === H - 1) { n.type = NODE.rest; return; }   // camp before the boss
    const roll = rng.next();
    if (n.r >= 3 && roll < 0.16) n.type = NODE.elite;
    else if (n.r >= 3 && roll < 0.24) { n.type = NODE.shop; hasShop = true; }
    else if (n.r >= 4 && roll < 0.31) n.type = NODE.rest;
    else if (roll < 0.53) n.type = NODE.event;
    else if (roll < 0.61) n.type = NODE.cache;
    else n.type = NODE.combat;
  });
  const mids = Object.values(nodes).filter((n) => n.r >= 4 && n.r <= 7 && n.type === NODE.combat);
  if (mids.length) { rng.pick(mids).type = NODE.hunt; huntPlaced = true; }
  if (!hasShop) { const c = Object.values(nodes).filter((n) => n.r >= 3 && n.r <= H - 2 && n.type === NODE.combat); if (c.length) rng.pick(c).type = NODE.shop; }

  return { rows: H, nodes, starts: Object.values(nodes).filter((n) => n.r === 0).map((n) => n.id) };
}

// ---- Ascension: "The Hunt Deepens" — fair, fixed modifiers (no rubber-banding). ----
export const ASCENSIONS = [
  { lvl: 0, name: 'The Hunt', desc: 'The standard descent.' },
  { lvl: 1, name: 'Deepening I', desc: 'Prey are hardier — +15% enemy HP.' },
  { lvl: 2, name: 'Deepening II', desc: 'Wounds knit slower — all healing −33%.' },
  { lvl: 3, name: 'Deepening III', desc: 'Elites & great-beasts start with +2 Strength.' },
  { lvl: 4, name: 'Deepening IV', desc: 'You begin the hunt with a Curse in your deck.' },
  { lvl: 5, name: 'Deepening V', desc: 'All prey are deadlier (+1 Strength) and give 20% less gold.' },
];
export function ascensionMods(lvl) {
  const m = { enemyHpMul: 1, healMul: 1, eliteBossStr: 0, allEnemyStr: 0, startCurses: 0, goldMul: 1 };
  if (lvl >= 1) m.enemyHpMul *= 1.15;
  if (lvl >= 2) m.healMul *= 0.67;
  if (lvl >= 3) m.eliteBossStr += 2;
  if (lvl >= 4) m.startCurses += 1;
  if (lvl >= 5) { m.allEnemyStr += 1; m.goldMul *= 0.8; }
  return m;
}

export function makeRun({ hunterId = 'houndmaster', pactId = null, region = 0, ascension = 0, seed } = {}) {
  const h = HUNTERS[hunterId];
  const pact = pactId ? PACTS[pactId] : null;
  const s = seed != null ? seed : ((Date.now() & 0xffffff) ^ 0x5a5a);
  const rng = makeRng(s + region * 7777);
  // per-run offering pools = hunter pool/relics + the chosen Pact's mini-set
  const cardPool = h.pool.concat(pact ? pact.cards : []);
  const relicPool = RELIC_POOL.concat(pact ? pact.relics.concat(pact.startRelic ? [pact.startRelic] : []) : []);
  const startRelics = pact && pact.startRelic ? [pact.startRelic] : [];
  const mods = ascensionMods(ascension);
  const deck = h.startDeck.slice();
  for (let i = 0; i < mods.startCurses; i++) deck.push('ashdoubt'); // Ascension IV+: a curse in the pack
  return {
    seed: s, hunterId, pactId, region, ascension, mods,
    player: { name: h.name, maxHp: h.maxHp, hp: h.maxHp, gold: 50, deck, relics: startRelics },
    hound: h.hound ? { name: h.hound.name, maxHp: h.hound.maxHp, atk: h.hound.atk } : null,
    cardPool, relicPool,
    map: generateMap(rng), node: null, cleared: [],
  };
}

/* ---------------- meta-progression (persists across runs) ---------------- */
const META_KEY = 'mw_meta_v1';
const defaultMeta = () => ({ runs: 0, wins: 0, maxAscension: 0, bossesFelled: 0, hunterWins: {} });
export function loadMeta() { try { return Object.assign(defaultMeta(), JSON.parse(localStorage.getItem(META_KEY)) || {}); } catch (e) { return defaultMeta(); } }
export function saveMeta(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }

export function reachable(run) {
  if (!run.node) return run.map.starts.map((id) => run.map.nodes[id]);
  return (run.map.nodes[run.node]?.next || []).map((id) => run.map.nodes[id]).filter(Boolean);
}

// The three regions of the descent: green edge → sinking mire → corrupted heart.
export const REGIONS = [
  { name: 'Wealdedge', sub: 'the green, human-touched edge',
    pool: ['thornwretch', 'gloomwolf', 'bonehusk', 'mireling'], elite: 'hollowstag', boss: 'briarmother',
    hunts: [['gloomwolf', 'bonehusk'], ['hollowstag'], ['gloomwolf', 'gloomwolf']] },
  { name: 'The Sloughfen', sub: 'the sinking mire',
    pool: ['bogleech', 'drowned', 'gasbloat', 'fenstalker'], elite: 'mirewidow', boss: 'fenmaw',
    hunts: [['fenstalker', 'gasbloat'], ['mirewidow'], ['drowned', 'bogleech']] },
  { name: 'The Blackheart', sub: 'the corrupted inner wood',
    pool: ['gloomspawn', 'rotpriest', 'thornhorror', 'direwolf'], elite: 'antleredpenance', boss: 'heartrot',
    hunts: [['direwolf', 'gloomspawn'], ['antleredpenance'], ['thornhorror', 'rotpriest']] },
];
export const REGION_COUNT = REGIONS.length;

export function enemyIdsFor(run, node) {
  const R = REGIONS[run.region] || REGIONS[0];
  const rng = makeRng(run.seed + node.r * 131 + node.c * 17 + run.region * 999);
  if (node.type === NODE.boss) return [R.boss];
  if (node.type === NODE.elite) return [R.elite];
  if (node.type === NODE.hunt) return rng.pick(R.hunts);
  const count = node.r <= 2 ? 1 : node.r <= 6 ? (rng.chance(0.35) ? 2 : 1) : 2;
  const out = []; for (let i = 0; i < count; i++) out.push(rng.pick(R.pool));
  return out;
}

// Descend to the next region: fresh map, same hunter/deck/relics/hp carry over.
export function advanceRegion(run) {
  run.region++;
  const rng = makeRng(run.seed + run.region * 7777);
  run.map = generateMap(rng);
  run.node = null; run.cleared = []; run._shopBought = null;
  return run;
}

/* ---------------- save / resume ---------------- */
export function saveRun(run) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(run)); } catch (e) {} }
export function loadRun() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
