// Combat engine — pure, DOM-free, deterministic (RNG injected). Op-based cards (from the
// proven old engine) + NEW: the Hunt weakness/armor system and the Houndmaster's bond-fed Hound.
import { instantiate } from '../data/cards.js';
import { makeEnemy, rollIntent, advanceBoss } from '../data/enemies.js';
import { amt, has, addStatus, decayTurnEnd, STATUSES } from './statuses.js';

const NOOP = () => {};

export class Combat {
  constructor({ rng, player, enemyIds, hound = null, handSize = 5, energy = 3, hooks = {} }) {
    this.rng = rng;
    this.handSize = handSize;
    this.maxEnergy = energy;
    this.h = new Proxy(hooks, { get: (t, k) => t[k] || NOOP });

    this.turn = 0;
    this.over = false;
    this.result = null;
    this.cardsThisTurn = 0;

    this.player = {
      isPlayer: true, name: player.name || 'Hunter',
      maxHp: player.maxHp, hp: player.hp ?? player.maxHp,
      block: 0, energy: 0, statuses: { ...(player.statuses || {}) },
    };
    this.hound = hound
      ? { isHound: true, name: hound.name || 'Hound', maxHp: hound.maxHp, hp: hound.hp ?? hound.maxHp,
          atk: hound.atk, block: 0, statuses: {}, alive: true }
      : null;

    this.enemies = enemyIds.map((id) => makeEnemy(rng, id));
    this.drawPile = rng.shuffle((player.deck || []).map(instantiate));
    this.hand = []; this.discardPile = []; this.exhaustPile = [];
  }

  /* ---------------- lifecycle ---------------- */
  start() { this.beginPlayerTurn(); return this; }

  beginPlayerTurn() {
    if (this.over) return;
    this.turn++;
    this.cardsThisTurn = 0;
    this.player.block = 0;
    this.tickDot(this.player);
    if (this.checkOver()) return;
    this.player.energy = this.maxEnergy;
    this.draw(this.handSize);
    this.h.onTurnStart({ who: 'player', turn: this.turn });
  }

  endTurn() {
    if (this.over) return;
    // The Hound strikes at the end of your turn.
    if (this.hound && this.hound.alive) {
      const liv = this.livingEnemies();
      if (liv.length) {
        const t = this.rng.pick(liv);
        this.h.onHoundAct({ target: t });
        this.attack(this.hound, t, this.hound.atk, { tag: 'beast' });
      }
    }
    if (this.checkOver()) return;
    while (this.hand.length) this.discardPile.push(this.hand.pop());
    decayTurnEnd(this.player);
    this.h.onTurnEnd({ who: 'player' });
    this.enemyPhase();
  }

  enemyPhase() {
    for (const e of this.enemies.filter((x) => x.hp > 0)) {
      if (this.over) break;
      e.block = 0;
      this.tickDot(e);
      if (e.hp <= 0) { this.checkOver(); continue; }
      this.executeIntent(e);
      if (this.checkOver()) return;
      decayTurnEnd(e);
      const line = advanceBoss(this.rng, e);
      if (line) this.h.onBossPhase({ enemy: e, line });
      rollIntent(this.rng, e);
    }
    if (!this.over) this.beginPlayerTurn();
  }

