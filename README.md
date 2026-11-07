# PixelLab V11 — The 3D Universe

PixelLab is a responsive browser arcade. V11 expands the V10 3D foundation into a broader 3D-first discovery experience while retaining the classic 2D catalog, local profile, and local multiplayer modes.

## V11 first expansion

- **203 catalog entries**: 192 themed legacy entries, 3 original V7 games, 5 V10 3D games, and 3 new V11 3D games.
- **35 playable engines**: 27 original 2D engines and 8 original 3D engines.
- **Eight original 3D games**:
  - **Neon Strike** — three target arenas, moving targets, streak scoring, and aim controls.
  - **Gravity Rush** — three floating courses, moving platforms, checkpoints, double jumps, and collectible shards.
  - **Velocity X** — three circuits, rival drivers, boost management, and updated arcade handling.
  - **Wildlands** — three biomes, wildlife, relics, landmarks, and a multi-region expedition.
  - **Park Empire** — four attraction types, isometric placement, visitor growth, and park-income goals.
  - **Mythic Realms** — a fantasy exploration RPG with runes, shrines, a spell ability, and a three-part quest.
  - **Trailblazer Sim** — a 3D delivery-driving challenge with route gates, steering, acceleration, and boost management.
  - **Wildcraft** — a peaceful survival-and-crafting loop built around gathering resources, making a shelter, and powering a beacon.
- The new V11 genres are **RPG & Fantasy**, **Vehicle Simulation**, and **Survival & Crafting**.
- The 3D showcase and genre discovery now lead the site experience. Existing 2D games remain available; V11 does not remove or replace the classic arcade.

## Quality-over-quantity release rule

V11 adds three games—one carefully scoped first entry for each new genre—rather than padding the catalog with many shallow variations. The goal is a more substantial game loop in each 3D world: readable controls, a clear objective, progression or replay value, responsive behavior, and clean teardown when a game closes.

The shared on-demand Three.js runtime remains pinned to version 0.164.1. The renderer is loaded only when a 3D game opens. The runtime uses local procedural geometry and does not require downloaded game assets.

No software can be honestly guaranteed bug-free. The repository validator checks JavaScript syntax, required assets, catalog counts and IDs, launch routes, V10/V11 3D entry points, and preservation of the classic modes. A real browser pass is still required for WebGL compatibility, gameplay feel, camera behavior, touch controls, and performance on actual devices before release.

## Existing arcade features retained

- Browser-local favorites, recent games, records, XP, ranks, achievements, and daily quests.
- Search, category filters, sorting, random play, and responsive desktop/mobile layout.
- Classic modes including Snake Sprint, Neon Pong, Brick Breaker, Reaction Rush, Memory Match, Number Merge, Tic-Tac-Toe, Type Blitz, Whack-a-Mole, Aim Trainer, Orbit Dodger, Tap Frenzy, Minefield, Simon Sequence, Word Scramble, Cosmic Clicker, Flappy Pixel, Math Sprint, Connect Four, Pixel Platformer, Trivia Blitz, Color Clash, Lights Out, and Maze Runner.
- Original V7 games: Rift Runner, Circuit Crafter, and Star Courier.
- Existing V8 AI and same-device modes for Tic-Tac-Toe, Connect Four, and Neon Pong remain local-only. V11 does not add online multiplayer or an account backend.

## Development workflow

- `main` is the live publishing branch.
- `massive/v10-3d-redesign` contains the V10 foundation and remains a separate draft pull request.
- `massive/v11-3d-universe` is based on the V10 branch and contains the V11 expansion. It is intentionally stacked on V10 so the V11 work can be reviewed independently without changing the published site.
- Validate with `node scripts/validate-site.cjs`.
- The GitHub Actions validation workflow checks JavaScript syntax, local assets, catalog integrity, original launch routes, all eight 3D games, and legacy local modes.
- Keep `main` unchanged until V10 and V11 have been reviewed, tested, and merged in order. V11 is not published by GitHub Pages while it remains on this branch.

## Project structure

- `index.html`: page structure and ordered script/style references.
- `styles.css`: original arcade styling.
- `v10.css`: V10 redesign and shared responsive 3D game UI.
- `v11.css`: V11 3D discovery additions.
- `catalog.js`: base engines, themes, and legacy catalog.
- `v10-catalog.js`: five original V10 3D engines and catalog entries.
- `v11-catalog.js`: upgraded descriptions plus three new 3D entries.
- `app.js`: catalog UI, local progress, shared utilities, and original 2D game-launch routing.
- `v10-runtime.js`: on-demand Three.js loader, shared 3D scene lifecycle, and V10 game foundation.
- `v11-runtime.js`: upgraded V10 worlds, three additional 3D worlds, and V11 discovery UI.
- `games/*.js`: the original 27 2D game engines.
- `scripts/validate-site.cjs`: dependency-free repository checks.
- `.github/workflows/validate.yml`: repository validation.
- `.github/workflows/pages.yml`: GitHub Pages deployment from `main`.

## Run locally

Keep the project files together and open `index.html` in a modern browser. The site has no build step. The 2D games do not depend on the 3D module; all eight 3D games require an internet connection to load the pinned Three.js module and a browser/device with WebGL support.

## Deployment

GitHub Pages deploys the repository root using `.github/workflows/pages.yml` on pushes to `main`. Changes on development branches do not publish the public site.

Public site: https://crewliambackup1-star.github.io/pixellab/

## Privacy

Favorites, recently played games, records, and Arcade Passport progress are stored locally in the current browser/device. They do not sync between devices.
