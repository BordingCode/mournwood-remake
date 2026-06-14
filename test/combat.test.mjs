// Headless engine checks (no DOM, no browser). Run: node test/combat.test.mjs
import { Combat } from '../js/engine/combat.js';
import { makeRng } from '../js/engine/rng.js';
import { HUNTERS } from '../js/data/hunters.js';
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

// 7. Fuzzer: random valid plays never crash and combats terminate.
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