  /* ---------------- cards ---------------- */
  draw(n) {
    for (let i = 0; i < n; i++) {
      if (this.hand.length >= 10) break;
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        this.drawPile = this.rng.shuffle(this.discardPile); this.discardPile = [];
      }
      const c = this.drawPile.pop();
      this.hand.push(c); this.h.onDraw(c);
    }
  }

  canPlay(card, targetUid) {
    if (this.over || !card || card.unplayable) return false;
    if (card.cost > this.player.energy) return false;
    if (card.target === 'enemy') return !!this.enemies.find((e) => e.uid === targetUid && e.hp > 0);
    return true;
  }

  play(uid, targetUid) {
    const idx = this.hand.findIndex((c) => c.uid === uid);
    if (idx < 0) return false;
    const card = this.hand[idx];
    if (!this.canPlay(card, targetUid)) return false;
    this.player.energy -= card.cost;
    this.hand.splice(idx, 1);
    this.cardsThisTurn++;
    this.h.onPlayCard({ card, targetUid });
    // Pack Bond: every Attack you play grows the Hound for the rest of the fight.
    if (card.type === 'attack' && this.hound && has(this.player, 'packbond')) {
      this.hound.atk += amt(this.player, 'packbond');
      this.h.onHoundGrow({ hound: this.hound });
    }
    const target = this.enemies.find((e) => e.uid === targetUid) || null;
    for (const op of card.effects || []) this.runOp(op, card, target);
    (card.exhaust ? this.exhaustPile : this.discardPile).push(card);
    this.checkOver();
    return true;
  }

  runOp(op, card, target) {
    switch (op.k) {
      case 'damage': {
        const times = op.times || 1;
        let tgts;
        if (op.target === 'random') { const liv = this.livingEnemies(); tgts = liv.length ? [this.rng.pick(liv)] : []; }
        else if (card.target === 'all') tgts = this.livingEnemies();
        else tgts = [target].filter(Boolean);
        for (const t of tgts) {
          const base = op.fromTargetStatus ? (op.fromTargetStatus.per * amt(t, op.fromTargetStatus.status)) : this.resolveVal(op.amount);
          for (let i = 0; i < times && t.hp > 0; i++) this.attack(this.player, t, base, { tag: card.tag });
        }
        break;
      }
      case 'block': this.gainBlock(this.player, this.resolveVal(op.amount)); break;
      case 'heal': this.heal(this.player, this.resolveVal(op.amount)); break;
      case 'selfDamage': this.applyDamage(this.player, op.amount, null); this.h.onDamage({ target: this.player, amount: op.amount, self: true }); this.checkOver(); break;
      case 'draw': this.draw(op.amount); break;
      case 'energy': this.player.energy += op.amount; break;
      case 'status': {
        const n = this.resolveVal(op.amount);
        if (op.to === 'self') this.applyStatus(this.player, op.status, n);
        else if (card.target === 'all') this.livingEnemies().forEach((e) => this.applyStatus(e, op.status, n));
        else if (target) this.applyStatus(target, op.status, n);
        break;
      }
      case 'break': if (target) { target.armor = Math.max(0, (target.armor || 0) - op.amount); this.h.onBreak({ target }); } break;
      case 'feedHound': if (this.hound) {
        if (op.atk) this.hound.atk += op.atk;
        if (op.hp) { this.hound.maxHp += op.hp; this.hound.hp += op.hp; }
        this.hound.alive = this.hound.hp > 0;
        this.h.onHoundGrow({ hound: this.hound, fed: true });
      } break;
      case 'houndAttack': if (this.hound && this.hound.alive) {
        const times = op.times || 1;
        for (let i = 0; i < times; i++) { const liv = this.livingEnemies(); if (!liv.length) break; const t = target && target.hp > 0 ? target : this.rng.pick(liv); this.h.onHoundAct({ target: t }); this.attack(this.hound, t, this.hound.atk, { tag: 'beast' }); }
      } break;
      case 'healHound': if (this.hound) {
        this.hound.hp = Math.min(this.hound.maxHp, this.hound.hp + op.amount);
        if (!this.hound.alive && this.hound.hp > 0) { this.hound.alive = true; this.h.onHoundRevive({ hound: this.hound }); }
        else this.h.onHeal({ entity: this.hound, amount: op.amount });
      } break;
      case 'if': {
        const e = op.on === 'self' ? this.player : (op.on === 'hound' ? this.hound : target);
        const cur = !e ? 0 : (op.status === 'block' ? (e.block || 0) : amt(e, op.status));
        if (cur >= (op.atLeast || 1)) [].concat(op.then).forEach((o) => this.runOp(o, card, target));
        break;
      }
      case 'random': { const choice = this.rng.pick(op.options); [].concat(choice).forEach((o) => this.runOp(o, card, target)); break; }
    }
  }

  resolveVal(spec) {
    if (typeof spec === 'number') return spec;
    if (spec && typeof spec === 'object') {
      let v = spec.base || 0;
      if (spec.scale) v += (spec.scale.per || 1) * amt(this.player, spec.scale.stat);
      if (spec.perCombo) v += spec.perCombo * this.cardsThisTurn;
      return Math.max(0, Math.floor(v));
    }
    return 0;
  }

  /* ---------------- combat math ---------------- */
  computeDamage(attacker, target, base, opts = {}) {
    let d = base + amt(attacker, 'strength');
    if (has(attacker, 'weak')) d = Math.floor(d * 0.75);
    if (has(target, 'vulnerable')) d = Math.floor(d * 1.5);
    // The Hunt: matching a monster's weakness deals +50%.
    if (opts.tag && target.weakTo && opts.tag === target.weakTo) d = Math.floor(d * 1.5);
    return Math.max(0, Math.round(d));
  }

  attack(attacker, target, base, opts = {}) {
    if (!target || target.hp <= 0) return 0;
    const dmg = this.computeDamage(attacker, target, base, opts);
    const dealt = this.applyDamage(target, dmg, attacker, { attack: true });
    this.h.onDamage({ target, amount: dealt, attacker, weak: opts.tag && target.weakTo === opts.tag });
    if (target.hp <= 0) this.h.onDeath({ target });
    return dealt;
  }

  applyDamage(target, dmg, attacker, opts = {}) {
    let rem = dmg;
    // Armor reduces each ATTACK hit (until Broken). Doesn't apply to bleed/self-damage.
    if (opts.attack && target.armor > 0) rem = Math.max(0, rem - target.armor);
    if (target.block > 0) { const a = Math.min(target.block, rem); target.block -= a; rem -= a; }
    target.hp = Math.max(0, target.hp - rem);
    return rem;
  }

  gainBlock(e, base) {
    const b = Math.max(0, base);
    e.block += b;
    this.h.onBlock({ entity: e, amount: b });
    return b;
  }

  heal(e, n) { e.hp = Math.min(e.maxHp, e.hp + n); this.h.onHeal({ entity: e, amount: n }); }
  applyStatus(e, id, n) { addStatus(e, id, n); this.h.onStatus({ entity: e, id, amount: n }); }

  tickDot(e) {
    const b = amt(e, 'bleed');
    if (b > 0) { this.applyDamage(e, b, null); addStatus(e, 'bleed', -1); this.h.onDamage({ target: e, amount: b, dot: 'bleed' }); }
    const r = amt(e, 'regen');
    if (r > 0) { this.heal(e, r); addStatus(e, 'regen', -1); }
  }

  executeIntent(e) {
    const it = e.intent || rollIntent(this.rng, e);
    this.h.onEnemyAction({ enemy: e, intent: it });
    const times = it.times || 1;
    if (it.type === 'attack') { for (let i = 0; i < times; i++) this.enemyHit(e, this.player, it.amount); }
    else if (it.type === 'maul') { // savage the Hound if it lives, else the hunter
      const tgt = this.hound && this.hound.alive ? this.hound : this.player;
      for (let i = 0; i < times; i++) this.enemyHit(e, tgt, it.amount);
    }
    else if (it.type === 'block') this.gainBlock(e, it.amount);
    else if (it.type === 'buff') this.applyStatus(e, it.status, it.amount);
    else if (it.type === 'debuff') this.applyStatus(this.player, it.status, it.amount);
    else if (it.type === 'ramp') { e.rampStacks = Math.min((e.rampStacks || 0) + 1, it.max || 5); this.applyStatus(e, 'strength', (it.amount || 1) + (e.rampStacks - 1)); }
    else if (it.type === 'summon') { let room = (it.cap || 4) - this.livingEnemies().length; for (let i = 0; i < times && room > 0; i++, room--) { const ne = makeEnemy(this.rng, it.summonId); this.enemies.push(ne); this.h.onSummon({ enemy: ne }); } }
    else if (it.type === 'charge') { e.forcedNext = { moveId: it.releaseId || 'unleash', type: 'attack', amount: it.amount, times: it.times || 1 }; }
  }

  // An enemy strikes a target (player or hound). Damage uses the enemy's strength; weak applies.
  enemyHit(e, target, base) {
    let d = base + amt(e, 'strength');
    if (has(e, 'weak')) d = Math.floor(d * 0.75);
    d = Math.max(0, d);
    const dealt = this.applyDamage(target, d, e, { attack: true });
    this.h.onDamage({ target, amount: dealt, attacker: e });
    if (target.isHound && target.hp <= 0 && target.alive) { target.alive = false; this.h.onHoundDown({ hound: target }); }
  }

  /* ---------------- queries ---------------- */
  livingEnemies() { return this.enemies.filter((e) => e.hp > 0); }

  checkOver() {
    if (this.over) return true;
    if (this.player.hp <= 0) { this.over = true; this.result = 'lose'; this.h.onEnd({ result: 'lose' }); return true; }
    if (this.livingEnemies().length === 0) { this.over = true; this.result = 'win'; this.h.onEnd({ result: 'win' }); return true; }
    return false;
  }

  snapshot() {
    return {
      turn: this.turn, over: this.over, result: this.result, cardsThisTurn: this.cardsThisTurn,
      player: { hp: this.player.hp, maxHp: this.player.maxHp, block: this.player.block, energy: this.player.energy, maxEnergy: this.maxEnergy, statuses: { ...this.player.statuses } },
      hound: this.hound ? { name: this.hound.name, hp: this.hound.hp, maxHp: this.hound.maxHp, atk: this.hound.atk, alive: this.hound.alive } : null,
      enemies: this.enemies.map((e) => ({ uid: e.uid, id: e.id, name: e.name, emoji: e.emoji, hp: e.hp, maxHp: e.maxHp, block: e.block, armor: e.armor || 0, weakTo: e.weakTo, statuses: { ...e.statuses }, intent: e.intent, boss: !!e.boss, elite: !!e.elite })),
      hand: this.hand.map((c) => ({ uid: c.uid, id: c.id, name: c.name, cost: c.cost, type: c.type, target: c.target, tag: c.tag, text: c.text, exhaust: c.exhaust })),
      piles: { draw: this.drawPile.length, discard: this.discardPile.length, exhaust: this.exhaustPile.length },
    };
  }
}
