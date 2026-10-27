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
| `catalog.js` | 24 original engines, 8 themes, and the 3 PixelLab originals |
| `app.js` | Search, filters, local progress, shared utilities, and launch routing |
| `games/*.js` | One engine per file (27 total) |
| `scripts/validate-site.cjs` | Automated checks without npm packages |
| `.github/workflows/validate.yml` | Test workflow for branches and pull requests |
| `.github/workflows/pages.yml` | Live GitHub Pages validation and deployment |

## What validation checks

The validation script parses every JavaScript file, checks required local assets, verifies the 24 × 8 + 3 = 195 catalog structure, and confirms that all 27 launch routes lead to a matching game file. It intentionally uses only Node.js built-ins, so no dependency installation or package manager is required.

A passing check catches common wiring and syntax mistakes; it cannot replace playing each game in a browser.

## Recovery

The public site is deployed from `main`. The `backup/v7-stable-2026-10-27` branch preserves the pre-setup V7 version and should remain untouched. If a future update breaks the live site, compare `main` with that backup branch and restore the affected files or revert the problematic commit; do not delete project history.

## Multiplayer note

GitHub Pages remains suitable for hosting the frontend. Actual live multiplayer will still require a separate realtime backend or multiplayer service; that should be chosen when the multiplayer feature is planned, rather than adding an unused service now.
