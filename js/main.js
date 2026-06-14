// Mournwood — Milestone 1 boot: a mini-gauntlet that proves the core combat (Houndmaster +
// the Hunt/weakness system + bond-fed hound + synergy), with a card pick between fights.
import { makeRng, hashSeed } from './engine/rng.js';
import { HUNTERS } from './data/hunters.js';
import { CARDS } from './data/cards.js';
import { ENEMIES } from './data/enemies.js';
import { CombatScreen } from './ui/combat.js';
import { Audio } from './ui/audio.js';

const root = document.getElementById('app');
const audio = new Audio();

const ENCOUNTERS = [
  ['thornwretch'],                 // intro — fire-weak
  ['gloomwolf', 'mireling'],       // bleed-weak beast + a debuffer; gloomwolf mauls your Hound
  ['bonehusk'],                    // armored — Break it
  ['hollowstag'],                  // elite — charge + mauls the Hound
  ['briarmother'],                 // great-beast boss — phases shift its weakness
];

let run = null;
function newRun() {
  const h = HUNTERS.houndmaster;
  run = {
    seed: (Date.now() & 0xffffff),
    player: { name: h.name, maxHp: h.maxHp, hp: h.maxHp, deck: h.startDeck.slice() },
    hound: { name: h.hound.name, maxHp: h.hound.maxHp, hp: h.hound.maxHp, atk: h.hound.atk },
    idx: 0,
  };
}

/* ---------------- screens ---------------- */
function screen(cls, html) { root.innerHTML = ''; const s = document.createElement('div'); s.className = 'screen ' + cls; s.innerHTML = html; root.append(s); return s; }

function title() {
  audio.stopMusic();
  const s = screen('title', `
    <div class="titlewrap">
      <div class="logo">MOURNWOOD</div>
      <div class="sub">a monster-hunter's descent</div>
      <p class="blurb">The wood is dying, and something at its heart is to blame.
      Read your prey, feed your hound, and cut a path to the dark.</p>
      <button class="big">Begin the Hunt</button>
      <p class="m1note">Milestone 1 · Houndmaster · a 5-fight gauntlet to the Briar Mother</p>
    </div>`);
  s.querySelector('.big').onclick = () => { audio.resume(); newRun(); startFight(); };
}

function startFight() {
  const ids = ENCOUNTERS[run.idx];
  const rng = makeRng(run.seed + run.idx * 1000);
  // fresh hound HP each fight, but keep grown atk/maxHp (the bond carries)
  run.hound.hp = run.hound.maxHp;
  screen('combat', '');
  const host = root.querySelector('.combat');
  window.__mw.screen = new CombatScreen(host, {
    rng,
    player: { name: run.player.name, maxHp: run.player.maxHp, hp: run.player.hp, deck: run.player.deck.slice() },
    hound: { name: run.hound.name, maxHp: run.hound.maxHp, hp: run.hound.hp, atk: run.hound.atk },
    enemyIds: ids,
  }, audio, (result, combat) => onFightEnd(result, combat));
}

function onFightEnd(result, combat) {
  if (result === 'lose') { gameOver(); return; }
  // persist hp + the grown hound
  run.player.hp = combat.player.hp;
  run.hound.maxHp = combat.hound.maxHp; run.hound.atk = combat.hound.atk;
  run.idx++;
  if (run.idx >= ENCOUNTERS.length) { victory(); return; }
  // small camp heal, then a card pick
  run.player.hp = Math.min(run.player.maxHp, run.player.hp + 8);
  reward();
}

function reward() {
  const rng = makeRng(run.seed + run.idx * 31 + 7);
  const pool = HUNTERS.houndmaster.pool.slice();
  const picks = rng.shuffle(pool).slice(0, 3);
  const next = ENCOUNTERS[run.idx];
  const s = screen('reward', `
    <h2>The hunt continues</h2>
    <p class="next">Next: ${next.map((id) => ENEMIES[id]?.name || id).join(', ')} ${run.idx === ENCOUNTERS.length - 1 ? '— the great-beast boss!' : ''}</p>
    <p class="hp">❤ ${run.player.hp}/${run.player.maxHp} · 🐕 ${run.hound.name} ⚔${run.hound.atk}</p>
    <p class="choose">Choose a card for your deck:</p>
    <div class="rewardcards"></div>
    <button class="skip">Skip (stay lean)</button>`);
  const wrap = s.querySelector('.rewardcards');
  picks.forEach((id) => {
    const c = CARDS[id];
    const card = document.createElement('div');
    card.className = `card type-${c.type}`;
    card.innerHTML = `<div class="cost">${c.cost}</div><div class="cname">${c.name}</div>
      <div class="ctype">${c.type}${c.tag ? ' · ' + c.tag : ''}</div><div class="ctext">${c.text}</div>`;
    card.onclick = () => { run.player.deck.push(id); audio.card(); startFight(); };
    wrap.append(card);
  });
  s.querySelector('.skip').onclick = () => startFight();
}

function victory() {
  audio.fanfare(true);
  const s = screen('over win', `
    <div class="titlewrap">
      <div class="logo small">THE BRIAR MOTHER FALLS</div>
      <p class="blurb">You stand over the great-beast as the wood goes quiet.
      The hunt is far from over — but tonight, you are the predator.</p>
      <p class="m1note">That's Milestone 1. Next: the branching region map, the Trader, relics & Pacts.</p>
      <button class="big">Hunt again</button>
    </div>`);
  s.querySelector('.big').onclick = () => title();
}

function gameOver() {
  const s = screen('over lose', `
    <div class="titlewrap">
      <div class="logo small" style="color:#ff6b6b">THE WOOD TAKES YOU</div>
      <p class="blurb">Your hunt ends in the dark. The wood always wins, in the end.</p>
      <button class="big">Try again</button>
    </div>`);
  s.querySelector('.big').onclick = () => title();
}

title();

// offline app
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));

window.__mw = { get run() { return run; }, HUNTERS, CARDS, screen: null, startFight, title };
