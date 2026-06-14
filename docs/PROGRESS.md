# Mournwood (remake) — Progress Log

> ▶ **RESUME HERE → Milestone 5 (final): meta — unlocks, the "Hunt Deepens" Ascension ladder,
> woodcut art on every card (replace emoji), full CC0 music/SFX pass, and a polish/onboarding/Codex pass.**
> M1–M4 are DONE, committed, pushed, live at https://bordingcode.github.io/mournwood-remake/.
> The game is now a COMPLETE 3-region run (Wealdedge → Sloughfen → Blackheart) with 3 hunters × 5 pacts.
> For M5: persistent meta-save (separate from the run save), unlock gates, Ascension modifiers applied at
> makeRun, an art pipeline (per-card images w/ typographic fallback), and a keyword Codex screen.

> Resume here if the session drops. Read this + `DESIGN.md` first.
> Location: `~/CC/mournwood-remake` · Repo: BordingCode/mournwood-remake · Live: (Pages, TBD)
> Old game (untouched, for reference/history): `~/CC/rpc` (repo BordingCode/mournwood, live /mournwood).

## Status legend: ⬜ todo · 🔧 doing · ✅ done

## Milestone 1 — Core combat that feels great  ✅ DONE
- ✅ Project scaffold (folders, git, .nojekyll)
- ✅ DESIGN.md + PROGRESS.md committed
- ✅ engine: rng.js, statuses.js, enemies.js (intents+weakness), combat.js (op system + Hunt/weakness + bond-fed hound)
- ✅ data: Houndmaster (10-card starter + 9-card pool), 4 Act-1 enemies + 1 elite + multi-phase boss, all with weaknesses/armor
- ✅ UI: phone-portrait combat screen, card hand, telegraphed intents (color-coded), tap-to-inspect toasts, HUD
- ✅ juice (floats/shake/pulse/screenshake) + procedural audio (SFX + dark ambient bed)
- ✅ headless combat test (node test/combat.test.mjs — 13 checks incl 80-run fuzzer)
- ✅ browser-playtested (phone viewport): Hunt/weakness, hound bond/feed, synergy, win/reward/next, boss weakness-shift, lose path — 0 console errors
- ✅ M1 boot = 5-fight gauntlet (intro → bleed/armor/elite → Briar Mother boss) with card pick between fights
- NOTE: portraits/icons use emoji for now (render on iOS/Android; blank on Linux test browser). Woodcut art replaces them in M5.
- ⬜ commit/push + enable Pages + add to Hub  (in progress)

## Milestone 2 — One region + node map + economy  ✅ DONE
- ✅ run.js: branching node-map (random-walk DAG, 321 headless checks) + run state + save/resume (localStorage 'mw_save_v1')
- ✅ ui/map.js: scrollable branching map (SVG edges), reachable-node glow, tap to travel, top HUD (hp/gold/relics/deck)
- ✅ relics.js (12) + relic hooks wired into combat (combatStart/turnStart/onDeath/onApplyStatus/modBlock/modAttack/houndAtk/postCombatHeal/glutton); gold economy
- ✅ ui/nodes.js: card reward (1-of-3/skip), Trader (buy card/relic, remove card, gold-gated), Camp (heal/upgrade), 4 Omen events, Cache, deck viewer
- ✅ card upgrades ('+' variants via instantiate) + 2 curse cards via greedy choices
- ✅ depth-scaled encounters; elites/hunts drop relics; Wealdedge → Briar Mother boss → victory (save cleared)
- ✅ main.js = run orchestrator; auto-save after every node; resume via "Continue the Hunt"
- ✅ browser-playtested full run end-to-end (phone): map, all node types, economy, relics, curses, save/resume, boss/victory — 0 console errors
- NOTE: still emoji portraits/icons (woodcut art = M5). Only region 0 (Wealdedge) so far.

## Milestone 3 — Pacts + Assassin + Tinker  ✅ DONE
- ✅ Engine extensions (combat.js): **contraptions** (deploy op + tickContraptions each player turn:
  turret=attack weakest, grinder=Block, bellows=Strength, needler=Bleed), **combo** (`if` conditions
  combo≥N / firstCard / hasContraption; `perCombo` already; `perContraption` in resolveVal),
  **poison/Rot** dot + **thorns** retaliate. Snapshot adds contraptions + cardsThisTurn.
