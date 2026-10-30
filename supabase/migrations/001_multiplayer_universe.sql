-- PixelLab V9 — Multiplayer Universe (fresh V9 implementation)
-- First online game: Tic-Tac-Toe. Apply this migration to a NEW Supabase project.
-- Do not place a Supabase secret/service-role key in the browser application.

grant usage on schema public to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,16}$'),
  avatar_key text not null default 'pixel'
    check (avatar_key in ('pixel','spark','comet','bolt','orbit','wave')),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from public, anon, authenticated;
grant select, update (username, avatar_key) on table public.profiles to authenticated;

drop policy if exists "Signed-in players can read profiles" on public.profiles;
create policy "Signed-in players can read profiles"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Players update their own profile" on public.profiles;
create policy "Players update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.create_pixel_lab_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $profile$
declare
  v_username text;
begin
  v_username := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  if v_username !~ '^[a-z0-9_]{3,16}$' then
    raise exception 'Choose a username with 3–16 letters, numbers, or underscores.';
  end if;
  insert into public.profiles (id, username) values (new.id, v_username);
  return new;
end;
$profile$;

drop trigger if exists on_pixel_lab_user_created on auth.users;
create trigger on_pixel_lab_user_created
  after insert on auth.users
  for each row execute function public.create_pixel_lab_profile();
revoke all on function public.create_pixel_lab_profile() from public, anon, authenticated;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  game_id text not null default 'tictactoe' check (game_id = 'tictactoe'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'waiting'
    check (status in ('waiting','playing','finished')),
  board jsonb not null default '["","","","","","","","",""]'::jsonb
    check (jsonb_typeof(board) = 'array' and jsonb_array_length(board) = 9),
  turn_user_id uuid references auth.users(id) on delete set null,
  winner_user_id uuid references auth.users(id) on delete set null,
  is_draw boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours'),
  check (guest_user_id is null or guest_user_id <> host_user_id)
);

create index if not exists rooms_code_status_idx on public.rooms (code, status);
create index if not exists rooms_host_created_idx on public.rooms (host_user_id, created_at desc);
create index if not exists rooms_guest_created_idx on public.rooms (guest_user_id, created_at desc);
alter table public.rooms enable row level security;
revoke all on table public.rooms from public, anon, authenticated;
grant select on table public.rooms to authenticated;

drop policy if exists "Only room participants can read rooms" on public.rooms;
create policy "Only room participants can read rooms"
  on public.rooms for select to authenticated
  using ((select auth.uid()) = host_user_id or (select auth.uid()) = guest_user_id);

create table if not exists public.match_history (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique,
  game_id text not null default 'tictactoe' check (game_id = 'tictactoe'),
  player_x uuid not null references public.profiles(id) on delete cascade,
  player_o uuid not null references public.profiles(id) on delete cascade,
  winner_user_id uuid references public.profiles(id) on delete set null,
  is_draw boolean not null default false,
  created_at timestamptz not null default now(),
  check (player_x <> player_o),
  check ((is_draw and winner_user_id is null) or (not is_draw and winner_user_id in (player_x, player_o)))
);
create index if not exists match_history_player_x_idx on public.match_history (player_x, created_at desc);
create index if not exists match_history_player_o_idx on public.match_history (player_o, created_at desc);
alter table public.match_history enable row level security;
revoke all on table public.match_history from public, anon, authenticated;
grant select on table public.match_history to authenticated;

drop policy if exists "Players read only their match history" on public.match_history;
create policy "Players read only their match history"
  on public.match_history for select to authenticated
  using ((select auth.uid()) = player_x or (select auth.uid()) = player_o);

create or replace function public.create_private_ttt_room()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $create_room$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_room public.rooms%rowtype;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_attempt integer;
  v_index integer;
  i integer;
begin
  if v_uid is null then raise exception 'Sign in to create a room.'; end if;

  perform pg_advisory_xact_lock(hashtext(v_uid::text));
  if exists (
    select 1 from public.rooms
    where expires_at > now()
      and status in ('waiting','playing')
      and (host_user_id = v_uid or guest_user_id = v_uid)
  ) then
    raise exception 'You already have an active room. Resume it or leave it first.';
  end if;

  for v_attempt in 1..20 loop
    v_code := '';
    for i in 1..6 loop
      v_index := floor(random() * length(v_alphabet))::integer + 1;
      v_code := v_code || substr(v_alphabet, v_index, 1);
    end loop;

    begin
      insert into public.rooms (code, host_user_id, turn_user_id)
        values (v_code, v_uid, v_uid)
        returning * into v_room;
      return to_jsonb(v_room);
    exception when unique_violation then
      if v_attempt = 20 then
        raise exception 'Could not create a unique room code. Please try again.';
      end if;
    end;
  end loop;
  raise exception 'Could not create a room.';
end;
$create_room$;

create or replace function public.join_private_ttt_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $join_room$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
begin
  if v_uid is null then raise exception 'Sign in to join a room.'; end if;
  if p_code is null or p_code !~ '^[A-HJ-NP-Z2-9]{6}$' then
    raise exception 'Enter a valid six-character room code.';
  end if;

  select * into v_room
    from public.rooms
    where code = upper(trim(p_code)) and expires_at > now()
    for update;

  if not found then raise exception 'That room was not found or has expired.'; end if;
  if v_room.host_user_id = v_uid then return to_jsonb(v_room); end if;
  if v_room.status <> 'waiting' or v_room.guest_user_id is not null then
    raise exception 'That room is full or the match has already started.';
  end if;
  if exists (
    select 1 from public.rooms
    where expires_at > now() and status in ('waiting','playing')
      and (host_user_id = v_uid or guest_user_id = v_uid)
  ) then
    raise exception 'You already have an active room. Leave it before joining another.';
  end if;

  update public.rooms
    set guest_user_id = v_uid, status = 'playing',
        turn_user_id = host_user_id, updated_at = now()
    where id = v_room.id
    returning * into v_room;
  return to_jsonb(v_room);
