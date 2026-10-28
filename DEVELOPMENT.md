# PixelLab Development Guide

This guide records the setup so routine updates can be made without hand-editing files.

## Which branch is which?

- **main** — public website. A push here triggers GitHub Pages deployment.
- **development** — safe place for upcoming changes and testing.
- **backup/v7-stable-2026-10-27** — untouched V7 recovery point from October 27, 2026.

New work should start from `development`. Do not use the backup branch as a work branch. Once checks pass and a change is reviewed, merge it into `main` to publish.

## Where code lives

| File or folder | Purpose |
| --- | --- |
| `index.html` | HTML structure and script/style loading order |
| `styles.css` | All visual styling |
| `catalog.js` | 24 original engines, 10 themes, and the 3 PixelLab originals |
| `app.js` | Search, filters, local progress, shared utilities, and launch routing |
| `games/*.js` | One engine per file (27 total) |
| `scripts/validate-site.cjs` | Automated checks without npm packages |
| `.github/workflows/validate.yml` | Test workflow for branches and pull requests |
| `.github/workflows/pages.yml` | Live GitHub Pages validation and deployment |

## What validation checks

The validation script parses every JavaScript file, checks required local assets, verifies that the 192 legacy catalog variants plus 3 originals total 195 entries (the code defines 10 visual theme presets), and confirms that all 27 launch routes lead to a matching game file. It intentionally uses only Node.js built-ins, so no dependency installation or package manager is required.

A passing check catches common wiring and syntax mistakes; it cannot replace playing each game in a browser.

## Recovery

The public site is deployed from `main`. The `backup/v7-stable-2026-10-27` branch preserves the pre-setup V7 version and should remain untouched. If a future update breaks the live site, compare `main` with that backup branch and restore the affected files or revert the problematic commit; do not delete project history.

## Multiplayer note

The first multiplayer phase adds **AI or same-device play** to Tic-Tac-Toe, Connect Four, and Neon Pong. The mode picker shows online rooms as coming soon rather than pretending they work. Neon Pong and more games can be adapted in later phases.

GitHub Pages hosts only the static frontend; it cannot keep live game rooms synchronized between separate devices by itself. Online room codes, invitations, reconnect handling, and shared game state require a realtime backend or multiplayer service. Choose and configure that service before enabling online-room buttons.
