# Mournwood (remake) — Design Document

> A from-scratch remake. The old game (`~/CC/rpc`, repo BordingCode/mournwood) **works but
> isn't fun**: generic cards, no synergy, shallow characters, free-roam movement felt bad,
> and it felt cheap. This remake fixes all of that. North star: **fewer things, each deep,
> distinct, and synergistic — polished until it feels right.**

## The pitch
A grim-but-stylish, **phone-first monster-hunter roguelike deckbuilder**. You descend through a
dying wood — green human edge → sinking swamp → dark corrupted inner heart — **reading each
monster's weakness and exploiting it** with a deck you sculpt into a precise killing machine.
Every run pairs a **Hunter** with a **Pact**, so synergies differ every run.

## Decisions (from the planning Q&A — all confirmed by Mathias)
- **Fantasy:** Monster hunter (predator who wins by reading & exploiting prey).
- **Tone:** Grim but stylish (Inscryption / Hades energy).
- **Platform:** Phone-first (portrait, touch, big tap targets, short keyworded cards, tap-to-inspect).
- **Scope:** Full game (multiple characters + acts) — but BUILT in deep increments so it never goes shallow.
- **3 Hunters** (each own card pool + signature mechanic):
  - 🐺 **Houndmaster — Bond & Feed:** feed cards/HP to grow a hound into a monster; huge scaling, high stakes if it falls.
  - 🗡️ **Assassin — Combo Chains:** chain cheap cards to build combo; finishers scale with the chain (sequencing puzzle).
  - ⚙️ **Tinker — Contraptions:** deploy devices that trigger every turn on their own; build a self-running machine (its persistent defense).
- **Pacts:** each run = Hunter + 1 Pact (themed mini-set of cards+relics). **~5 Pacts** (e.g. Worm/rot, Iron/thorns, Moon/beast-frenzy, Ash/sacrifice, Mist/stealth) → ~15 synergistic builds. Guarantees cross-synergy (Monster Train lesson).
- **Combat:** you vs 1–3 monsters (bosses solo). **Telegraphed intents.** **3 energy/turn, draw 5, Block resets each turn** (Tinker gets lasting defense via contraptions).
- **The Hunt system (signature):** monsters show **weakness / armor / Expose / Break** traits via icons; bring the right tool. **Weaknesses visible up front; bosses hide later-phase weaknesses** until reached.
- **Status vocabulary:** small & deep (~6–8: Vulnerable, Weak, Bleed, Poison/Rot, Strength, Expose, Break…).
- **Bosses:** multi-phase great-beasts that shift intent AND weakness mid-fight (one per region).
- **Run structure:** 3 regions, branching **node map** (tap to travel, NO free-roam joystick):
  - Act 1 = green, human-touched edge → Act 2 = swamp/mire → Act 3 = dark corrupted inner wood. ~45–60 min full run.
  - Proposed names: **Wealdedge → The Sloughfen → The Blackheart** (rename freely).
  - **Nodes:** Combat · Elite (drops relic) · Rest/Camp (heal or upgrade a card / tend hound) · Trader · Omen (story choice) · Cache · **Hunt** (track roaming beast, high-risk ambush) · Boss.
- **Deck-shaping (full sculpting):** win → pick 1 of 3 (or skip). Gold from wins. Trader buys cards/relics & REMOVES cards. Camp UPGRADES cards. Rare transforms.
- **Relics:** a CORE pillar (the synergy engine), incl. rare run-warping relics.
- **Curses:** greedy choices add deck-clogging curse cards (the price of power); cleansable at a cost.
- **No consumables/potions** — toolbox = deck + relics (clean phone screen).
- **Progression:** all 3 hunters open from start; Pacts/cards/relics unlock via milestones.
- **Difficulty:** real stakes — lose = start over, no mid-run revives. **"The Hunt Deepens"** ascension ladder (fair fixed modifiers, no rubber-banding).
- **Onboarding:** learn by playing + tap-to-inspect + a Codex of keywords met.
- **Art:** **locked grim-woodcut** (ash & ink), **witchfire-green** accent. **Art on every card** (cohesive AI batches; typographic frame fallback so a missing image never blocks play).
- **Audio:** free CC0 dark music + tactile synth SFX. (Old game had none — half of why it felt cheap.)
- **World/story:** keep the name **Mournwood**; light atmospheric flavor (journal beats, Omen events, boss intros).
- **Saving:** auto-save & resume mid-fight (one ongoing run).
- **Tech:** fresh vanilla-JS ES-modules codebase, NO build step, phone-first PWA. **Reuse proven patterns from old engine** (`~/CC/rpc/js/`): op-based card effects, status map + decay, weighted intent AI with charge/summon/ramp, relic hooks, seeded RNG, save format, headless tests.

## Reused engine patterns (from ~/CC/rpc — proven & tested)
- **Card effects = list of ops** (`damage/block/heal/draw/energy/status/addCard/random/if/...`) executed by the engine; values can `scale` off a stat or `perCombo`. Clean and extensible — adopt this.
- **Statuses** = `{id: amount}` map; `decays` debuffs lose 1/turn; poison ticks at start of turn. Adopt + trim vocabulary.
- **Intents** = weighted move roll, avoids 3x repeat, supports `attack/block/buff/debuff/ramp/summon/charge`. Adopt + add weakness/expose/break.
- **Boss phases** by HP fraction with enter-effects + transition line. Adopt.

## NEW systems to design on top
- **Weakness/Hunt:** each enemy has `weakness` (e.g. bleed/fire/exposed), `armor` (ignores small hits until Broken), `expose` (must be Exposed to be hurt fully). Cards/keywords interact. Damage math checks target weakness for bonus.
- **Hound (Houndmaster):** a persistent ally entity with HP; "Feed" ops grow it (HP/damage); it acts each turn; dying is a big setback.
- **Combo (Assassin):** already have `cardsThisTurn`; finishers `perCombo`. Add combo-spend finishers.
- **Contraptions (Tinker):** persistent player-side devices that trigger each turn (turret=attack, bellows=buff, grinder=block). Engine ticks them.
- **Pacts:** a second card+relic pool merged into the run's offering pools.

## Build milestones (deep increments → full game)
1. **Core combat that feels great** — Houndmaster, intents, Hunt/weakness system, juice + sound, tap-to-inspect. Playtest until it sings.
2. **One full region + node map + economy** (Wealdedge → boss): full loop, rewards, trader, camp, relics, curses, save/resume.
3. **Pacts + the other 2 hunters** (Assassin, Tinker).
4. **Regions 2 & 3 + great-beast bosses.**
5. **Meta:** unlocks, Ascension ladder, art-on-every-card pass, full audio, polish + Bording Hub.

Each milestone is browser-verified (screenshots) before moving on.
