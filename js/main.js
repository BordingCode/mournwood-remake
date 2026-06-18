// Mournwood — run orchestrator (Milestone 2). Branching map → node → resolve → map, with
// gold/relics/curses/camp/trader/events and auto-save + resume.
import { CombatScreen } from './ui/combat.js';
import { Audio } from './ui/audio.js';
import { renderMap } from './ui/map.js';
import { rewardScreen, campScreen, shopScreen, eventScreen, cacheScreen, deckOverlay, relicChoiceScreen } from './ui/nodes.js';
import { makeRun, loadRun, saveRun, clearSave, enemyIdsFor, reachable, advanceRegion, REGIONS, REGION_COUNT, ASCENSIONS, loadMeta, saveMeta, NODE } from './game/run.js';
import { RELICS } from './data/relics.js';
import { HUNTERS } from './data/hunters.js';
import { PACTS, PACT_IDS } from './data/pacts.js';
import { STATUSES } from './engine/statuses.js';
import { makeRng } from './engine/rng.js';
import { loadArtManifest, artLayer, bgImage, hunterArt } from './art.js';

const root = document.getElementById('app');
const audio = new Audio();
let run = null;

function screen(cls, html) { root.innerHTML = ''; const s = document.createElement('div'); s.className = 'screen ' + cls; s.innerHTML = html; root.append(s); return s; }

/* ---------------- title ---------------- */
function title() {
  audio.stopMusic();
  const saved = loadRun();
  const meta = loadMeta();
  const record = meta.wins > 0
    ? `Hunts won: <b>${meta.wins}</b> · Deepest: <b>${ASCENSIONS[Math.min(meta.maxAscension, ASCENSIONS.length - 1)].name}</b>`
    : (meta.runs > 0 ? `Hunts begun: <b>${meta.runs}</b> — the wood waits.` : 'No hunt yet. The wood waits.');
  const s = screen('title', `
    <div class="titlewrap">
      <div class="logo">MOURNWOOD</div>
      <div class="sub">a monster-hunter's descent</div>
      <p class="blurb">The wood is dying, and something at its heart is to blame.
      Read your prey, feed your hound, and cut a path to the dark.</p>
      ${saved ? '<button class="big continue">Continue the Hunt</button>' : ''}
      <button class="big ${saved ? 'ghostbig' : ''} newrun">${saved ? 'Abandon &amp; start anew' : 'Begin the Hunt'}</button>
      <button class="big ghostbig codexbtn">Codex</button>
      <p class="record">${record}</p>
      <p class="m1note">3 Hunters × 5 Pacts · 3 regions · The Hunt Deepens</p>
    </div>`);
  s.querySelector('.newrun').onclick = () => { audio.resume(); clearSave(); chooseHunter(); };
  s.querySelector('.codexbtn').onclick = () => { audio.resume(); codexScreen(title); };
  if (saved) s.querySelector('.continue').onclick = () => { audio.resume(); run = saved; showMap(); };
  bgImage(s, 'assets/ui/title.svg');
}

