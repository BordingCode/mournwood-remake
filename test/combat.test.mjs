// Headless engine checks (no DOM, no browser). Run: node test/combat.test.mjs
import { Combat } from '../js/engine/combat.js';
import { makeRng } from '../js/engine/rng.js';
import { HUNTERS } from '../js/data/hunters.js';
import { PACTS, PACT_IDS } from '../js/data/pacts.js';
import { makeRun } from '../js/game/run.js';
import { amt, addStatus } from '../js/engine/statuses.js';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.log('  ✗ FAIL:', name); } };

function newCombat(enemyIds, seed = 1) {
  const h = HUNTERS.houndmaster;
  return new Combat({
    rng: makeRng(seed),
    player: { name: h.name, maxHp: h.maxHp, deck: h.startDeck.slice() },
    hound: { ...h.hound },
    enemyIds,
  }).start();
}

// 1. The Hunt: weakness gives +50%, wrong tag does not.
{
  const c = newCombat(['gloomwolf']); // weakTo bleed
  const e = c.enemies[0];
  ok('weakness +50% (bleed vs bleed-weak)', c.computeDamage(c.player, e, 10, { tag: 'bleed' }) === 15);
  ok('no bonus for wrong tag', c.computeDamage(c.player, e, 10, { tag: 'blunt' }) === 10);
}

// 2. Armor reduces each attack hit; Break lowers armor.
{
  const c = newCombat(['bonehusk']); // armor 3
  const e = c.enemies[0]; const hp0 = e.hp;
  c.attack(c.player, e, 10, { tag: 'x' });
  ok('armor reduces hit by 3 (10 -> 7)', e.hp === hp0 - 7);
  e.armor = 3; const hp1 = e.hp;
  c.runOp({ k: 'break', amount: 3 }, { tag: 'blunt' }, e);
  ok('break removes armor', e.armor === 0);
  c.attack(c.player, e, 10, { tag: 'x' });
  ok('no armor after break (full 10)', e.hp === hp1 - 10);
}

// 3. Gut detonates Bleed: damage = 2 × target bleed.
{
  const c = newCombat(['mireling']);
  const e = c.enemies[0]; const hp0 = e.hp;
  addStatus(e, 'bleed', 5);
  c.runOp({ k: 'damage', fromTargetStatus: { status: 'bleed', per: 2 } }, { tag: 'bleed' }, e);
  // mireling has no weakTo, no armor → expect exactly 10
  ok('Gut deals 2x bleed (10)', e.hp === hp0 - 10);
}

// 4. Feed grows the Hound permanently.
{
  const c = newCombat(['mireling']);
  const a0 = c.hound.atk, hp0 = c.hound.maxHp;
  c.runOp({ k: 'feedHound', atk: 3, hp: 4 }, {}, null);
  ok('feed +3 atk', c.hound.atk === a0 + 3);
  ok('feed +4 max hp', c.hound.maxHp === hp0 + 4);
}

// 5. Hound strikes at end of turn.
{
  const c = newCombat(['mireling']);
  const e = c.enemies[0]; const hp0 = e.hp; const atk = c.hound.atk;
  c.endTurn();
  ok('hound hit enemy at end of turn', e.hp <= hp0 - 1 && e.hp >= hp0 - atk - 5);
}

// 6. Maul targets the Hound, and downing it flips alive=false.
{
  const c = newCombat(['gloomwolf']);
  c.hound.hp = 3;
  const e = c.enemies[0];
  c.enemyHit(e, c.hound, 20);
  ok('hound can be downed', c.hound.alive === false && c.hound.hp === 0);
  c.runOp({ k: 'healHound', amount: 10 }, {}, null);
  ok('mend revives the hound', c.hound.alive === true && c.hound.hp === 10);
}

// ---- M3: combo, contraptions, poison, thorns ----
function runCombatFor(hunterId, pactId, enemyIds, seed = 1) {
  const run = makeRun({ hunterId, pactId, seed });
  return new Combat({
    rng: makeRng(seed + 1),
    player: { name: run.player.name, maxHp: run.player.maxHp, deck: run.player.deck.slice(), relics: run.player.relics.slice() },
    hound: run.hound ? { ...run.hound } : null,
    enemyIds,
  }).start();
}

// 7. Combo: perCombo scaling reads cardsThisTurn.
{
  const c = runCombatFor('assassin', 'mist', ['mireling']);
  c.cardsThisTurn = 3;
  ok('perCombo: base 4 + 2×3 = 10', c.resolveVal({ base: 4, perCombo: 2 }) === 10);
  c.cardsThisTurn = 0;
  ok('perCombo at 0 combo = base', c.resolveVal({ base: 4, perCombo: 2 }) === 4);
  // combo-gated `if`
  const e = c.enemies[0]; const hp0 = e.hp; c.cardsThisTurn = 4;
  c.runOp({ k: 'if', combo: 4, then: [{ k: 'damage', amount: 5 }] }, { tag: 'x' }, e);
  ok('if combo>=4 fires', e.hp === hp0 - 5);
  const hp1 = e.hp; c.cardsThisTurn = 2;
  c.runOp({ k: 'if', combo: 4, then: [{ k: 'damage', amount: 5 }] }, { tag: 'x' }, e);
  ok('if combo>=4 blocked at 2', e.hp === hp1);
  // firstCard
  const hp2 = e.hp; c.cardsThisTurn = 1;
  c.runOp({ k: 'if', firstCard: true, then: [{ k: 'damage', amount: 3 }] }, { tag: 'x' }, e);
  ok('if firstCard fires at combo 1', e.hp === hp2 - 3);
}

