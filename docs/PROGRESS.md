# Mournwood (remake) — Progress Log

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

## Milestone 2 — One region + node map + economy  ⬜
(node map, rewards 1-of-3/skip, gold, trader+removal, camp+upgrade, relics, curses, save/resume, Wealdedge boss)

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
