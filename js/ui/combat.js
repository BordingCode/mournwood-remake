// Combat screen — phone portrait. Persistent DOM nodes per entity (so juice anchors correctly),
// tap-to-target, tap-to-inspect. Builds the Combat with juice hooks bound here.
import { Combat } from '../engine/combat.js';
import { STATUSES } from '../engine/statuses.js';
import { artLayer, bgImage, enemyArt, cardArt, hunterArt, houndArt } from '../art.js';

const TAG = { bleed: { i: '🩸', n: 'Bleed' }, fire: { i: '🔥', n: 'Fire' }, blunt: { i: '🔨', n: 'Blunt' }, beast: { i: '🐾', n: 'Beast' }, machine: { i: '⚙️', n: 'Machine' } };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const monogram = (name) => `<span class="mono">${(name || '?').trim()[0] || '?'}</span>`;

export class CombatScreen {
  constructor(root, params, audio, onEnd) {
    this.root = root; this.audio = audio; this.onEnd = onEnd;
    this.hunterId = params.hunterId || 'houndmaster';
    this.region = params.region || 0;
    this.selected = null; this.targeting = false;
    this.enemyEls = new Map();
    this.combat = new Combat({ ...params, hooks: this._hooks() });
    this._build();
    this.combat.start();
    this.render();
    audio.startMusic(this.region);
  }

  _hooks() {
    return {
      onPlayCard: () => this.audio.card(),
      onDamage: ({ target, amount, attacker, weak, dot, self }) => {
        const node = this._node(target);
        if (amount > 0) {
          this.float(node, '-' + amount, weak ? 'flt crit' : dot ? 'flt bleed' : 'flt dmg');
          this.shake(node);
          if (target.isPlayer) { this.shakeScreen(); this.audio.hurt(); }
          else if (dot) this.audio.bleed();
          else if (weak) this.audio.crit();
          else this.audio.hit();
        } else if (!dot) { this.float(node, 'block', 'flt block'); }
      },
      onBlock: ({ entity, amount }) => { if (amount > 0) { this.float(this._node(entity), '+' + amount + '🛡', 'flt blk'); this.audio.block(); } },
      onHeal: ({ entity, amount }) => { if (amount > 0) this.float(this._node(entity), '+' + amount, 'flt heal'); },
      onStatus: ({ entity, id, amount }) => { const s = STATUSES[id]; if (s && amount > 0) this.float(this._node(entity), s.icon, 'flt status'); },
      onHoundAct: () => { this.audio.bark(); if (this.houndEl) this.pulse(this.houndEl); },
      onHoundGrow: ({ fed }) => { this.audio.growl(); if (this.houndEl) { this.pulse(this.houndEl); this.float(this.houndEl, fed ? 'FED' : '+1', 'flt heal'); } },
      onHoundDown: () => { this.audio.hurt(); this.shakeScreen(); },
      onHoundRevive: () => { this.audio.growl(); },
      onDeploy: ({ c }) => { this.audio.deploy(); this.toast(`${c.icon} ${c.name} deployed — it acts every turn.`, 1800); },
      onContraption: ({ c }) => { const node = this.contraptionEls && this.contraptionEls.get(c); if (node) this.pulse(node); },
      onBossPhase: ({ line }) => this.toast(line, 2600),
      onEnd: ({ result }) => { this.audio.fanfare(result === 'win'); setTimeout(() => this.showEnd(result), 700); },
    };
  }

  _node(target) {
    if (!target) return this.playerEl;
    if (target.isPlayer) return this.playerEl;
    if (target.isHound) return this.houndEl;
    return this.enemyEls.get(target.uid) || this.playerEl;
  }

  _build() {
    this.root.innerHTML = '';
    this.elEnemies = el('div', 'enemies');
    this.elAllies = el('div', 'allies');
    this.elHud = el('div', 'hud');
    this.elHand = el('div', 'hand');
    this.elBar = el('div', 'actionbar');
    this.btnEnd = el('button', 'endturn', 'End Turn ▸');
    this.btnEnd.onclick = () => this.endTurn();
    this.elBar.append(this.elHud, this.btnEnd);
    this.toastEl = el('div', 'toast');
    this.root.append(this.toastEl, this.elEnemies, this.elAllies, this.elBar, this.elHand);
    this.root.onclick = (e) => { if (e.target === this.root) this.cancel(); };
    bgImage(this.root, 'assets/backgrounds/combat.webp');
  }

