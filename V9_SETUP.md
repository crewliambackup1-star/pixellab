# PixelLab V9 — Multiplayer Universe

## Current status

V9 starts with online Tic-Tac-Toe. The other games keep their AI and same-device modes and remain marked as coming soon for online play until server-side move validation is implemented for each.

The account and room UI is ready, but online play stays inactive until a Supabase project is configured and the SQL migration is applied. The browser configuration accepts only a project URL and a publishable key. Never put a secret/service-role key in frontend code.

Profiles contain only a pseudonymous username, avatar key, and match counts. They do not store emails, real names, schools, locations, birthdays, or chat messages.

## Before activating public accounts

Because this is a young person's project, a parent/guardian should review and manage the Supabase project and provider account setup. The provider's Terms require the account holder to have authority to accept the agreement. Review the current terms, privacy policy, applicable age requirements, authentication/email settings, and data retention before enabling registration. Test privately first and collect only the data the game needs.

## Configure Supabase

1. Create a Supabase project with parent/guardian help as appropriate, then open its SQL Editor.
2. Review and run supabase/migrations/001_multiplayer_universe.sql. It explicitly revokes broad defaults and grants only the table permissions the client needs. Supabase is changing its default Data API exposure on October 30, 2026, so explicit grants matter for new projects and existing projects after that date.
3. Configure email/password authentication and confirmation. Add the GitHub Pages URL to allowed site/redirect URLs: https://crewliambackup1-star.github.io/pixellab/ (use the exact project-page URL shown in your browser).
4. In the Supabase Dashboard, confirm the public schema is exposed to the Data API so the explicitly granted tables and RPC functions can be reached. The migration does not grant broad table access: profiles are readable to signed-in users, room rows are readable only to their two participants, and room writes go through validated RPC functions.
5. In backend-config.js, set url to your project URL and publishableKey to the project's publishable browser key. These are public client values. Never use a secret/service-role key.
6. In Realtime settings, make sure the rooms table is available for Postgres Changes. Keep room reads protected by the migration's RLS policy.
7. Test signup, confirmation, sign-in, sign-out, password reset, create/join, turns, two-player results, reload/reconnect, and leaving a room in two separate browser profiles. Do not announce online play as ready until tests pass.

## Security notes

- The database function make_ttt_move checks player membership, turn order, square validity, and win/draw results. Browser clients cannot directly insert or update room rows.
- A room code is not authentication: every player must sign in, and only its two assigned accounts can read the room.
- Do not add open text chat in the first public version.
- Supabase's docs explain pairing Auth with row-level security and restricting Realtime access: https://supabase.com/docs/guides/auth and https://supabase.com/docs/guides/realtime/authorization.

## Roadmap

1. V9 foundation: account UI, private room codes, and secure online Tic-Tac-Toe.
2. Add online Connect Four and Neon Pong after validated server-side move functions are implemented for each.
3. Add history, XP sync, and rankings after result integrity and anti-cheat checks are tested.
