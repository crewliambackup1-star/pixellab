# PixelLab V12.2 — Online Multiplayer

V12.2 adds optional account-based online multiplayer to the existing V12 + V12.1 gameplay foundation. The 203-entry catalog and all 35 game engines remain intact.

PixelLab is a responsive browser arcade. V12 is a gameplay-first overhaul built on the V11 release: make the existing games more enjoyable through deeper mechanics, clearer feedback, stronger controls, and visual polish. It improves the existing catalog rather than adding games just to increase the count.

## V12 update scope

- **203 catalog entries and 35 playable engines** remain the target.
- **75% of gameplay/graphics effort goes to the eight original 3D games.**
- **25% goes to the other 27 playable engines.**
- All eight 3D worlds receive game-specific mechanics upgrades, plus shared pause/resume, control, and visual polish.
- All 27 non-3D engines receive individual quality-of-life, progression, scoring, hint, replay, or difficulty improvements.
- V12.2 adds an optional Supabase account and private invite-room backend for selected games. Existing local AI and same-device play remain available without an account.

### 3D gameplay changes

- **Neon Strike** — target value tiers, streak rewards, and an escalating target pace.
- **Gravity Rush** — the exit portal now requires at least three energy shards.
- **Velocity X** — three-track racing with two rivals, lap and position tracking, boost management, contact, and racing-line control.
- **Wildlands** — wildlife observation and more reactive animals.
- **Park Empire** — attraction variety rewards, visitor movement toward rides, and clearer park rating/placement feedback.
- **Mythic Realms** — spell cooldown and shrine-awakening feedback.
- **Trailblazer Sim** — deliveries require controlled braking at each stop.
- **Wildcraft** — optional campfire crafting for a bonus objective.
- Shared 3D runtime — pause/resume via the on-screen control or P key, paused world time, improved touch targets, focus states, and visual feedback.

### Other gameplay changes

The 27 non-3D engines receive tailored upgrades: dashing, free puzzle hints, delivery combos, best-of-three reaction runs, timed memory combos, shrinking aim targets, faster target waves, timed bonus surges, typing accuracy and streaks, AI difficulty levels, one-use undo, progressive speed, adaptive opponents, multi-wave play, near-miss scoring, protected first reveals, faster memory sequences, extra-letter hints, clicker surges, a recoverable flight shield, math progression, strategy hints, platform checkpoints, trivia/color combos, Lights Out solution hints, and maze speed-run timing.

## V11 foundation retained

V11 introduced the 3D-first discovery experience and expanded the catalog to 203 entries:

- **Eight original 3D games**: Neon Strike, Gravity Rush, Velocity X, Wildlands, Park Empire, Mythic Realms, Trailblazer Sim, and Wildcraft.
- New genres: **RPG & Fantasy**, **Vehicle Simulation**, and **Survival & Crafting**.
- Existing 2D games, local player progress, local favorites/recent history/records/XP, and same-device multiplayer remain available.
- Three.js remains pinned to version 0.164.1 and is loaded only when a 3D game opens. The 3D worlds use procedural geometry.


## V12.2 — Online multiplayer

V12.2 adds cross-device, turn-based play to **Tic-Tac-Toe** and **Connect Four**.

- Players create a free account using email and password. Email confirmation may be required by the Supabase project.
- A signed-in player creates a private room and shares its 10-character invite code. The second player joins with that code.
- Rooms support two players and expire after two hours. The server validates whose turn it is, legal squares/columns, and win/draw outcomes before saving moves.
- Supabase Realtime broadcasts room updates to both players. Room tables have Row Level Security; browser code uses only the project's publishable key.
- No public matchmaking, chat, voice, or friend directory is included. Neon Pong keeps AI and same-device modes for now; real-time Pong is deliberately deferred.
- Offline play, local AI, same-device play, favorites, recent games, and browser-local Arcade Passport progress are retained.

### Required Supabase dashboard settings

Before enabling the V12.2 build publicly:

