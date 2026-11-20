# PixelLab Development Guide

This guide records the project structure and the automated checks used before publishing updates.

## Which branch is which?

- **main** — public website. A push here triggers GitHub Pages deployment.
- **development** — separate in-progress work and testing.
- **backup/v7-stable-2026-10-27** — recovery point from October 27, 2026.

Use a separate feature branch for a proposed change. Do not use a backup branch as a work branch. Review changes and make sure the automated checks pass before merging into `main`.

## Where code lives

| File or folder | Purpose |
| --- | --- |
| `index.html` | HTML structure and script/style loading order |
| `styles.css` | All visual styling |
| `catalog.js` | 24 base engines, 10 themes, and 3 PixelLab originals |
| `app.js` | Search, filters, local progress, shared utilities, and launch routing |
| `games/*.js` | One engine per file (27 total) |
| `scripts/validate-site.cjs` | Dependency-free static validation |
| `tests/*.spec.cjs` | Playwright browser smoke tests |
| `playwright.config.cjs` | Browser test and local static-server configuration |
| `package.json` | Development-only test tooling; not used by the live site |
| `.github/workflows/validate.yml` | Static validation on branches and pull requests |
| `.github/workflows/playwright.yml` | Chromium browser tests on pushes and pull requests |
| `.github/workflows/pages.yml` | Validation and GitHub Pages deployment |

## Automated checks

### Static validation

Run:

```sh
node scripts/validate-site.cjs
```

The validator checks required local assets, parses every JavaScript file, verifies the 195-entry catalog, and confirms that all 27 launch routes lead to a matching game file. It uses Node.js built-ins and does not need npm packages.

### Browser smoke tests

Run locally after installing the development-only dependency and Chromium:

```sh
npm install --no-package-lock --no-audit --no-fund
npx playwright install chromium
npm run test:e2e
```

The current Chromium suite checks that the homepage renders all 195 catalog entries without page-level JavaScript errors, the Daily Drop is initialized and launches its selected game, search filters the catalog, and Tic-Tac-Toe supports two players on one device while the unfinished online-room button remains disabled.

GitHub Actions runs these browser tests automatically on pushes to `main` or `development`, pull requests targeting `main`, and manual workflow dispatches. The HTML report and test artifacts are retained in the Actions run for 14 days. Local Node installation is optional: the GitHub-hosted workflow runs the tests without requiring Node on your Mac.

Dependabot checks the npm development dependency and GitHub Actions versions weekly and can open update pull requests for review.

These are smoke tests, not a guarantee that every game mechanic is bug-free. Each game still needs hands-on playtesting, and Chromium testing does not replace checks on Safari, Firefox, or real phones.

## Runtime dependency rule

PixelLab remains a static website with no frontend build step and no third-party JavaScript runtime dependencies. Playwright is a development-only dependency and is never loaded by the public site.

## Recovery

The public site is deployed from `main`. The `backup/v7-stable-2026-10-27` branch preserves the earlier V7 version and should remain untouched. If a future update breaks the live site, compare `main` with a backup branch and restore affected files or revert the problematic commit; do not delete project history.

## Multiplayer note

The first multiplayer phase adds **AI or same-device play** to Tic-Tac-Toe, Connect Four, and Neon Pong. The mode picker shows online rooms as coming soon rather than pretending they work. Online rooms across devices need a configured realtime backend and separate browser/device testing.

GitHub Pages hosts only the static frontend; it cannot keep live game rooms synchronized between separate devices by itself. Never place a service-role key or other private secret in browser code.
