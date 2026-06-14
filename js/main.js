// Mournwood — run orchestrator (Milestone 2). Branching map → node → resolve → map, with
// gold/relics/curses/camp/trader/events and auto-save + resume.
import { CombatScreen } from './ui/combat.js';
import { Audio } from './ui/audio.js';
import { renderMap } from './ui/map.js';
import { rewardScreen, campScreen, shopScreen, eventScreen, cacheScreen, deckOverlay } from './ui/nodes.js';
import { makeRun, loadRun, saveRun, clearSave, enemyIdsFor, reachable, advanceRegion, REGIONS, REGION_COUNT, NODE } from './game/run.js';
import { RELICS, RELIC_POOL } from './data/relics.js';
import { HUNTERS } from './data/hunters.js';
import { PACTS, PACT_IDS } from './data/pacts.js';
import { makeRng } from './engine/rng.js';

const root = document.getElementById('app');
const audio = new Audio();
let run = null;

function screen(cls, html) { root.innerHTML = ''; const s = document.createElement('div'); s.className = 'screen ' + cls; s.innerHTML = html; root.append(s); return s; }
const grantRelic = (rng) => { const pool = (run.relicPool || RELIC_POOL).filter((id) => !run.player.relics.includes(id)); if (!pool.length) return null; const id = rng.pick(pool); run.player.relics.push(id); return id; };

/* ---------------- title ---------------- */
function title() {
  audio.stopMusic();
  const saved = loadRun();
  const s = screen('title', `
    <div class="titlewrap">
      <div class="logo">MOURNWOOD</div>
      <div class="sub">a monster-hunter's descent</div>
      <p class="blurb">The wood is dying, and something at its heart is to blame.
      Read your prey, feed your hound, and cut a path to the dark.</p>
      ${saved ? '<button class="big continue">Continue the Hunt</button>' : ''}
      <button class="big ${saved ? 'ghostbig' : ''} newrun">${saved ? 'Abandon &amp; start anew' : 'Begin the Hunt'}</button>
      <p class="m1note">Milestone 4 · 3 Hunters × 5 Pacts · 3 regions to the Blackheart</p>
    </div>`);
  s.querySelector('.newrun').onclick = () => { audio.resume(); clearSave(); chooseHunter(); };
  if (saved) s.querySelector('.continue').onclick = () => { audio.resume(); run = saved; showMap(); };
}

/* ---------------- hunter & pact selection ---------------- */
let pick = {};
function chooseHunter() {
  pick = {};
  const order = ['houndmaster', 'assassin', 'tinker'];
  const s = screen('select', `<div class="selwrap">
    <h2 class="seltitle">Choose your Hunter</h2>
    <div class="selcards">${order.map((id) => { const h = HUNTERS[id]; return `<button class="selcard" data-id="${id}">
      <span class="selemoji">${h.emoji}</span><b>${h.name}</b><small>${h.tagline}</small>
      <span class="selhp">❤ ${h.maxHp} HP</span></button>`; }).join('')}</div>
    <button class="ghost selback">Back</button></div>`);
  s.querySelectorAll('.selcard').forEach((b) => b.onclick = () => { audio.card(); pick.hunterId = b.dataset.id; choosePact(); });
  s.querySelector('.selback').onclick = () => title();
}
function choosePact() {
  const s = screen('select', `<div class="selwrap">
    <h2 class="seltitle">Swear a Pact</h2>
    <p class="selsub">${HUNTERS[pick.hunterId].emoji} ${HUNTERS[pick.hunterId].name} — a Pact adds a synergistic mini-set of cards & relics.</p>
    <div class="selcards pacts">${PACT_IDS.map((id) => { const p = PACTS[id]; return `<button class="selcard pact" data-id="${id}">
      <span class="selemoji">${p.icon}</span><b>${p.name}</b><small>${p.desc}</small>
      <span class="selrelic">Starts with ${RELICS[p.startRelic].icon} ${RELICS[p.startRelic].name}</span></button>`; }).join('')}</div>
    <button class="ghost selback">Back</button></div>`);
  s.querySelectorAll('.selcard').forEach((b) => b.onclick = () => {
    audio.card(); pick.pactId = b.dataset.id;
    run = makeRun({ hunterId: pick.hunterId, pactId: pick.pactId });
    saveRun(run); showMap();
  });
  s.querySelector('.selback').onclick = () => chooseHunter();
}

/* ---------------- map ---------------- */
function showMap() {
  audio.stopMusic();
  saveRun(run);
  renderMap(root, run, {
    onPick: (node) => travel(node),
    onDeck: () => deckOverlay(root, run, () => {}),
  });
}

function travel(node) {
  run.node = node.id;
  if (!run.cleared.includes(node.id)) run.cleared.push(node.id);
  saveRun(run);
  switch (node.type) {
    case NODE.combat: case NODE.elite: case NODE.hunt: case NODE.boss: return startCombat(node);
    case NODE.rest: return campScreen(root, run, audio, afterNode);
    case NODE.shop: return shopScreen(root, run, audio, afterNode);
    case NODE.event: return eventScreen(root, run, audio, afterNode);
    case NODE.cache: return cacheScreen(root, run, audio, afterNode);
    default: return showMap();
  }
}
function afterNode() { saveRun(run); showMap(); }