/* ---------------- hunter & pact selection ---------------- */
let pick = {};
function ascensionBar() {
  const meta = loadMeta();
  if (!meta.maxAscension) return ''; // hidden until you win once
  if (pick.ascension == null) pick.ascension = 0;
  pick.ascension = Math.max(0, Math.min(meta.maxAscension, pick.ascension));
  const a = ASCENSIONS[pick.ascension];
  return `<div class="ascbar">
    <div class="asclabel">The Hunt Deepens — unlocked to ${ASCENSIONS[Math.min(meta.maxAscension, ASCENSIONS.length - 1)].name}</div>
    <div class="ascctrl"><button class="ascb dn" ${pick.ascension <= 0 ? 'disabled' : ''}>◀</button>
      <span class="ascname"><b>${a.name}</b><small>${a.desc}</small></span>
      <button class="ascb up" ${pick.ascension >= meta.maxAscension ? 'disabled' : ''}>▶</button></div>
  </div>`;
}
function chooseHunter() {
  pick = { ascension: pick.ascension || 0 };
  const order = ['houndmaster', 'assassin', 'tinker'];
  const s = screen('select', `<div class="selwrap">
    <h2 class="seltitle">Choose your Hunter</h2>
    ${ascensionBar()}
    <div class="selcards">${order.map((id) => { const h = HUNTERS[id]; return `<button class="selcard" data-id="${id}">
      <span class="selemoji por">${artLayer(hunterArt(id), h.emoji)}</span><b>${h.name}</b><small>${h.tagline}</small>
      <span class="selhp">❤ ${h.maxHp} HP</span></button>`; }).join('')}</div>
    <button class="ghost selback">Back</button></div>`);
  const restep = (d) => { pick.ascension += d; chooseHunter(); };
  s.querySelector('.ascb.dn')?.addEventListener('click', () => restep(-1));
  s.querySelector('.ascb.up')?.addEventListener('click', () => restep(1));
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
    run = makeRun({ hunterId: pick.hunterId, pactId: pick.pactId, ascension: pick.ascension || 0 });
    const meta = loadMeta(); meta.runs++; saveMeta(meta);
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
    onCodex: () => codexScreen(showMap),
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
    mods: run.mods || {},
    hunterId: run.hunterId,
    region: run.region || 0,
  }, audio, (result, combat) => {
    if (result === 'lose') { clearSave(); return gameOver(combat); }
    // tally beasts felled this run (for the death/victory reflection line)
    run.beastsFelled = (run.beastsFelled || 0) + combat.enemies.filter((e) => e.hp <= 0).length;
    // persist hp + grown hound
    run.player.hp = combat.player.hp;
    if (run.hound && combat.hound) { run.hound.maxHp = combat.hound.maxHp; run.hound.atk = combat.hound.atk; }
    // gold reward
    let gold = 12 + node.r * 2 + rng.int(0, 6);
    if (node.type === NODE.elite) gold += 25;
    if (node.type === NODE.hunt) gold += 18;
    gold = Math.round(gold * (run.mods?.goldMul ?? 1));
    run.player.gold += gold;
    // post-combat heals (e.g. Bloodstone)
    run.player.relics.forEach((id) => { const h = RELICS[id]?.postCombatHeal; if (h) run.player.hp = Math.min(run.player.maxHp, run.player.hp + Math.ceil(h * (run.mods?.healMul ?? 1))); });
    saveRun(run);
    if (node.type === NODE.boss) return (run.region >= REGION_COUNT - 1) ? victory() : regionTransition();
    // Elites & Hunts grant a relic — but you PICK 1 of 3, then take the card spoils.
    if (node.type === NODE.elite || node.type === NODE.hunt) {
      return relicChoiceScreen(root, run, audio, () => { saveRun(run); rewardScreen(root, run, audio, afterNode); }, 41, `Spoils of a Great Hunt (+${gold} teeth)`);
    }
    rewardScreen(root, run, audio, afterNode);
  });
}

/* ---------------- between regions ---------------- */
const REGION_INTRO = [
  '', // entering region 0 has no transition
  'The Briar Mother falls, and Wealdedge is yours. The ground softens to black water underfoot — you wade down into <b>The Sloughfen</b>.',
  'The Fen-Maw chokes on its own mire. Ahead the trees blacken and weep sap like old blood — the <b>Blackheart</b> is close now.',
];
function regionTransition() {
  audio.fanfare(true);
  // A great-beast's relic: PICK 1 of 3 (before advancing — relic offers key off run.cleared).
  relicChoiceScreen(root, run, audio, () => regionTransitionPanel(), 99, '👑 The Great-Beast Falls — claim its relic');
}
function regionTransitionPanel() {
  const next = run.region + 1;
  const heal = Math.ceil(run.player.maxHp * 0.4 * (run.mods?.healMul ?? 1));
  run.player.hp = Math.min(run.player.maxHp, run.player.hp + heal);
  advanceRegion(run); saveRun(run);
  const r = REGIONS[next];
  const s = screen('node regiontrans', `<div class="titlewrap">
    <div class="logo small">${r.name}</div>
    <p class="sub">${r.sub}</p>
    <p class="blurb">${REGION_INTRO[next] || ''}</p>
    <p class="m1note">You bind your wounds (+${heal} HP).</p>
    <button class="big go">Descend ▾</button></div>`);
  s.querySelector('.go').onclick = () => showMap();
}