1. In **Authentication → URL Configuration**, set the Site URL to `https://crewliambackup1-star.github.io/pixellab/` and include that same address in the allowed Redirect URLs.
2. In **Realtime → Settings**, turn off **Allow public access** so the private room channels and their RLS policies are enforced.
3. Keep email/password sign-in enabled. Leave email confirmation enabled unless you intentionally choose a different account policy.

The database migrations applied to the linked Supabase project are tracked in `supabase/migrations/`. No service-role or secret key is included in the website. The account is optional for all non-online/offline game modes.

## Quality and testing

No software can be honestly guaranteed bug-free. V12 validation checks JavaScript syntax, required assets, catalog counts and IDs, all original launch routes, V12 feature markers across all 35 engines, and shared 3D pause lifecycle.

The Chromium browser suite checks the homepage and Daily Drop, search, same-device Tic-Tac-Toe, launch/close of all 27 non-3D engines, and startup/pause behavior or graceful load failure across all eight 3D worlds.

Automated checks are not a substitute for hands-on gameplay. WebGL compatibility, touch handling, balance, camera behavior, and performance still need manual checks on supported browsers and actual devices before the release is considered complete.

## Development workflow

- `main` is the live publishing branch and remains on V11 during V12 development.
- `gameplay/v12-overhaul` contains the V12 work and is based on the V11 live commit.
- Validate with `node scripts/validate-site.cjs`.
- Run browser tests with `npm run test:e2e` after installing the development-only Playwright package and Chromium.
- GitHub Pages deploys from `main`; feature branches do not publish the public site.

## Project structure

- `index.html`: page structure and ordered script/style references.
- `styles.css`: original arcade styling.
- `v10.css`: V10 redesign and shared responsive 3D game UI.
- `v11.css`: V11 3D discovery additions.
- `v12.css`: V12 shared gameplay polish, pause controls, focus states, and responsive controls.
- `multiplayer.js` / `multiplayer.css`: Supabase Auth lobby, private invite rooms, and shared online-game UI.
- `supabase/migrations/`: checked-in SQL for the V12.2 room schema, RPCs, realtime authorization, and indexes.
- `catalog.js`: base engines, themes, and legacy catalog.
- `v10-catalog.js`: five original V10 3D engines and catalog entries.
- `v11-catalog.js`: upgraded descriptions plus three new 3D entries.
- `app.js`: catalog UI, local progress, shared utilities, and game-launch routing.
- `v10-runtime.js`: on-demand Three.js loader, shared 3D scene lifecycle, and V12 pause/resume system.
- `v11-runtime.js`: eight 3D worlds with V12 foundations and V12.1 game-specific gameplay upgrades.
- `games/*.js`: the 27 non-3D game engines with V12 and V12.1 gameplay changes.
- `V12-AUDIT.md`: V12 and V12.1 source audits and release gates.
- `scripts/validate-site.cjs`: dependency-free repository checks.
- `tests/smoke.spec.cjs`: Chromium browser regression tests.
- `.github/workflows/validate.yml`, `.github/workflows/playwright.yml`, and `.github/workflows/pages.yml`: validation, browser testing, and GitHub Pages deployment.

## Run locally

Keep the project files together and open `index.html` in a modern browser. The public site has no frontend build step. The 2D games run without loading the 3D library; 3D games need an internet connection for the pinned Three.js module and a device/browser with WebGL support.

To run the browser suite locally with Node.js:

```sh
npm install --no-package-lock --no-audit --no-fund
npx playwright install chromium
npm run test:e2e
```

## Deployment

GitHub Pages deploys the repository root using `.github/workflows/pages.yml` on pushes to `main`. V12.2 is developed on `multiplayer/v12-2-supabase` and is not live until its draft pull request is reviewed, the automated checks pass, the Supabase dashboard settings above are confirmed, and it is merged into `main`.

Public site: https://crewliambackup1-star.github.io/pixellab/

## Privacy

Favorites, recently played games, records, and Arcade Passport progress remain stored locally in the current browser/device. Online room state and account credentials are handled by Supabase; email addresses are not shown to opponents. Room expiration prevents joining after two hours but does not by itself delete historical rows.
