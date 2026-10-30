# PixelLab V9 — Multiplayer Universe

PixelLab is a responsive browser arcade. Solo and same-device games need no account; online rooms require a configured account backend. The site is static and has no build step; the account feature loads the Supabase JavaScript client from its CDN.

## What is included

- **195 catalog entries** across **27 playable game engines**: the existing 192 themed catalog variants plus 3 original games.
- Classic modes: Snake Sprint, Neon Pong, Brick Breaker, Reaction Rush, Memory Match, Number Merge, Tic Tac Toe, Type Blitz, Whack-a-Mole, Aim Trainer, Orbit Dodger, and Tap Frenzy.
- Update 4 adds: **Minefield, Simon Sequence, Word Scramble, Cosmic Clicker, Flappy Pixel, Math Sprint, Connect Four, Pixel Platformer, Trivia Blitz, Color Clash, Lights Out, and Maze Runner**.
- Update 4 arcade styling, upgraded game cards, clearer catalog discovery, and a **Daily Drop** pick.
- **V5 Arcade Passport:** browser-local XP, levels, five rank tiers, achievements, and three daily quests with bonus XP.
- Finished runs reward XP; personal records, run milestones, and trying different game engines help unlock achievements.
- Fixed Orbit Dodger's displayed survival timer so it tracks elapsed gameplay time correctly.
- **V6 Gameplay Overhaul:** Snake bonus fruit, Brick Breaker power-ups and extra lives, Orbit Dodger shields and ramping challenge, and Flappy Pixel bonus stars with tighter gates.
- Maze Runner now generates a fresh maze each run with optional gems to collect.
- Connect Four's CPU evaluates winning threats and developing lines instead of relying mostly on center-column preference.
- **V7 Original Games:** Rift Runner (phase-shifting platformer), Circuit Crafter (rotating circuit-routing puzzle), and Star Courier (cargo delivery through moving patrol drones).
- The three original games appear in both the **Recommended** and **Popular** filters, alongside curated existing favorites.
- **V8 Local Multiplayer:** Tic-Tac-Toe, Connect Four, and Neon Pong offer AI matches or two-player same-device play.
- **V9 Multiplayer Universe foundation:** account/profile UI, private six-character room codes, invite links, and the first online Tic-Tac-Toe flow. Online features remain inactive until a Supabase project is configured and the reviewed SQL migration is applied. Connect Four and Neon Pong keep online mode disabled until their own server-side move validation is ready.
- Public profiles use pseudonymous usernames, match stats, and recent online results. Completed match history is visible only to its two participants; there is no public chat. See V9_SETUP.md before configuring a backend.
- Existing catalog IDs remain stable so browser-local favorites, recent-play history, and per-game records for the original catalog are preserved.
- Search, category filters, sorting, random play, favorites, recently played, and local game records.
- Responsive desktop/mobile layout, keyboard controls where supported, and browser-local saved favorites/history/records.
- Single-player and same-device play need no account or backend. Online multiplayer remains inactive until the backend is configured and tested. See V9_SETUP.md before activation.

**Catalog note:** the first 192 entries are theme/visual variants across the original 24 engines; the 3 V7 originals are separately implemented games.

## Development workflow

- `main` is the live publishing branch.
- `development` is the work-in-progress branch for changes and experiments.
- `backup/v7-stable-2026-10-27` preserves the V7 site as a recovery point.
- The automated validation workflow checks JavaScript syntax, required files, unique catalog IDs, the 195-entry catalog, launch routes, and V9 backend/config guardrails. Ten visual theme presets are defined; the published legacy catalog remains capped at 192 themed entries.
- Keep changes on `development`, wait for validation to pass, then merge a reviewed pull request into `main` to publish.

## Project structure

- `index.html`: page structure and the ordered script/style references.
- `backend-config.js`: blank public Supabase URL/key configuration; never store a secret key here.
- `multiplayer.js`: account, profile, room-code, Realtime subscription, and online Tic-Tac-Toe UI.
- `supabase/migrations/001_multiplayer_universe.sql`: profile/room tables, RLS, and server-validated room functions.
- `V9_SETUP.md`: backend setup and private testing checklist.
- `styles.css`: all site styling.
- `catalog.js`: base engines, visual themes, and generated catalog entries.
- `app.js`: catalog UI, local progress, shared utilities, and game-launch routing.
- `games/*.js`: one file per playable game engine.
- `scripts/validate-site.cjs`: dependency-free repository checks.
- `.github/workflows/validate.yml`: runs validation on pushes to `main` / `development` and pull requests into `main`.
- `.github/workflows/pages.yml`: validates and deploys `main` to GitHub Pages.

## Run locally

Keep the project files together, then open `index.html` in a modern browser. The site has no build step and no third-party browser libraries.

## Deployment

GitHub Pages deploys the repository root using `.github/workflows/pages.yml` on pushes to `main`. Changes on `development` do not publish to the public site.

Public site: https://crewliambackup1-star.github.io/pixellab/

## Privacy

Favorites, recently played games, and records are stored locally in your current browser/device. They do not sync between devices.
