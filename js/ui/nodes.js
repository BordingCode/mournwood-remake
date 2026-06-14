// Non-combat node screens: card reward, Trader (shop), Camp (rest), Omen (event), Cache, deck viewer.
import { CARDS, instantiate, canUpgrade } from '../data/cards.js';
import { HUNTERS } from '../data/hunters.js';
import { RELICS, RELIC_POOL } from '../data/relics.js';
import { makeRng } from '../engine/rng.js';

const PRICE = { card: 48, relic: 130, remove: 55 };
function screen(root, cls, html) { root.innerHTML = ''; const s = document.createElement('div'); s.className = 'screen node ' + cls; s.innerHTML = html; root.append(s); return s; }
function rngFor(run, salt) { return makeRng(run.seed + run.cleared.length * 1000 + salt); }
function poolFor(run) { return HUNTERS[run.hunterId].pool; }
function unownedRelics(run, rng, n) { return rng.shuffle(RELIC_POOL.filter((id) => !run.player.relics.includes(id))).slice(0, n); }

export function cardHtml(spec, extra = '') {
  const up = spec.endsWith('+'); const c = CARDS[up ? spec.slice(0, -1) : spec];
  const t = up && c.up ? { ...c, ...c.up } : c;
  return `<div class="card type-${c.type}" data-spec="${spec}">
    <div class="cost">${t.cost}</div><div class="cname">${c.name}${up ? '+' : ''}</div>
    <div class="ctype">${c.type}${c.tag ? ' · ' + c.tag : ''}</div><div class="ctext">${t.text}</div>${extra}</div>`;
}
function relicHtml(id, extra = '') { const r = RELICS[id]; return `<div class="relictile" data-id="${id}"><span class="ric">${r.icon}</span><b>${r.name}</b><small>${r.desc}</small>${extra}</div>`; }

/* ---------------- card reward ---------------- */
export function rewardScreen(root, run, audio, onDone) {
  const rng = rngFor(run, 7);
  const picks = rng.shuffle(poolFor(run).slice()).slice(0, 3);
  const s = screen(root, 'reward', `<h2>Spoils of the Hunt</h2><p class="sub">Choose a card for your pack.</p>
    <div class="cardrow">${picks.map((id) => cardHtml(id)).join('')}</div>
    <button class="ghost skip">Skip (stay lean)</button>`);
  s.querySelectorAll('.card').forEach((elc) => elc.onclick = () => { run.player.deck.push(elc.dataset.spec); audio.card(); onDone(); });
  s.querySelector('.skip').onclick = () => onDone();
}

/* ---------------- camp / rest ---------------- */
export function campScreen(root, run, audio, onDone) {
  const heal = Math.ceil(run.player.maxHp * 0.3);
  const s = screen(root, 'camp', `<h2>🔥 Camp</h2><p class="sub">The fire burns low. Rest, or sharpen a blade.</p>
    <div class="campopts">
      <button class="campbtn rest">Rest<small>Heal ${heal} HP</small></button>
      <button class="campbtn sharpen">Sharpen<small>Upgrade a card</small></button>
    </div>`);
  s.querySelector('.rest').onclick = () => { run.player.hp = Math.min(run.player.maxHp, run.player.hp + heal); audio.card(); onDone(); };
  s.querySelector('.sharpen').onclick = () => upgradeChooser(root, run, audio, onDone);
}
function upgradeChooser(root, run, audio, onDone) {
  const idxs = run.player.deck.map((sp, i) => ({ sp, i })).filter((x) => canUpgrade(x.sp));
  if (!idxs.length) { run.player.hp = Math.min(run.player.maxHp, run.player.hp + Math.ceil(run.player.maxHp * 0.3)); onDone(); return; }
  const s = screen(root, 'camp', `<h2>Sharpen a card</h2><p class="sub">Tap a card to upgrade it.</p>
    <div class="cardrow wrap">${idxs.map((x) => cardHtml(x.sp, `<div class="up">→ ${(CARDS[x.sp].up.text)}</div>`).replace('data-spec="' + x.sp + '"', 'data-i="' + x.i + '"')).join('')}</div>
    <button class="ghost back">Back</button>`);
  s.querySelectorAll('.card').forEach((elc) => elc.onclick = () => { const i = +elc.dataset.i; run.player.deck[i] = run.player.deck[i] + '+'; audio.card(); onDone(); });
  s.querySelector('.back').onclick = () => campScreen(root, run, audio, onDone);
}

