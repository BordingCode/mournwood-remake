# Mournwood (remake) — Progress Log

> ▶ **RESUME HERE → Milestone 3: Pacts + the Assassin & Tinker hunters.**
> M1 (core combat) and M2 (full run loop: map, economy, relics, curses, save/resume, boss)
> are DONE, committed, pushed, and live at https://bordingcode.github.io/mournwood-remake/.
> To continue: read DESIGN.md (§3 hunters, §Pacts) + the M3 checklist below, then build the
> Assassin (Combo) & Tinker (Contraptions) hunters and the Hunter+Pact run-variety system.

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

## Milestone 3 — Pacts + Assassin + Tinker  ⬜
## Milestone 4 — Regions 2 & 3 + great-beast bosses  ⬜
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