  /* ---------------- render ---------------- */
  render() {
    const s = this.combat.snapshot();
    // enemies (persistent nodes)
    const seen = new Set();
    s.enemies.forEach((en) => {
      seen.add(en.uid);
      let node = this.enemyEls.get(en.uid);
      if (!node) { node = el('div', 'enemy'); node.onclick = (ev) => { ev.stopPropagation(); this.tapEnemy(en.uid); }; this.enemyEls.set(en.uid, node); this.elEnemies.append(node); }
      node.classList.toggle('targetable', this.targeting);
      node.classList.toggle('dead', en.hp <= 0);
      node.innerHTML = this._enemyHtml(en);
    });
    for (const [uid, node] of this.enemyEls) if (!seen.has(uid)) { node.remove(); this.enemyEls.delete(uid); }

    // allies: hound + player
    this.elAllies.innerHTML = '';
    if (s.hound) {
      this.houndEl = el('div', 'hound' + (s.hound.alive ? '' : ' downed'));
      this.houndEl.innerHTML = `<div class="por">${artLayer(houndArt(), '🐕')}</div><div class="meta"><b>${s.hound.name}</b>
        <span class="atk">⚔ ${s.hound.atk}</span>${this._bar(s.hound.hp, s.hound.maxHp, 'hp')}
        ${s.hound.alive ? '' : '<span class="downtag">DOWNED</span>'}</div>`;
      this.houndEl.onclick = (e) => { e.stopPropagation(); this.toast('Hound — strikes at end of turn. ⚔ is its attack. Feed it to grow it; Mend revives it.', 2800); };
      this.elAllies.append(this.houndEl);
    }
    // Tinker contraptions (live engine objects so juice hooks can find their node)
    this.contraptionEls = new Map();
    if (this.combat.contraptions.length) {
      const strip = el('div', 'contraptions');
      this.combat.contraptions.forEach((c) => {
        const node = el('div', 'contraption k-' + c.kind, `<span class="cgic">${c.icon}</span><b>${c.name}</b><span class="cgval">${c.value}</span>`);
        node.onclick = (e) => { e.stopPropagation(); this.toast(`${c.icon} ${c.name} — acts every turn on its own (${c.kind === 'attack' ? 'strikes ' + c.value : c.kind === 'block' ? '+' + c.value + ' Block' : c.kind === 'strength' ? '+' + c.value + ' Strength' : '+' + c.value + ' Bleed'}).`, 2600); };
        this.contraptionEls.set(c, node); strip.append(node);
      });
      this.elAllies.append(strip);
    }

    this.playerEl = el('div', 'player');
    const p = s.player;
    this.playerEl.innerHTML = `<div class="por">${artLayer(hunterArt(this.hunterId), '🏹')}</div><div class="meta"><b>Hunter</b>
      ${p.block > 0 ? `<span class="blk">🛡 ${p.block}</span>` : ''}
      ${this._bar(p.hp, p.maxHp, 'hp')}${this._statusRow(p.statuses)}</div>`;
    this.elAllies.append(this.playerEl);

    // hud (energy)
    let pips = '';
    for (let i = 0; i < p.maxEnergy; i++) pips += `<span class="pip${i < p.energy ? ' on' : ''}"></span>`;
    this.elHud.innerHTML = `<div class="energy">${pips}<span class="elabel">${p.energy}/${p.maxEnergy}</span></div>
      ${s.cardsThisTurn > 0 ? `<div class="combo">⚡ Combo ×${s.cardsThisTurn}</div>` : ''}
      <div class="piles">🂠 ${s.piles.draw} · 🗑 ${s.piles.discard}</div>`;

    // hand
    this.elHand.innerHTML = '';
    s.hand.forEach((c) => {
      const playable = !c.unplayable && c.cost <= p.energy && !s.over;
      const card = el('div', `card type-${c.type}${playable ? '' : ' unplayable'}${this.selected === c.uid ? ' selected' : ''}`);
      card.innerHTML = `<div class="cost">${c.cost}</div>
        <div class="cart">${artLayer(cardArt(c.id), monogram(c.name))}</div>
        <div class="cname">${c.name}</div>
        <div class="ctype">${c.type}${c.tag ? ` · ${TAG[c.tag]?.i || ''}` : ''}</div>
        <div class="ctext">${c.text}</div>`;
      card.onclick = (ev) => { ev.stopPropagation(); this.tapCard(c); };
      this.elHand.append(card);
    });
    this.btnEnd.disabled = s.over;
  }

  _enemyHtml(en) {
    const it = en.intent || {};
    let intentText = '';
    if (it.type === 'attack' || it.type === 'maul') intentText = `${it.icon} ${it.amount}${it.times > 1 ? `×${it.times}` : ''}${it.type === 'maul' ? ' 🐾' : ''}`;
    else if (it.type === 'block') intentText = `${it.icon} ${it.amount}`;
    else if (it.type === 'buff' || it.type === 'debuff') intentText = `${it.icon} ${STATUSES[it.status]?.icon || ''}`;
    else if (it.type === 'charge') intentText = `${it.icon} ${it.amount}!`;
    else intentText = it.icon || '❔';
    const weak = en.weakTo ? `<span class="weak">${TAG[en.weakTo]?.i || ''} weak: ${TAG[en.weakTo]?.n || en.weakTo}</span>` : '';
    const armor = en.armor > 0 ? `<span class="armor">🛡${en.armor} armor</span>` : '';
    const itClass = (it.type === 'attack' || it.type === 'maul' || it.type === 'charge') ? 'atk'
      : it.type === 'block' ? 'def' : it.type === 'buff' ? 'buf' : it.type === 'debuff' ? 'deb' : 'neu';
    return `<div class="intent i-${itClass}">${intentText}</div>
      <div class="por">${artLayer(enemyArt(en.id), en.emoji)}</div>
      <div class="ename">${en.name}${en.elite ? ' ★' : ''}${en.boss ? ' 👑' : ''}</div>
      ${en.block > 0 ? `<span class="blk">🛡 ${en.block}</span>` : ''}
      ${this._bar(en.hp, en.maxHp, 'hp foe')}
      <div class="traits">${weak}${armor}</div>
      ${this._statusRow(en.statuses)}`;
  }

