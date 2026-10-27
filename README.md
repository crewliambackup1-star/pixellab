# PixelLab V3 — Your Browser Arcade

PixelLab is a responsive, no-account browser arcade. It uses a single static HTML app and a small SVG icon, so there is no build step, backend, analytics, or third-party JavaScript dependency.

## What's here

- **112 catalog entries** across arcade, puzzle, action, strategy, sports, and quick-play categories.
- Twelve playable game engines: Snake Sprint, Neon Pong, Brick Breaker, Reaction Rush, Memory Match, Number Merge, Tic Tac Toe, Type Blitz, Whack-a-Mole, Aim Trainer, Orbit Dodger, and Tap Frenzy.
- Search, category filters, sorting, random play, favorites, recently played, and per-entry best records where applicable.
- Responsive desktop/mobile layout, keyboard controls for supported games, and local browser storage for favorites/history/scores.
- No sign-in, payment, external game embeds, or build tools required.

**Catalog note:** the 112 entries are themed variants powered by 12 shared game engines, not 112 separately coded game mechanics.

## Run it

Open `index.html` in a modern browser. It is designed to work as a static site, including GitHub Pages.

## Publish on GitHub Pages

The workflow at `.github/workflows/pages.yml` deploys the repository root on each push to `main`.

1. Open this repository's **Settings → Pages** and select **GitHub Actions** as the build and deployment source if GitHub asks for an initial source selection.
2. Open the **Actions** tab and select **Deploy PixelLab to GitHub Pages**.
3. When the run finishes successfully, open the deployment URL listed in the workflow run or in Settings → Pages.

The expected project URL is:

`https://crewliambackup1-star.github.io/pixellab/`

It becomes live once the first Pages deployment completes successfully.

## Privacy and notes

Favorites, recently played games, and records are kept in local storage on the current browser/device. They do not sync between devices. A network owner may apply its own access rules to public sites.
