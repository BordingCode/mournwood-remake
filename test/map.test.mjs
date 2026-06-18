// Headless map-generation checks. Run: node test/map.test.mjs
import { generateMap, nodePreview, makeRun, REGIONS } from '../js/game/run.js';
import { makeRng } from '../js/engine/rng.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', n); } };

function bossReachable(map) {
  const seen = new Set(map.starts); const q = [...map.starts];
  while (q.length) { const k = q.shift(); if (k === 'boss') return true; for (const nx of map.nodes[k].next) if (!seen.has(nx)) { seen.add(nx); q.push(nx); } }
  return false;
}

for (let s = 0; s < 40; s++) {
  const map = generateMap(makeRng(1000 + s));
  const ns = Object.values(map.nodes);
  ok('has starts', map.starts.length >= 1);
  ok('boss exists', !!map.nodes.boss);
  ok('boss reachable from a start', bossReachable(map));
  ok('all non-boss nodes have an outgoing edge', ns.filter((n) => n.id !== 'boss').every((n) => n.next.length >= 1));
  ok('row 0 all combat', ns.filter((n) => n.r === 0).every((n) => n.type === 'combat'));
  ok('top content row all rest (camp before boss)', ns.filter((n) => n.r === map.rows - 1).every((n) => n.type === 'rest'));
  ok('has at least one shop', ns.some((n) => n.type === 'shop'));
  ok('has a hunt node', ns.some((n) => n.type === 'hunt'));
}

// node previews: every reachable node gets a non-empty, deterministic one-liner.
{
  const run = makeRun({ hunterId: 'houndmaster', pactId: 'moon', region: 0, seed: 7 });
  let allPreviewed = true, deterministic = true;
  for (const n of Object.values(run.map.nodes)) {
    const p1 = nodePreview(run, n), p2 = nodePreview(run, n);
    if (!p1) allPreviewed = false;
    if (p1 !== p2) deterministic = false;
  }
  ok('every node has a preview line', allPreviewed);
  ok('node preview is deterministic', deterministic);
  const elite = Object.values(run.map.nodes).find((n) => n.type === 'elite');
  if (elite) ok('elite preview mentions the relic drop', /relic/.test(nodePreview(run, elite)));
  ok('boss preview mentions the great-beast', /great-beast/.test(nodePreview(run, run.map.nodes.boss)));
  // a warded region-2 elite surfaces "Expose" in its preview
  const r2 = makeRun({ hunterId: 'assassin', region: 1, seed: 3 });
  const e2 = Object.values(r2.map.nodes).find((n) => n.type === 'elite');
  if (e2 && REGIONS[1].elite === 'mirewidow') ok('warded elite preview says Expose', /Expose/.test(nodePreview(r2, e2)));
}

// determinism
const a = JSON.stringify(generateMap(makeRng(42)));
const b = JSON.stringify(generateMap(makeRng(42)));
ok('same seed -> identical map', a === b);

console.log(`\n${fail === 0 ? '✅' : '❌'} map tests: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
