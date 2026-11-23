# PixelLab V12 — Gameplay Audit

Audit baseline: `main` at V11 commit `db3758f8e9881ea1cf3f64a0e218dda4657a2253`.

## Scope and effort allocation

- 203 catalog entries.
- 35 playable engines: 8 original 3D experiences plus 27 other engines.
- V12 effort split: 75% of gameplay/graphics effort on the eight 3D games; 25% on the remaining 27 engines.
- No new game-count target. V12 improves the current catalog.

## Audit-before-implementation status

| Area | Status | Evidence / finding |
|---|---|---|
| Live branch and release baseline | Complete | V11 commit is the current `main` head; V11 assets and the 203-entry index are present. |
| Base catalog / engine inventory | Complete | `catalog.js`, `v10-catalog.js`, and `v11-catalog.js` contain 27 legacy/original 2D engines and 8 3D engines. |
| 2D engine source inventory | Complete | All 27 modules referenced by `index.html` were located and inspected at source level. |
| 3D runtime inventory | Complete | Shared lifecycle is in `v10-runtime.js`; V11's eight 3D game implementations and genre discovery are in `v11-runtime.js`. |
| Existing static validation | Complete | Current validator checks assets, JS syntax, catalog IDs, 27 original routes, eight 3D launchers, and mode preservation. |
| Existing browser test coverage | Complete | Existing Playwright coverage checks homepage catalog count, Daily Drop, search, and same-device Tic-Tac-Toe. |
| All 35 gameplay loops | Needs testing | Static inspection is not hands-on gameplay testing. Existing Playwright suite did not launch all 35 engines. |
| WebGL / touch / resize / performance on actual devices | Needs testing | Automated Chromium smoke tests do not replace real-device and browser testing. |

## 3D game findings — 75% priority

| Game | Existing foundation | V12 improvement targets |
|---|---|---|
| Neon Strike | Three arenas, moving targets, score streaks, fire input | More target variety, stronger hit feedback, clear combo/reward loop, robust input and pause handling |
| Gravity Rush | Three courses, moving platforms, double jump, shards, checkpoints | More responsive jump/air-control feel, clearer checkpoint and course feedback, mobile jump parity, fairer recovery |
| Velocity X | Three circuits, boost, two moving rival cars | Rivals currently follow scripted circular motion; add meaningful race positioning/overtaking/collision feedback, clearer lap flow and handling polish |
| Wildlands | Three biomes, relic collection, landmark discoveries, wildlife | Improve exploration feedback, distinct biome objectives, movement/look consistency, and clearer expedition progress |
| Park Empire | Four placement types (Carousel, Ferris Wheel, Coaster, Garden), visitors and income | Deeper visitor/park feedback, clearer placement validity and progress, more satisfying attraction/management loop |
| Mythic Realms | Runes, shrines, pulse spell, gate objective | Strengthen spell feedback, objective clarity and exploration/quest progression |
| Trailblazer Sim | Vehicle controls, boost, six ordered route gates | Make deliveries feel more like deliveries with route feedback, stops/objectives, and driving response |
| Wildcraft | Gather wood/stone/berries, craft shelter, build beacon | Improve resource feedback, crafting clarity, exploration and survival progression |

### Shared 3D runtime

- One shared Three.js lifecycle and rendering loop powers all 3D worlds.
- The game context currently provides HUD, tools, keyboard/touch controls, resize handling, result overlays and cleanup.
- V12 target: a consistent pause/resume path, clearer in-game progress, better control feedback, and no regression in renderer/listener disposal or responsive sizing.

## Other 27 engines — 25% priority

The 27 non-3D engines are:
`Rift Runner`, `Circuit Crafter`, `Star Courier`, `Reaction Rush`, `Memory Match`, `Aim Trainer`, `Whack-a-Mole`, `Tap Frenzy`, `Type Blitz`, `Tic-Tac-Toe`, `Number Merge`, `Snake Sprint`, `Neon Pong`, `Brick Breaker`, `Orbit Dodger`, `Minefield`, `Simon Sequence`, `Word Scramble`, `Cosmic Clicker`, `Flappy Pixel`, `Math Sprint`, `Connect Four`, `Pixel Platformer`, `Trivia Blitz`, `Color Clash`, `Lights Out`, and `Maze Runner`.

### Cross-cutting opportunities

- Several short arcade games rely on one fixed-duration round with little difficulty ramp or meaningful combo/streak feedback.
- Several puzzle games use a single fixed board or puzzle size, so replay depth and challenge variety can improve.
- The original PixelLab games have custom movement/puzzle systems that need game-specific tuning rather than generic reskins.
- Preserve game IDs, original game-launch routes, local favorites/recent history/records/XP, existing AI/same-device modes, and local-only multiplayer behavior.

## Release gates

1. V12 static validator passes.
2. Browser regression suite passes with launch coverage for all 35 engines and checks for key controls, start/replay, modal close and cleanup.
3. No catalog count or launch-route regression.
4. Manual WebGL, touch, resizing, and gameplay feel checks remain explicitly documented until completed on actual devices.
5. Merge/deploy only after the automated gates pass and remaining limitations are stated honestly.
