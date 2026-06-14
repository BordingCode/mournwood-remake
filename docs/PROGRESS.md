# Mournwood (remake) — Progress Log

> Resume here if the session drops. Read this + `DESIGN.md` first.
> Location: `~/CC/mournwood-remake` · Repo: BordingCode/mournwood-remake · Live: (Pages, TBD)
> Old game (untouched, for reference/history): `~/CC/rpc` (repo BordingCode/mournwood, live /mournwood).

## Status legend: ⬜ todo · 🔧 doing · ✅ done

## Milestone 1 — Core combat that feels great
- ✅ Project scaffold (folders, git, .nojekyll)
- ✅ DESIGN.md + PROGRESS.md committed
- 🔧 engine: rng.js, statuses.js, intents/enemies, combat.js (op system + Hunt/weakness + hound + combo + contraptions)
- ⬜ data: Houndmaster cards, a few Act-1 enemies w/ weaknesses, 1 elite
- ⬜ UI: combat screen (phone portrait), card hand, enemy intents, tap-to-inspect, HUD
- ⬜ juice + audio (SFX + a music bed)
- ⬜ headless combat test (node)
- ⬜ browser playtest + screenshot, commit/push, enable Pages

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
