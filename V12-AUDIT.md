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


## V12 implementation progress — gameplay branch

Working branch: `gameplay/v12-overhaul`, based on the V11 live commit.

### 3D priority — 75%

- Shared renderer: pause/resume button plus P-key shortcut; the simulation clock stops while paused; input and renderer cleanup remain in place.
- Neon Strike: target tiers and escalating pace with streak rewards.
- Gravity Rush: portal requires at least three energy shards.
- Velocity X: three circuits, two rival drivers, lap/place HUD, boost and contact feedback; car heading aligned to the track direction.
- Wildlands: wildlife observation scoring and proximity-reactive animal movement.
- Park Empire: attraction variety rewards, guest movement toward rides, rating feedback, and clearer placement errors.
- Mythic Realms: spell cooldown and shrine progression feedback.
- Trailblazer Sim: delivery gates require slowing down to complete each stop.
- Wildcraft: optional campfire crafting objective and bonus.

### Other engines — 25%

All 27 non-3D engines now have targeted V12 changes:

- Rift Runner, Circuit Crafter, Star Courier, Reaction Rush, Memory Match, Aim Trainer, Whack-a-Mole, Tap Frenzy, and Type Blitz.
- Tic-Tac-Toe, Number Merge, Snake Sprint, Neon Pong, Brick Breaker, Orbit Dodger, Minefield, Simon Sequence, and Word Scramble.
- Cosmic Clicker, Flappy Pixel, Math Sprint, Connect Four, Pixel Platformer, Trivia Blitz, Color Clash, Lights Out, and Maze Runner.

Changes include new difficulty settings, score streaks, hints, combo rewards, protected first moves, undo/checkpoints, multi-wave progression, speed ramps, timed surges, and improved feedback.

### Current test state

- Source implementation: in progress / ready for automated verification.
- Static validator now checks every V12 engine marker, the V12 stylesheet link, the shared 3D pause clock, and the game-specific 3D changes.
- Playwright now exercises all 27 non-3D launch/close routes and all eight 3D startup/pause or graceful-load-error paths.
- V12 static validator: **passed** on commit `967a1b6b3ee3dbdeae4be064180a574bb4c8e0b0`.
- Chromium Playwright suite: **passed** on the same commit. It covered homepage/catalog, Daily Drop, search, same-device Tic-Tac-Toe, 27 non-3D launch/close routes, and eight 3D startup plus pause/resume or graceful-load-failure paths.
- Manual gameplay feel, all control combinations, mobile touch, camera behavior, WebGL on actual devices, and real-device performance remain to be checked before release.


## V12.1 implementation progress — Gameplay Fun Pass

Working branch: `gameplay/v12-1-fun-pass`, based on the V12 gameplay branch. The live `main` branch is unchanged.

### Priority allocation

- **75% — eight 3D games:** Neon Strike precision rewards; Gravity Rush dash; Velocity X drift charge; Wildlands deliberate observation; Park Empire attraction-variety chains; Mythic Realms dash; Trailblazer precision parking; Wildcraft one-use shelter rest.
- **25% — 27 other engines:** every non-3D game receives a game-specific second-pass change, including skill bonuses, mastery chains, comeback assists, score grades, improved hints, and replay incentives.

### Scope preserved

- Catalog remains at 203 entries and the engine count remains 35.
- No new game engine routes, sign-in system, or online multiplayer service was introduced.
- V12 work remains preserved in its separate branch and draft PR; V12.1 is developed independently.
- V12.1 is not deployed. GitHub Pages continues to serve V11 from `main`.

### V12.1 verification

- Static validator expanded to check the new 3D and 27 arcade feature markers.
- Browser regression tests expanded for Tic-Tac-Toe's one-use undo and Trivia Blitz's 50/50 lifeline.
- Static validation: **passed** on commit `de35ac8eb24d92c2aed9279af56c763bc06806ab` (GitHub Actions run [45112216251](https://github.com/crewliambackup1-star/pixellab/actions/runs/45112216251)).
- Chromium browser smoke tests: **passed** on the same commit, including all current launch/close checks and the new Tic-Tac-Toe/Trivia regression (run [45112216180](https://github.com/crewliambackup1-star/pixellab/actions/runs/45112216180)).
- Draft PR #15 targets `main` as a cumulative V12 + V12.1 candidate so both repository workflows can run; this does not merge or deploy either version.
- Hands-on gameplay feel, keyboard/touch control combinations, mobile behavior, camera behavior, WebGL compatibility, and real-device performance still need manual QA before release.
