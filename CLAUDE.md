# Mournwood (remake) — project guide for Claude

A vanilla **ES-module** PWA: a **monster-hunter roguelike deckbuilder**, phone-first. No build
step. Repo: `BordingCode/mournwood-remake` (branch **master**), GitHub Pages
(`bordingcode.github.io/mournwood-remake`). Note the directory case: this lives in **`~/CC`**
(uppercase), while the KB is at **`~/cc`** (lowercase).

## Before working
Read the shared game-dev knowledge base: **`~/cc/gamedev-kb/INDEX.md`** (lowercase `cc`).
Especially `patterns/dom-screen-games.md`, `patterns/game-loop-and-timing.md`,
`patterns/mobile-ios-safari.md`, and `checklists/ship-checklist.md`.
Plan + progress state live in `docs/` (`DESIGN.md`, `PROGRESS.md`).

## Architecture
- `js/main.js` — boot + screen flow; exposes `window.__mw`
  (`run`, `screen`, `showMap`, `travel`, `title`, `RELICS`).
- `js/engine/` — `combat.js`, `rng.js`, `statuses.js` (deterministic core, no DOM).
- `js/data/` — `hunters.js`, `pacts.js`, `enemies.js`, …
- `js/game/run.js` — run/region/ascension model.

## Deploy convention — every change MUST
- **Bump the SW `CACHE` string** in `sw.js` (e.g. `mournwood-remake-v10`→`v11`) and add any
  new file to the `ASSETS` array. **No `?v=` scheme** (ES modules) — the cache bump is the
  only busting mechanism, so it is mandatory on any js/css edit.
- Be **committed and pushed** to `master`.

## Tests
- Headless engine checks (no DOM, no browser): `node test/combat.test.mjs` and
  `node test/map.test.mjs`. Test hook `window.__mw` for browser-driven verification.

## Notes
- Phone-first; audio on first gesture.