  _bar(hp, max, cls) { const pct = Math.max(0, (hp / max) * 100); return `<div class="bar ${cls}"><div class="fill" style="width:${pct}%"></div><span>${hp}/${max}</span></div>`; }
  _statusRow(st) { const keys = Object.keys(st || {}); if (!keys.length) return ''; return `<div class="statuses">${keys.map((id) => `<span class="st" data-s="${id}">${STATUSES[id]?.icon || '?'}${st[id]}</span>`).join('')}</div>`; }

  /* ---------------- interaction ---------------- */
  tapCard(c) {
    const s = this.combat.snapshot();
    if (s.over) return;
    if (c.unplayable || c.cost > s.player.energy) { this.audio.block(); return; }
    if (c.target === 'enemy' && this.combat.livingEnemies().length > 1) {
      this.selected = c.uid; this.targeting = true; this.render();
    } else if (c.target === 'enemy') {
      this.combat.play(c.uid, this.combat.livingEnemies()[0]?.uid); this.cancel(); this.render();
    } else {
      this.combat.play(c.uid, null); this.cancel(); this.render();
    }
  }
  tapEnemy(uid) {
    if (this.targeting && this.selected) { this.combat.play(this.selected, uid); this.cancel(); this.render(); return; }
    // inspect
    const e = this.combat.enemies.find((x) => x.uid === uid); if (!e) return;
    const it = e.intent || {};
    let msg = `${e.name}: `;
    if (it.type === 'attack' || it.type === 'maul') msg += `about to attack for ${it.amount}${it.times > 1 ? ` ×${it.times}` : ''}${it.type === 'maul' ? ' (at your Hound!)' : ''}.`;
    else if (it.type === 'block') msg += `about to gain ${it.amount} Block.`;
    else if (it.type === 'charge') msg += `winding up a ${it.amount} hit — brace next turn!`;
    else if (it.type === 'buff' || it.type === 'debuff') msg += `about to ${it.type} (${STATUSES[it.status]?.name || ''}).`;
    else msg += 'preparing.';
    if (e.weakTo) msg += ` Weak to ${TAG[e.weakTo]?.n || e.weakTo} (+50%).`;
    if (e.armor > 0) msg += ` Armor ${e.armor} (Break it).`;
    this.toast(msg, 3000);
  }
  cancel() { this.selected = null; this.targeting = false; }
  endTurn() { if (this.combat.over) return; this.cancel(); this.combat.endTurn(); this.render(); }

  /* ---------------- juice ---------------- */
  float(node, text, cls) {
    if (!node) return;
    const f = el('span', cls, text);
    const r = node.getBoundingClientRect();
    f.style.left = (r.left + r.width / 2) + 'px';
    f.style.top = (r.top + r.height * 0.3) + 'px';
    document.body.append(f);
    setTimeout(() => f.remove(), 900);
  }
  shake(node) { if (!node) return; node.classList.remove('hitshake'); void node.offsetWidth; node.classList.add('hitshake'); }
  pulse(node) { if (!node) return; node.classList.remove('pulse'); void node.offsetWidth; node.classList.add('pulse'); }
  shakeScreen() { this.root.classList.remove('screenshake'); void this.root.offsetWidth; this.root.classList.add('screenshake'); }
  toast(msg, ms = 2200) { this.toastEl.textContent = msg; this.toastEl.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => this.toastEl.classList.remove('show'), ms); }

  showEnd(result) {
    const ov = el('div', 'endscreen');
    ov.innerHTML = `<div class="endpanel">
      <h1 style="color:${result === 'win' ? '#9be38b' : '#ff6b6b'}">${result === 'win' ? 'PREY FELLED' : 'THE WOOD TAKES YOU'}</h1>
      <p>${result === 'win' ? 'The beast lies still. The hunt goes on.' : 'Your hunt ends here in the dark.'}</p>
      <button class="again">${result === 'win' ? 'Continue ▸' : 'Accept your fate'}</button></div>`;
    ov.querySelector('.again').onclick = () => { ov.remove(); this.audio.stopMusic(); this.onEnd && this.onEnd(result, this.combat); };
    this.root.append(ov);
  }
}
