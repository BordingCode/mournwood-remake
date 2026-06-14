// Branching node-map screen. Descend top→bottom; tap a reachable node to travel. SVG edges.
import { reachable, NODE_META } from '../game/run.js';
import { RELICS } from '../data/relics.js';

const REGION_NAME = ['Wealdedge', 'The Sloughfen', 'The Blackheart'];
const ROW_H = 82, PAD = 30, NODE_R = 24;

export function renderMap(root, run, { onPick, onDeck }) {
  root.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'mapscreen';

  // top HUD
  const hud = document.createElement('div'); hud.className = 'maphud';
  const relicIcons = run.player.relics.map((id) => `<span class="rel" title="${RELICS[id]?.name || id}">${RELICS[id]?.icon || '◆'}</span>`).join('');
  hud.innerHTML = `<div class="region">${REGION_NAME[run.region] || 'The Wood'}</div>
    <div class="stats"><span>❤ ${run.player.hp}/${run.player.maxHp}</span><span>🪙 ${run.player.gold}</span>
    <span class="relics">${relicIcons || '<i>no relics</i>'}</span><button class="deckbtn">🂠 ${run.player.deck.length}</button></div>`;
  wrap.append(hud);
  hud.querySelector('.deckbtn').onclick = () => onDeck && onDeck();

  // map canvas
  const w = root.clientWidth || window.innerWidth || 380;
  const cols = 4;
  const board = document.createElement('div'); board.className = 'mapboard';
  const rows = run.map.rows + 1; // + boss row
  const height = rows * ROW_H + PAD * 2;
  board.style.height = height + 'px';

  const xOf = (c) => PAD + (c + 0.5) * ((w - PAD * 2) / cols);
  const yOf = (r) => PAD + r * ROW_H;

  // edges (SVG)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'mapedges'); svg.setAttribute('width', w); svg.setAttribute('height', height);
  const reach = new Set(reachable(run).map((n) => n.id));
  Object.values(run.map.nodes).forEach((n) => {
    n.next.forEach((nx) => {
      const t = run.map.nodes[nx]; if (!t) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', xOf(n.c)); line.setAttribute('y1', yOf(n.r));
      line.setAttribute('x2', xOf(t.c)); line.setAttribute('y2', yOf(t.r));
      const live = (run.node === n.id || (!run.node && n.r === 0)) && reach.has(nx);
      line.setAttribute('class', live ? 'edge live' : 'edge');
      svg.append(line);
    });
  });
  board.append(svg);

  // nodes
  Object.values(run.map.nodes).forEach((n) => {
    const meta = NODE_META[n.type];
    const b = document.createElement('button');
    const isReach = reach.has(n.id);
    const isCleared = run.cleared.includes(n.id);
    const isCurrent = run.node === n.id;
    b.className = `mapnode t-${n.type}${isReach ? ' reach' : ''}${isCleared ? ' cleared' : ''}${isCurrent ? ' current' : ''}`;
    b.style.left = (xOf(n.c) - NODE_R) + 'px';
    b.style.top = (yOf(n.r) - NODE_R) + 'px';
    b.innerHTML = `<span class="ic">${meta.icon}</span>`;
    b.title = meta.label;
    if (isReach) b.onclick = () => onPick(n);
    else b.disabled = true;
    board.append(b);
    // label under boss / special
    if (n.type === 'boss' || n.type === 'hunt' || n.type === 'shop' || n.type === 'rest') {
      const lab = document.createElement('div'); lab.className = 'maplabel';
      lab.style.left = xOf(n.c) + 'px'; lab.style.top = (yOf(n.r) + NODE_R + 1) + 'px';
      lab.textContent = meta.label; board.append(lab);
    }
  });

  wrap.append(board);
  root.append(wrap);

  // scroll to the action (first reachable node)
  const firstReach = reachable(run)[0];
  if (firstReach) board.parentElement.scrollTop = Math.max(0, yOf(firstReach.r) - 160);
}
