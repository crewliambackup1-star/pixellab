create index if not exists game_rooms_guest_id_idx on public.game_rooms(guest_id);
create index if not exists game_rooms_host_id_idx on public.game_rooms(host_id);
create index if not exists game_rooms_winner_id_idx on public.game_rooms(winner_id);