/* ---------------- trader / shop ---------------- */
export function shopScreen(root, run, audio, onDone) {
  const rng = rngFor(run, 13);
  const cards = rng.shuffle(poolFor(run).slice()).slice(0, 3);
  const relics = unownedRelics(run, rng, 2);
  if (!run._shopBought) run._shopBought = {};
  const s = screen(root, 'shop', `<h2>⚖️ The Trader</h2><p class="sub">🪙 <b class="gold">${run.player.gold}</b> teeth</p>
    <h3>Cards</h3><div class="cardrow shoprow">${cards.map((id, i) => cardHtml(id, `<div class="price ${run.player.gold >= PRICE.card ? '' : 'cant'}">🪙 ${PRICE.card}</div>`).replace('class="card', `data-slot="c${i}" class="card`)).join('')}</div>
    <h3>Relics</h3><div class="relicrow">${relics.map((id, i) => relicHtml(id, `<div class="price ${run.player.gold >= PRICE.relic ? '' : 'cant'}">🪙 ${PRICE.relic}</div>`).replace('class="relictile', `data-slot="r${i}" class="relictile`)).join('')}</div>
    <div class="services"><button class="svc remove">Remove a card<small>🪙 ${PRICE.remove}</small></button></div>
    <button class="ghost leave">Leave</button>`);
  const refresh = () => shopScreen(root, run, audio, onDone);
  s.querySelectorAll('.card').forEach((elc, i) => elc.onclick = () => {
    const slot = elc.dataset.slot; if (run._shopBought[slot]) return;
    if (run.player.gold < PRICE.card) { audio.block(); return; }
    run.player.gold -= PRICE.card; run.player.deck.push(elc.dataset.spec); run._shopBought[slot] = 1; audio.card(); refresh();
  });
  s.querySelectorAll('.relictile').forEach((elc) => elc.onclick = () => {
    const slot = elc.dataset.slot; if (run._shopBought[slot]) return;
    if (run.player.gold < PRICE.relic) { audio.block(); return; }
    run.player.gold -= PRICE.relic; run.player.relics.push(elc.dataset.id); run._shopBought[slot] = 1; audio.card(); refresh();
  });
  s.querySelector('.remove').onclick = () => { if (run.player.gold < PRICE.remove) { audio.block(); return; } removeChooser(root, run, audio, onDone); };
  s.querySelector('.leave').onclick = () => { run._shopBought = null; onDone(); };
}
function removeChooser(root, run, audio, onDone) {
  const s = screen(root, 'shop', `<h2>Remove a card</h2><p class="sub">🪙 ${PRICE.remove} — pick a card to burn.</p>
    <div class="cardrow wrap">${run.player.deck.map((sp, i) => cardHtml(sp).replace('data-spec="' + sp + '"', 'data-i="' + i + '"')).join('')}</div>
    <button class="ghost back">Back</button>`);
  s.querySelectorAll('.card').forEach((elc) => elc.onclick = () => { run.player.gold -= PRICE.remove; run.player.deck.splice(+elc.dataset.i, 1); audio.card(); shopScreen(root, run, audio, onDone); });
  s.querySelector('.back').onclick = () => shopScreen(root, run, audio, onDone);
}

/* ---------------- omen events ---------------- */
const EVENTS = [
  { title: 'A Shrine of Bone', text: 'Antlers and finger-bones, lashed into a crude idol. It watches.',
    choices: [
      { label: 'Pray', desc: 'Heal 12 HP', apply: (run) => { run.player.hp = Math.min(run.player.maxHp, run.player.hp + 12); } },
      { label: 'Desecrate', desc: 'Gain a relic, but take a Curse', apply: (run, rng) => { const r = unownedRelics(run, rng, 1)[0]; if (r) run.player.relics.push(r); run.player.deck.push('ashdoubt'); } },
    ] },
  { title: 'The Black Spring', text: 'Dark water bubbles from the roots. It smells of iron.',
    choices: [
      { label: 'Drink deep', desc: 'Heal 20% — or worse', apply: (run, rng) => { if (rng.chance(0.7)) run.player.hp = Math.min(run.player.maxHp, run.player.hp + Math.ceil(run.player.maxHp * 0.2)); else { run.player.hp = Math.max(1, run.player.hp - 6); run.player.deck.push('taint'); } } },
      { label: 'Fill a flask', desc: 'Gain 35 teeth', apply: (run) => { run.player.gold += 35; } },
    ] },
  { title: 'Old Trap-line', text: 'A hunter came before you. Their snares are still set — and sprung.',
    choices: [
      { label: 'Salvage the iron', desc: 'Gain a relic', apply: (run, rng) => { const r = unownedRelics(run, rng, 1)[0]; if (r) run.player.relics.push(r); } },
      { label: 'Take their teeth', desc: 'Gain 45 teeth', apply: (run) => { run.player.gold += 45; } },
    ] },
  { title: 'The Wounded Stag', text: 'A great stag lies broken in the bracken, breathing its last.',
    choices: [
      { label: 'Feed it to the Hound', desc: 'Hound +3 attack (permanent)', apply: (run) => { run.hound.atk += 3; } },
      { label: 'A clean mercy', desc: 'Heal 16 HP', apply: (run) => { run.player.hp = Math.min(run.player.maxHp, run.player.hp + 16); } },
    ] },
];
export function eventScreen(root, run, audio, onDone) {
  const rng = rngFor(run, 23);
  const ev = rng.pick(EVENTS);
  const s = screen(root, 'event', `<h2>${ev.title}</h2><p class="story">${ev.text}</p>
    <div class="choices">${ev.choices.map((ch, i) => `<button class="choice" data-i="${i}">${ch.label}<small>${ch.desc}</small></button>`).join('')}</div>`);
  s.querySelectorAll('.choice').forEach((b) => b.onclick = () => {
    const ch = ev.choices[+b.dataset.i]; ch.apply(run, rng); audio.card();
    s.innerHTML = `<h2>${ev.title}</h2><p class="story">${ch.desc} — done.</p><button class="big2 cont">Onward</button>`;
    s.querySelector('.cont').onclick = () => onDone();
  });
}

/* ---------------- cache ---------------- */
export function cacheScreen(root, run, audio, onDone) {
  const rng = rngFor(run, 31);
  const opts = [];
  const relic = unownedRelics(run, rng, 1)[0];
  if (relic) opts.push({ kind: 'relic', id: relic, label: RELICS[relic].name, desc: RELICS[relic].desc, icon: RELICS[relic].icon });
  opts.push({ kind: 'gold', amt: 40, label: '40 teeth', desc: 'Cold, hard currency.', icon: '🪙' });
  opts.push({ kind: 'card', label: 'A card', desc: 'Take one of the hunt’s tools.', icon: '🂠' });
  const s = screen(root, 'cache', `<h2>📦 A Cache</h2><p class="sub">A cache half-buried in the loam. Take one:</p>
    <div class="cacheopts">${opts.map((o, i) => `<button class="cacheopt" data-i="${i}"><span class="cic">${o.icon}</span><b>${o.label}</b><small>${o.desc}</small></button>`).join('')}</div>`);
  s.querySelectorAll('.cacheopt').forEach((b) => b.onclick = () => {
    const o = opts[+b.dataset.i]; audio.card();
    if (o.kind === 'relic') { run.player.relics.push(o.id); onDone(); }
    else if (o.kind === 'gold') { run.player.gold += o.amt; onDone(); }
    else rewardScreen(root, run, audio, onDone);
  });
}

/* ---------------- deck viewer ---------------- */
export function deckOverlay(root, run, onClose) {
  const ov = document.createElement('div'); ov.className = 'deckov';
  const counts = {}; run.player.deck.forEach((sp) => counts[sp] = (counts[sp] || 0) + 1);
  ov.innerHTML = `<div class="deckpanel"><h2>Your Pack (${run.player.deck.length})</h2>
    <div class="cardrow wrap">${Object.keys(counts).map((sp) => cardHtml(sp, counts[sp] > 1 ? `<div class="xn">×${counts[sp]}</div>` : '')).join('')}</div>
    <button class="big2 close">Close</button></div>`;
  ov.querySelector('.close').onclick = () => ov.remove();
  ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
  root.append(ov);
}