// 8. Contraptions: deploy + tick acts on its own; perContraption scales.
{
  const c = runCombatFor('tinker', 'iron', ['mireling']);
  const before = c.contraptions.length;
  c.runOp({ k: 'deploy', dep: 'turret', value: 5 }, {}, null);
  ok('deploy adds a contraption', c.contraptions.length === before + 1);
  const e = c.enemies[0]; const hp0 = e.hp;
  c.tickContraptions();
  ok('turret strikes on tick', e.hp < hp0);
  ok('perContraption scales', c.resolveVal({ base: 4, perContraption: 3 }) === 4 + 3 * c.contraptions.length);
  // grinder gives block on tick
  c.runOp({ k: 'deploy', dep: 'grinder', value: 6 }, {}, null);
  const blk0 = c.player.block; c.tickContraptions();
  ok('grinder grants block on tick', c.player.block >= blk0 + 6);
}

// 9. Poison (Rot) ticks like a DoT and decays by 1.
{
  const c = newCombat(['mireling']);
  const e = c.enemies[0]; const hp0 = e.hp;
  addStatus(e, 'poison', 4);
  c.tickDot(e);
  ok('poison deals 4', e.hp === hp0 - 4);
  ok('poison decays to 3', amt(e, 'poison') === 3);
}

// 10. Thorns retaliates when the player is struck.
{
  const c = newCombat(['gloomwolf']);
  const e = c.enemies[0]; const ehp0 = e.hp;
  addStatus(c.player, 'thorns', 3);
  c.enemyHit(e, c.player, 5);
  ok('thorns deals 3 back to attacker', e.hp === ehp0 - 3);
}

// 11. Fuzzer across all 3 hunters × all pacts: no crashes, combats terminate.
{
  let crashes = 0, stuck = 0, games = 0;
  const hunters = ['houndmaster', 'assassin', 'tinker'];
  for (const hid of hunters) for (const pid of PACT_IDS) for (let s = 0; s < 6; s++) {
    games++;
    try {
      const enemies = s % 3 === 0 ? ['gloomwolf', 'thornwretch'] : s % 3 === 1 ? ['bonehusk'] : ['hollowstag'];
      const c = runCombatFor(hid, pid, enemies, s * 13 + 5);
      let guard = 0;
      while (!c.over && guard++ < 600) {
        const playable = c.hand.filter((card) => !card.unplayable && card.cost <= c.player.energy);
        if (playable.length && c.rng.chance(0.85)) {
          const card = c.rng.pick(playable);
          const tgt = (card.target === 'enemy') ? c.rng.pick(c.livingEnemies()) : null;
          c.play(card.uid, tgt ? tgt.uid : null);
        } else c.endTurn();
      }
      if (!c.over) stuck++;
    } catch (err) { crashes++; if (crashes <= 3) console.log('   fuzz error:', hid, pid, err.message); }
  }
  ok(`hunter×pact fuzzer: no crashes in ${games} runs`, crashes === 0);
  ok('hunter×pact fuzzer: all terminate', stuck === 0);
}

// 12. Legacy fuzzer: random valid plays never crash and combats terminate.
{
  let crashes = 0, stuck = 0;
  for (let s = 0; s < 80; s++) {
    try {
      const c = newCombat(s % 3 === 0 ? ['gloomwolf', 'thornwretch'] : s % 3 === 1 ? ['bonehusk'] : ['hollowstag'], s + 7);
      let guard = 0;
      while (!c.over && guard++ < 400) {
        const playable = c.hand.filter((card) => !card.unplayable && card.cost <= c.player.energy);
        if (playable.length && c.rng.chance(0.8)) {
          const card = c.rng.pick(playable);
          const tgt = card.target === 'enemy' ? c.rng.pick(c.livingEnemies()) : null;
          c.play(card.uid, tgt ? tgt.uid : null);
        } else {
          c.endTurn();
        }
      }
      if (!c.over) stuck++;
    } catch (err) { crashes++; if (crashes <= 2) console.log('   fuzz error:', err.message); }
  }
  ok('fuzzer: no crashes in 80 runs', crashes === 0);
  ok('fuzzer: all combats terminate', stuck === 0);
}

console.log(`\n${fail === 0 ? '✅' : '❌'} combat tests: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
