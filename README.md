# PixelLab V10 — The 3D Evolution

PixelLab is a responsive browser arcade. V10 adds a complete visual refresh and the first five original, single-player 3D experiences while preserving the existing 2D catalog and player progress.

## V10 first release

- **200 catalog entries**: 192 themed legacy entries, 3 original V7 games, and 5 original V10 3D games.
- **32 playable game engines**: 24 classic engines, 3 original 2D engines, and 5 new 3D engines.
- **Five original 3D games**:
  - **Neon Strike** — first-person neon arena target challenge.
  - **Gravity Rush** — third-person floating-platform course.
  - **Velocity X** — third-person arcade circuit racer.
  - **Wildlands** — first-person island exploration.
  - **Park Empire** — isometric 3D amusement-park builder.
- The five new 3D games are single-player. Existing local two-player modes in the classic Tic-Tac-Toe, Connect Four, and Neon Pong games are retained; no online multiplayer service is introduced by V10.
- Full visual redesign for the home page, discovery navigation, 3D spotlight, game cards, modal, and responsive game controls.
- The 3D graphics engine is loaded only when a 3D game opens. Three.js is pinned to version 0.164.1 and loaded from jsDelivr, with an unpkg fallback. A WebGL/connection error is shown if neither source can load.
- Keyboard controls are provided for desktop, with touch controls for supported actions. 3D rendering is capped at a moderate pixel ratio to reduce GPU load.
- 3D games release graphics resources and input listeners when closed, so switching between games should not leave old render loops running.

## Quality-over-quantity release rule

The 3D first release is intentionally limited to five games. A game should not be added just to increase the count. Each one should have a complete objective or activity loop, readable controls, a restart path, responsive behavior, and performance that is reasonable on supported devices. The five-game target is a starting scope, not permission to ship unfinished work.

No software can be honestly guaranteed bug-free. The repository validator checks syntax, required assets, catalog integrity, game routing, the on-demand 3D runtime, and basic cleanup hooks. A manual browser pass is still needed for gameplay balance, WebGL compatibility, keyboard behavior, touch controls, and performance on real devices before the release is considered ready.

## Existing arcade features retained

- Browser-local favorites, recent games, records, XP, ranks, achievements, and daily quests.
- Search, category filters, sorting, random play, and responsive desktop/mobile layout.
- Classic modes including Snake Sprint, Neon Pong, Brick Breaker, Reaction Rush, Memory Match, Number Merge, Tic-Tac-Toe, Type Blitz, Whack-a-Mole, Aim Trainer, Orbit Dodger, Tap Frenzy, Minefield, Simon Sequence, Word Scramble, Cosmic Clicker, Flappy Pixel, Math Sprint, Connect Four, Pixel Platformer, Trivia Blitz, Color Clash, Lights Out, and Maze Runner.
- Original V7 games: Rift Runner, Circuit Crafter, and Star Courier.
- Existing V8 AI and same-device modes for Tic-Tac-Toe, Connect Four, and Neon Pong remain local-only.

## Development workflow

- main is the live publishing branch.
- development remains the prior work-in-progress branch.
- massive/v10-3d-redesign contains the V10 implementation and is intentionally separate from the older V9 multiplayer pull request.
- Validate with node scripts/validate-site.cjs.
- The GitHub Actions validation workflow checks JavaScript syntax, required local assets, unique catalog IDs, the 195-entry base catalog, V10's five 3D entries, and every original game launch route.
- Keep the live branch unchanged until review and validation pass. Merge a reviewed pull request into main to publish through GitHub Pages.

## Project structure

- index.html: page structure and ordered script/style references.
- styles.css: original arcade styling.
- v10.css: V10 redesign and responsive 3D game UI.
- catalog.js: base engines, themes, and the legacy catalog.
- v10-catalog.js: five original 3D engines and their catalog entries.
- app.js: catalog UI, local progress, shared utilities, and original 2D game-launch routing.
- v10-runtime.js: on-demand Three.js loader, shared 3D scene lifecycle, five 3D games, and V10 discovery UI.
- games/*.js: the original 27 2D game engines.
- scripts/validate-site.cjs: dependency-free repository checks.
- .github/workflows/validate.yml: repository validation.
- .github/workflows/pages.yml: GitHub Pages deployment.

## Run locally

Keep the project files together and open index.html in a modern browser. The site has no build step. The 2D games do not depend on the 3D module; opening a V10 3D game requires an internet connection to load the pinned Three.js module and a browser/device with WebGL support.

## Deployment

GitHub Pages deploys the repository root using .github/workflows/pages.yml on pushes to main. Changes on development branches do not publish the public site.

Public site: https://crewliambackup1-star.github.io/pixellab/

## Privacy

Favorites, recently played games, records, and Arcade Passport progress are stored locally in the current browser/device. They do not sync between devices.
