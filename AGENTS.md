# PixelLab project rules

## Project shape
- PixelLab is a static browser app. The published site is served from the repository root.
- There is no frontend build step. `index.html` loads `catalog.js`, `app.js`, and the individual `games/*.js` files directly.
- Keep browser-runtime code dependency-free unless the owner explicitly approves a runtime dependency. Tools used only for development and testing belong in `devDependencies`.
- Do not add test tooling, Node-only packages, or generated test reports to the deployed site.

## Safe change process
- `main` is the public GitHub Pages site. Use a separate feature/setup branch for proposed changes and review them before merging to `main`.
- The `development` branch contains separate in-progress work. Do not merge it into `main` as part of an unrelated tooling change.
- Preserve stable game IDs, local-storage keys, catalog counts, and existing game-launch routes unless the task explicitly requires changing them.
- Keep each playable engine in its own `games/*.js` file and keep its route in the `runGame` dispatcher in `app.js`.
- Do not claim online multiplayer is active unless its backend is configured and the online flow has been tested. Never place service-role keys or other secrets in browser code.
- For a setup-only task, do not change the visual design or game mechanics.

## Validation
- Run `node scripts/validate-site.cjs` for static asset, catalog, syntax, and game-route checks.
- Run `npm run test:e2e` for the Playwright browser smoke tests after installing development dependencies and Chromium.
- Browser smoke tests cover the homepage/catalog, search, and same-device Tic Tac Toe flow. They supplement—not replace—manual testing of each game and real-device/browser checks.
