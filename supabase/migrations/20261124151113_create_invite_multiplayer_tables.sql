create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique check (room_code ~ '^[A-F0-9]{10}$'),
  game_id text not null check (game_id in ('tictactoe', 'connect4')),
  host_id uuid not null references auth.users(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'completed', 'cancelled')),
  turn smallint not null default 1 check (turn in (1, 2)),
  state jsonb not null,
  winner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  constraint game_rooms_distinct_players check (guest_id is null or guest_id <> host_id)
);

create table if not exists public.game_room_members (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_number smallint not null check (player_number in (1, 2)),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, player_number)
);

create index if not exists game_room_members_user_room_idx
  on public.game_room_members (user_id, room_id);
create index if not exists game_rooms_status_expiry_idx
  on public.game_rooms (status, expires_at);

alter table public.game_rooms enable row level security;
alter table public.game_room_members enable row level security;

revoke all on table public.game_rooms from anon, authenticated;
revoke all on table public.game_room_members from anon, authenticated;
grant select on table public.game_rooms to authenticated;
grant select on table public.game_room_members to authenticated;

create or replace function public.pl_multiplayer_is_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.game_room_members as m
    where m.room_id = p_room_id
      and m.user_id = (select auth.uid())
  );
$$;
revoke all on function public.pl_multiplayer_is_member(uuid) from public, anon;
grant execute on function public.pl_multiplayer_is_member(uuid) to authenticated;

drop policy if exists "PixelLab members can read their rooms" on public.game_rooms;
create policy "PixelLab members can read their rooms"
  on public.game_rooms for select to authenticated
  using (public.pl_multiplayer_is_member(id));

drop policy if exists "PixelLab users can read their own room membership" on public.game_room_members;
create policy "PixelLab users can read their own room membership"
  on public.game_room_members for select to authenticated
  using (user_id = (select auth.uid()));
