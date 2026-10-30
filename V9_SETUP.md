# PixelLab V9 — Clean Restart

V9 is being rebuilt from the published V8 version in small stages. This first stage is focused on the account foundation, private rooms, and online Tic-Tac-Toe. Connect Four and Neon Pong remain local/AI games until their online rules are added and tested separately.

## What the first stage contains

- Accounts are required only for online matches. Solo and same-device play remain guest-accessible.
- Usernames are pseudonymous: no public real names, schools, locations, or public chat.
- Private six-character room codes and shareable invite links.
- Database-validated Tic-Tac-Toe turns, win/draw results, and participant-only match history.
- Online play is intentionally disabled until a Supabase project is configured and tested.

## Adult-managed project setup

A Supabase Cloud project requires accepting Supabase's Terms, which state that the customer represents they have the right, power, and authority to enter the agreement. A parent/guardian should review the terms and manage the project setup for this teen-built site. The current terms are at https://supabase.com/terms.

Before enabling registration, the project owner should review the current provider terms, privacy policy, age-related requirements, account recovery settings, and data-retention settings. Keep the first test private and do not invite the public until account and room security have been tested.

## Configure Supabase

1. Create a Supabase project with the adult project owner.
2. Review and run supabase/migrations/001_multiplayer_universe.sql in the Supabase SQL Editor.
3. In the project's Data API settings, expose the public schema (or confirm it is exposed). The migration enables RLS and explicitly grants the client only the table permissions needed.
4. Configure Email/Password authentication and email confirmation. Add the exact project Pages URL to the allowed site and redirect URL settings: https://crewliambackup1-star.github.io/pixellab/
5. Open backend-config.js and set the project URL and publishable browser key. Use only a publishable/anon client key, never a secret or service-role key.
6. Confirm the rooms table is enabled for Supabase Realtime/Postgres Changes.
7. Test sign-up, confirmation, sign-in/out, password recovery, profile editing, create/join, turn validation, win/draw recording, refresh/resume, and leaving rooms in two separate browser profiles.

## Security model

- Row Level Security is enabled for profiles, rooms, and match history.
- Signed-in players can read pseudonymous profiles. A player may update only their own username/avatar; match statistics are changed only by database functions.
- Room rows are readable only by the room's host and guest.
- Client roles cannot insert, update, or delete room rows directly. RPC functions validate membership, turn order, square availability, and game results.
- Room codes are invitations, not authentication. Each player must still sign in.
- Match history can be read only by its two participants.
- No open text chat or public matchmaking in this stage.

Supabase's official guidance explains how grants and RLS work together, and how Realtime filters database changes through RLS:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/realtime/subscribing-to-database-changes

## Release checklist

Do not mark online play ready until:
- the migration has been applied successfully;
- the project URL and publishable key are configured;
- auth redirects and email confirmation work;
- two separate signed-in browser sessions can create/join a room and finish a game;
- nonparticipants cannot read the room;
- invalid/out-of-turn moves are rejected by the database;
- reload, reconnect, leave, and expiry cases have been tested.
