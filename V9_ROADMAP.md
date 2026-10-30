# PixelLab V9 — Multiplayer Universe

V9 is a clean restart from the published V8 baseline. Development is staged and validated in smaller increments rather than one oversized change.

## Stage 1 scope
- Account sign-in/sign-up and pseudonymous profiles for online matches only.
- Private six-character room codes and invite links.
- Online Tic-Tac-Toe with database-validated moves and results.
- Participant-only recent match history.
- Solo and same-device play continue without accounts.

## Later stages
- Add validated online Connect Four.
- Add online Neon Pong after a separate server-authoritative realtime design.
- Add profile progression, XP sync, rankings, and broader match history.
- Consider public matchmaking only after private rooms have been tested and moderation/safety needs are addressed.

## Development rules
- main is the public publishing branch.
- development is the V9 work branch.
- The previous V9 attempt is preserved at backup/v9-attempt-2026-10-29.
- Run the automated validation workflow after each meaningful stage.
- Keep backend secrets out of the repository and browser code.
- See V9_SETUP.md before configuring the backend.