- ✅ **Assassin** (Combo Chains, 62 HP): cheap 0/1-cost chain cards (nick/dart/shadowstep/momentum) that
  pump perCombo finishers (eviscerate/coupdegrace/whirl) and combo-gated hits (assassinate/twinfang/ambush).
- ✅ **Tinker** (Contraptions, 66 HP): deploy turret/grinder/bellows/needler/heavy-turret; overclock/overdrive
  fuel & burst; scrapblast/reinforce scale per contraption. No hound; the machine is the defense.
- ✅ **Pacts** (data/pacts.js): Worm(Rot) · Iron(Thorns) · Moon(frenzy) · Ash(sacrifice) · Mist(stealth).
  Each merges 3 cards + 1 pool relic into the run + grants a start relic. 3 hunters × 5 pacts = 15 builds.
  Pact relics excluded from the general pool (only enter a run if you took that pact).
- ✅ Run/UI: title → **choose Hunter → swear Pact** → map. run.js builds per-run cardPool+relicPool+signature
  (hound only for Houndmaster). Combat UI: contraptions strip + combo readout; hound hidden when none.
- ✅ Tests: 27 headless checks incl. combo/contraption/poison/thorns + a 90-run hunter×pact fuzzer (0 crashes).
- ✅ Browser-verified (phone viewport): selection flow, Assassin combo ×3 + Worm poison-on-start, Tinker turret
  auto-fires + Iron 8-block start, Houndmaster+Moon hound + Lunar Fang strength — 0 console errors. SW→v4.
- NOTE: still emoji portraits/icons (woodcut art = M5; blank on Linux test browser, fine on iOS/Android).
## Milestone 4 — Regions 2 & 3 + great-beast bosses  ✅ DONE
- ✅ enemies.js: **Sloughfen** set (bogleech/drowned/gasbloat/fenstalker + spiderling, elite Mire Widow w/ summon,
  boss **The Fen-Maw** 3-phase) and **Blackheart** set (gloomspawn/rotpriest/thornhorror/direwolf, elite Antlered
  Penance, boss **The Heart-Rot** 3-phase). Swamp/dark monsters apply Rot (poison) to the hunter — uses the M3 status.
- ✅ run.js: **REGIONS** table (pool/elite/boss/hunts per region) + region-aware `enemyIdsFor` + `advanceRegion`
  (fresh map, carry hp/deck/relics/gold). REGION_COUNT exported.
- ✅ main.js: after a non-final region boss → **regionTransition** (heal 40% + a relic + flavor intro → Descend);
  after the final (Blackheart) boss → real victory. Title/victory text updated for the 3-region descent.
- ✅ map.js already labels the region name (Wealdedge / The Sloughfen / The Blackheart).
- ✅ Tests: 31 headless checks incl. region fuzzer (every region pool+boss×3 hunters) + boss-multiphase assertions.
- ✅ Browser-verified the FULL descent end-to-end (phone viewport, fresh port to avoid SW cache): r0 Briar Mother →
  Sloughfen (fenstalker, Fen-Maw) → Blackheart (direwolf, Heart-Rot) → "THE HEART-ROT IS UNMADE" — 0 errors. SW→v5.
- GOTCHA (re)confirmed: an old service worker serves stale modules on the same host:port during dev — test on a
  NEW port (or fully unregister+clear+double-reload). The live deploy's SW bump handles real users.
## Milestone 5 — Meta (unlocks, Ascension, art-on-every-card, full audio, polish, Hub)  ⬜

## Key decisions snapshot (full detail in DESIGN.md)
3 hunters (Houndmaster=Bond&Feed, Assassin=Combo, Tinker=Contraptions) + ~5 Pacts. Phone-first PWA,
vanilla JS, no build. Combat: 3 energy, draw 5, block resets, telegraphed intents, visible monster
weaknesses (Hunt system). 3 regions/node-map. Full deck-sculpting + relics + curses, no potions.
Real stakes + Ascension ladder. Woodcut art + witchfire-green, art on every card. CC0 music + SFX.
Auto-save. Reuse old engine patterns from ~/CC/rpc.

## Build notes / gotchas
- Reusing op-based card engine, status map+decay, weighted intents (charge/summon/ramp) from ~/CC/rpc/js/.
- Remember SW cache version bump on deploy (see other projects' gotcha).
- Add to Bording Hub (~/cc/bording-hub) when first playable.