end;
$join_room$;

create or replace function public.make_ttt_move(p_room_id uuid, p_cell integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $ttt_move$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_board jsonb;
  v_mark text;
  v_won boolean := false;
  v_draw boolean := false;
  v_opponent uuid;
begin
  if v_uid is null then raise exception 'Sign in to play.'; end if;
  if p_cell is null or p_cell < 0 or p_cell > 8 then
    raise exception 'Choose a valid square.';
  end if;

  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then raise exception 'This room no longer exists.'; end if;
  if v_room.expires_at <= now() then raise exception 'This room has expired.'; end if;
  if v_room.status <> 'playing' or v_room.guest_user_id is null then
    raise exception 'Waiting for a second player.';
  end if;
  if v_uid not in (v_room.host_user_id, v_room.guest_user_id) then
    raise exception 'You are not a player in this room.';
  end if;
  if v_room.turn_user_id <> v_uid then raise exception 'It is the other player''s turn.'; end if;

  v_mark := case when v_uid = v_room.host_user_id then 'X' else 'O' end;
  v_opponent := case when v_uid = v_room.host_user_id then v_room.guest_user_id else v_room.host_user_id end;
  v_board := v_room.board;
  if v_board ->> p_cell <> '' then raise exception 'That square is already taken.'; end if;
  v_board := jsonb_set(v_board, array[p_cell::text], to_jsonb(v_mark), false);

  v_won :=
    ((v_board->>0) = v_mark and (v_board->>1) = v_mark and (v_board->>2) = v_mark) or
    ((v_board->>3) = v_mark and (v_board->>4) = v_mark and (v_board->>5) = v_mark) or
    ((v_board->>6) = v_mark and (v_board->>7) = v_mark and (v_board->>8) = v_mark) or
    ((v_board->>0) = v_mark and (v_board->>3) = v_mark and (v_board->>6) = v_mark) or
    ((v_board->>1) = v_mark and (v_board->>4) = v_mark and (v_board->>7) = v_mark) or
    ((v_board->>2) = v_mark and (v_board->>5) = v_mark and (v_board->>8) = v_mark) or
    ((v_board->>0) = v_mark and (v_board->>4) = v_mark and (v_board->>8) = v_mark) or
    ((v_board->>2) = v_mark and (v_board->>4) = v_mark and (v_board->>6) = v_mark);

  select not exists (
    select 1 from generate_series(0, 8) as cell(i)
    where v_board ->> i = ''
  ) into v_draw;

  if v_won then
    update public.rooms
      set board = v_board, status = 'finished', winner_user_id = v_uid,
          is_draw = false, updated_at = now()
      where id = p_room_id returning * into v_room;
    update public.profiles set wins = wins + 1, updated_at = now() where id = v_uid;
    update public.profiles set losses = losses + 1, updated_at = now() where id = v_opponent;
    insert into public.match_history (room_id, game_id, player_x, player_o, winner_user_id, is_draw)
      values (p_room_id, 'tictactoe', v_room.host_user_id, v_room.guest_user_id, v_uid, false);
  elsif v_draw then
    update public.rooms
      set board = v_board, status = 'finished', winner_user_id = null,
          is_draw = true, updated_at = now()
      where id = p_room_id returning * into v_room;
    update public.profiles set draws = draws + 1, updated_at = now()
      where id in (v_room.host_user_id, v_room.guest_user_id);
    insert into public.match_history (room_id, game_id, player_x, player_o, winner_user_id, is_draw)
      values (p_room_id, 'tictactoe', v_room.host_user_id, v_room.guest_user_id, null, true);
  else
    update public.rooms
      set board = v_board,
          turn_user_id = v_opponent,
          updated_at = now()
      where id = p_room_id returning * into v_room;
  end if;
  return to_jsonb(v_room);
end;
$ttt_move$;

create or replace function public.leave_private_ttt_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $leave_room$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
begin
  if v_uid is null then raise exception 'Sign in first.'; end if;
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then return true; end if;

  if v_room.host_user_id = v_uid then
    delete from public.rooms where id = p_room_id;
  elsif v_room.guest_user_id = v_uid then
    update public.rooms
      set guest_user_id = null, status = 'waiting',
          board = '["","","","","","","","",""]'::jsonb,
          turn_user_id = host_user_id, winner_user_id = null,
          is_draw = false, updated_at = now()
      where id = p_room_id;
  else
    raise exception 'You are not a player in this room.';
  end if;
  return true;
end;
$leave_room$;

revoke all on function public.create_private_ttt_room() from public, anon;
revoke all on function public.join_private_ttt_room(text) from public, anon;
revoke all on function public.make_ttt_move(uuid, integer) from public, anon;
revoke all on function public.leave_private_ttt_room(uuid) from public, anon;
grant execute on function public.create_private_ttt_room() to authenticated;
grant execute on function public.join_private_ttt_room(text) to authenticated;
grant execute on function public.make_ttt_move(uuid, integer) to authenticated;
grant execute on function public.leave_private_ttt_room(uuid) to authenticated;

do $realtime$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'rooms'
     ) then
    execute 'alter publication supabase_realtime add table public.rooms';
  end if;
end;
$realtime$;