/* ---------------- combat ---------------- */
function startCombat(node) {
  const ids = enemyIdsFor(run, node);
  const rng = makeRng(run.seed + run.cleared.length * 53 + 3);
  screen('combat', '');
  const host = root.querySelector('.combat');
  window.__mw.screen = new CombatScreen(host, {
    rng: makeRng(run.seed + node.r * 1000 + node.c * 7 + 11),
    player: { name: run.player.name, maxHp: run.player.maxHp, hp: run.player.hp, deck: run.player.deck.slice(), relics: run.player.relics.slice() },
    hound: run.hound ? { name: run.hound.name, maxHp: run.hound.maxHp, atk: run.hound.atk } : null,
    enemyIds: ids,
  }, audio, (result, combat) => {
    if (result === 'lose') { clearSave(); return gameOver(); }
    // persist hp + grown hound
    run.player.hp = combat.player.hp;
    if (run.hound && combat.hound) { run.hound.maxHp = combat.hound.maxHp; run.hound.atk = combat.hound.atk; }
    // gold reward
    let gold = 12 + node.r * 2 + rng.int(0, 6);
    if (node.type === NODE.elite) gold += 25;
    if (node.type === NODE.hunt) gold += 18;
    run.player.gold += gold;
    // relics from elites / hunts
    let gotRelic = null;
    if (node.type === NODE.elite || node.type === NODE.hunt) gotRelic = grantRelic(rng);
    // post-combat heals (e.g. Bloodstone)
    run.player.relics.forEach((id) => { const h = RELICS[id]?.postCombatHeal; if (h) run.player.hp = Math.min(run.player.maxHp, run.player.hp + h); });
    saveRun(run);
    if (node.type === NODE.boss) return (run.region >= REGION_COUNT - 1) ? victory() : regionTransition();
    if (gotRelic) toastThen(`Relic claimed: ${RELICS[gotRelic].icon} ${RELICS[gotRelic].name} (+${gold} teeth)`, () => rewardScreen(root, run, audio, afterNode));
    else rewardScreen(root, run, audio, afterNode);
  });
}

function toastThen(msg, next) {
  const s = screen('node toastscreen', `<div class="toastbig">${msg}</div><button class="big2 go">Take your spoils</button>`);
  s.querySelector('.go').onclick = next;
}

/* ---------------- between regions ---------------- */
const REGION_INTRO = [
  '', // entering region 0 has no transition
  'The Briar Mother falls, and Wealdedge is yours. The ground softens to black water underfoot — you wade down into <b>The Sloughfen</b>.',
  'The Fen-Maw chokes on its own mire. Ahead the trees blacken and weep sap like old blood — the <b>Blackheart</b> is close now.',
];
function regionTransition() {
  audio.fanfare(true);
  const next = run.region + 1;
  const heal = Math.ceil(run.player.maxHp * 0.4);
  run.player.hp = Math.min(run.player.maxHp, run.player.hp + heal);
  // a relic for felling a great-beast
  const rng = makeRng(run.seed + run.region * 313 + 99);
  const gotRelic = grantRelic(rng);
  advanceRegion(run); saveRun(run);
  const r = REGIONS[next];
  const s = screen('node regiontrans', `<div class="titlewrap">
    <div class="logo small">${r.name}</div>
    <p class="sub">${r.sub}</p>
    <p class="blurb">${REGION_INTRO[next] || ''}</p>
    <p class="m1note">You bind your wounds (+${heal} HP)${gotRelic ? ` and claim ${RELICS[gotRelic].icon} ${RELICS[gotRelic].name}` : ''}.</p>
    <button class="big go">Descend ▾</button></div>`);
  s.querySelector('.go').onclick = () => showMap();
}

/* ---------------- end states ---------------- */
function victory() {
  clearSave(); audio.fanfare(true);
  const s = screen('over win', `<div class="titlewrap">
    <div class="logo small">THE HEART-ROT IS UNMADE</div>
    <p class="blurb">The corruption at the wood's heart goes still at last. Mournwood will live — and so, against all odds, will you. The hunt is over.</p>
    <p class="m1note">You descended all three regions: Wealdedge · The Sloughfen · The Blackheart.<br>Milestone 4 complete. Next (M5): unlocks, the Ascension ladder, woodcut art &amp; music.</p>
    <button class="big newrun">Hunt again</button></div>`);
  s.querySelector('.newrun').onclick = () => title();
}
function gameOver() {
  audio.stopMusic();
  const s = screen('over lose', `<div class="titlewrap">
    <div class="logo small" style="color:#ff6b6b">THE WOOD TAKES YOU</div>
    <p class="blurb">Your hunt ends in the dark. The wood always wins, in the end.</p>
    <button class="big newrun">Begin a new hunt</button></div>`);
  s.querySelector('.newrun').onclick = () => title();
}

/* ---------------- boot ---------------- */
title();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
window.__mw = { get run() { return run; }, screen: null, showMap, travel, title, RELICS };