/* ---------------- end states ---------------- */
function victory() {
  clearSave(); audio.fanfare(true);
  // record the win + unlock the next Ascension
  const meta = loadMeta();
  meta.wins++; meta.bossesFelled += 3;
  meta.hunterWins[run.hunterId] = (meta.hunterWins[run.hunterId] || 0) + 1;
  const newlyUnlocked = (run.ascension + 1 > meta.maxAscension) && (run.ascension + 1 <= ASCENSIONS.length - 1);
  meta.maxAscension = Math.min(ASCENSIONS.length - 1, Math.max(meta.maxAscension, run.ascension + 1));
  saveMeta(meta);
  const unlockLine = newlyUnlocked
    ? `A deeper hunt opens: <b>${ASCENSIONS[run.ascension + 1].name}</b> — ${ASCENSIONS[run.ascension + 1].desc}`
    : `Hunts won: <b>${meta.wins}</b>.`;
  const s = screen('over win', `<div class="titlewrap">
    <div class="logo small">THE HEART-ROT IS UNMADE</div>
    <p class="blurb">The corruption at the wood's heart goes still at last. Mournwood will live — and so, against all odds, will you. The hunt is over.</p>
    <p class="record">${ASCENSIONS[run.ascension].name} cleared. ${unlockLine}</p>
    <button class="big newrun">Hunt again</button></div>`);
  s.querySelector('.newrun').onclick = () => title();
}
function gameOver(combat) {
  audio.stopMusic();
  // (a) cause of death — what landed the killing blow, and at what HP you stood
  const hit = combat && combat.lastPlayerHit;
  const cause = hit
    ? `Felled by <b>${hit.from}</b>${hit.move ? `'s ${hit.move}` : ''} — you stood at ${hit.hpBefore} HP.`
    : 'The dark took you before you saw what struck.';
  // (b) run reflection — how far you got, how many beasts you put down
  const regionName = (REGIONS[run.region] || REGIONS[0]).name;
  const felled = run.beastsFelled || 0;
  const reflect = `Reached <b>${regionName}</b> · ${felled} ${felled === 1 ? 'beast' : 'beasts'} felled.`;
  // (c) Hunt again — re-roll the SAME hunter + pact + ascension straight into a new run
  const again = { hunterId: run.hunterId, pactId: run.pactId, ascension: run.ascension || 0 };
  const ascName = ASCENSIONS[Math.min(again.ascension, ASCENSIONS.length - 1)].name;
  const s = screen('over lose', `<div class="titlewrap">
    <div class="logo small" style="color:#ff6b6b">THE WOOD TAKES YOU</div>
    <p class="blurb">${cause}</p>
    <p class="record">${reflect}</p>
    <button class="big newrun">Hunt again — ${HUNTERS[again.hunterId].name}${again.pactId ? ` · ${PACTS[again.pactId].name}` : ''}${again.ascension ? ` · ${ascName}` : ''}</button>
    <button class="big ghostbig changehunter">Change your hunt</button></div>`);
  s.querySelector('.newrun').onclick = () => {
    audio.resume(); clearSave();
    run = makeRun(again);
    const m = loadMeta(); m.runs++; saveMeta(m);
    saveRun(run); showMap();
  };
  s.querySelector('.changehunter').onclick = () => { pick = { ascension: again.ascension }; chooseHunter(); };
}

/* ---------------- codex (learn the hunt) ---------------- */
const TAG_INFO = [
  ['🩸', 'Bleed', 'Cutting damage. Beasts that bleed out are weak to it.'],
  ['🔥', 'Fire', 'Burning damage. Plants and rot wither under it.'],
  ['🔨', 'Blunt', 'Crushing damage. Armoured & undead foes are weak to it.'],
  ['🐾', 'Beast', 'Your hound and feral strikes. A primal damage type.'],
  ['⚙️', 'Machine', 'The Tinker’s contraptions. Tireless, mechanical damage.'],
];
const KEYWORDS = [
  ['The Hunt', 'Every monster shows a WEAKNESS (a damage type) — hit it with a matching card for +50% damage. Some show ARMOR, which softens each hit until you Break it. WARDED beasts (elites & great-beasts) shrug off every tag but their weakness — until you EXPOSE them, then any tag lands full.'],
  ['Bond & Feed (Houndmaster)', 'Feed cards & HP to grow your Hound into a monster. It strikes on its own — but losing it is a real setback.'],
  ['Combo (Assassin)', 'Every card you play builds a combo this turn. Finishers scale with how many cards you’ve chained — sequence matters.'],
  ['Contraptions (Tinker)', 'Deploy devices that act on their OWN at the start of every turn. Build a self-running machine.'],
  ['Pacts', 'Each run pairs your Hunter with one Pact — a themed mini-set of cards & relics, plus a starting relic.'],
  ['Block', 'Resets to 0 at the start of your turn (except the Tinker’s Grinder, which re-applies it each turn).'],
  ['The Hunt Deepens', 'Win a run to unlock the next Ascension — fixed, fair modifiers that make the wood deadlier.'],
];
function codexScreen(back) {
  const tags = TAG_INFO.map(([ic, n, d]) => `<div class="cdx"><span class="cdxic">${ic}</span><div><b>${n}</b><small>${d}</small></div></div>`).join('');
  const statuses = Object.keys(STATUSES).map((id) => { const s = STATUSES[id]; return `<div class="cdx"><span class="cdxic">${s.icon}</span><div><b>${s.name}</b><small>${s.desc}</small></div></div>`; }).join('');
  const kw = KEYWORDS.map(([n, d]) => `<div class="cdx"><div><b>${n}</b><small>${d}</small></div></div>`).join('');
  const s = screen('codex', `<div class="codexwrap">
    <h2 class="seltitle">Codex</h2>
    <h3 class="cdxh">Damage types (the Hunt)</h3>${tags}
    <h3 class="cdxh">Statuses</h3>${statuses}
    <h3 class="cdxh">Keywords</h3>${kw}
    <p class="credits">Art: icons from <b>game-icons.net</b> (CC BY 3.0), recoloured for Mournwood.</p>
    <button class="big back">Back</button></div>`);
  s.querySelector('.back').onclick = () => back();
}

/* ---------------- boot ---------------- */
loadArtManifest().finally(title);
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
window.__mw = { get run() { return run; }, screen: null, showMap, travel, title, RELICS };
