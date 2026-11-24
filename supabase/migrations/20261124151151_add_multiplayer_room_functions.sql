create or replace function public.create_game_room(p_game_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_room public.game_rooms%rowtype;
  v_attempt integer;
  v_state jsonb;
begin
  if v_uid is null then
    raise exception 'Sign in to create a private game room.';
  end if;
  if p_game_id not in ('tictactoe', 'connect4') then
    raise exception 'Online rooms are not available for this game.';
  end if;

  if p_game_id = 'tictactoe' then
    v_state := jsonb_build_object('board', jsonb_build_array('', '', '', '', '', '', '', '', ''));
  else
    v_state := jsonb_build_object('board', to_jsonb(array_fill(0, array[42])));
  end if;

  for v_attempt in 1..10 loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    insert into public.game_rooms (room_code, game_id, host_id, state)
    values (v_code, p_game_id, v_uid, v_state)
    on conflict (room_code) do nothing
    returning * into v_room;
    exit when found;
  end loop;
  if v_room.id is null then
    raise exception 'Could not create a unique room code. Please try again.';
  end if;

  insert into public.game_room_members (room_id, user_id, player_number)
  values (v_room.id, v_uid, 1);

  return jsonb_build_object(
    'id', v_room.id, 'room_code', v_room.room_code, 'game_id', v_room.game_id,
    'host_id', v_room.host_id, 'guest_id', v_room.guest_id, 'status', v_room.status,
    'turn', v_room.turn, 'state', v_room.state, 'winner_id', v_room.winner_id,
    'expires_at', v_room.expires_at
  );
end;
$$;

create or replace function public.join_game_room(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.game_rooms%rowtype;
begin
  if v_uid is null then
    raise exception 'Sign in to join a private game room.';
  end if;

  select * into v_room
    from public.game_rooms
   where room_code = upper(trim(coalesce(p_room_code, '')))
     and status = 'waiting'
     and expires_at > now()
   for update;

  if not found then
    raise exception 'Room code not found, already in use, or expired.';
  end if;
  if v_room.host_id = v_uid then
    raise exception 'You cannot join your own room from the same account.';
  end if;

  update public.game_rooms
     set guest_id = v_uid, status = 'playing', updated_at = now()
   where id = v_room.id
   returning * into v_room;

  insert into public.game_room_members (room_id, user_id, player_number)
  values (v_room.id, v_uid, 2);

  return jsonb_build_object(
    'id', v_room.id, 'room_code', v_room.room_code, 'game_id', v_room.game_id,
    'host_id', v_room.host_id, 'guest_id', v_room.guest_id, 'status', v_room.status,
    'turn', v_room.turn, 'state', v_room.state, 'winner_id', v_room.winner_id,
    'expires_at', v_room.expires_at
  );
end;
$$;

create or replace function public.get_game_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.game_rooms%rowtype;
begin
  if auth.uid() is null or not public.pl_multiplayer_is_member(p_room_id) then
    raise exception 'You are not a player in this room.';
  end if;
  select * into v_room
    from public.game_rooms
   where id = p_room_id
     and expires_at > now();
  if not found then
    raise exception 'This room has expired.';
  end if;
  return jsonb_build_object(
    'id', v_room.id, 'room_code', v_room.room_code, 'game_id', v_room.game_id,
    'host_id', v_room.host_id, 'guest_id', v_room.guest_id, 'status', v_room.status,
    'turn', v_room.turn, 'state', v_room.state, 'winner_id', v_room.winner_id,
    'expires_at', v_room.expires_at
  );
end;
$$;

create or replace function public.play_multiplayer_move(p_room_id uuid, p_move jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.game_rooms%rowtype;
  v_player smallint;
  v_board jsonb;
  v_mark text;
  v_idx integer;
  v_col integer;
  v_row integer;
  v_col2 integer;
  v_rr integer;
  v_cc integer;
  v_step integer;
  v_dir integer;
  v_dr integer;
  v_dc integer;
  v_won boolean := false;
  v_draw boolean := false;
begin
  if v_uid is null or not public.pl_multiplayer_is_member(p_room_id) then
    raise exception 'You are not a player in this room.';
  end if;
  select * into v_room from public.game_rooms where id = p_room_id for update;
  if not found or v_room.status <> 'playing' then
    raise exception 'This game is not currently accepting moves.';
  end if;
  if v_player is null then
    v_player := case when v_room.host_id = v_uid then 1
                     when v_room.guest_id = v_uid then 2 else 0 end;
  end if;
  if v_player = 0 or v_room.turn <> v_player then
    raise exception 'It is not your turn.';
  end if;

  v_board := v_room.state -> 'board';
  if v_room.game_id = 'tictactoe' then
    v_idx := (p_move ->> 'index')::integer;
    if v_idx is null or v_idx < 0 or v_idx > 8 then
      raise exception 'Choose a valid square.';
    end if;
    if v_board ->> v_idx <> '' then
      raise exception 'That square is already taken.';
    end if;
    v_mark := case when v_player = 1 then 'X' else 'O' end;
    v_board := jsonb_set(v_board, array[v_idx::text], to_jsonb(v_mark), false);

    select exists (
      select 1 from (values
        (0,1,2),(3,4,5),(6,7,8),
        (0,3,6),(1,4,7),(2,5,8),
        (0,4,8),(2,4,6)
      ) as wins(a,b,c)
      where v_board ->> a = v_mark
        and v_board ->> b = v_mark
        and v_board ->> c = v_mark
    ) into v_won;

    select not exists (
      select 1 from jsonb_array_elements_text(v_board) as cells(value)
      where value = ''
    ) into v_draw;
  elsif v_room.game_id = 'connect4' then
    v_col := (p_move ->> 'column')::integer;
    if v_col is null or v_col < 0 or v_col > 6 then
      raise exception 'Choose a valid column.';
    end if;
    v_idx := -1;
    for v_row in reverse 5..0 loop
      v_idx := v_row * 7 + v_col;
      if (v_board ->> v_idx)::integer = 0 then exit; end if;
    end loop;
    if v_idx < 0 or (v_board ->> v_idx)::integer <> 0 then
      raise exception 'That column is full.';
    end if;
    v_board := jsonb_set(v_board, array[v_idx::text], to_jsonb(v_player), false);

    <<scan_connect_four>>
    for v_row in 0..5 loop
      for v_col2 in 0..6 loop
        if (v_board ->> (v_row * 7 + v_col2))::integer = v_player then
          for v_dir in 1..4 loop
            v_dr := case v_dir when 1 then 0 else 1 end;
            v_dc := case v_dir when 1 then 1 when 2 then 0 when 3 then 1 else -1 end;
            v_won := true;
            for v_step in 0..3 loop
              v_rr := v_row + v_dr * v_step;
              v_cc := v_col2 + v_dc * v_step;
              if v_rr < 0 or v_rr > 5 or v_cc < 0 or v_cc > 6
                 or (v_board ->> (v_rr * 7 + v_cc))::integer <> v_player then
                v_won := false;
                exit;
              end if;
            end loop;
            if v_won then exit scan_connect_four; end if;
          end loop;
        end if;
      end loop;
    end loop;

    select not exists (
      select 1 from jsonb_array_elements_text(v_board) as cells(value)
      where value = '0'
    ) into v_draw;
  else
    raise exception 'Unsupported multiplayer game.';
  end if;

  if v_won then
    update public.game_rooms
       set state = jsonb_build_object('board', v_board), status = 'completed',
           winner_id = v_uid, updated_at = now()
     where id = p_room_id returning * into v_room;
  elsif v_draw then
    update public.game_rooms
       set state = jsonb_build_object('board', v_board), status = 'completed',
           winner_id = null, updated_at = now()
     where id = p_room_id returning * into v_room;
  else
    update public.game_rooms
       set state = jsonb_build_object('board', v_board),
           turn = 3 - v_player, updated_at = now()
     where id = p_room_id returning * into v_room;
  end if;

  return jsonb_build_object(
    'id', v_room.id, 'room_code', v_room.room_code, 'game_id', v_room.game_id,
    'host_id', v_room.host_id, 'guest_id', v_room.guest_id, 'status', v_room.status,
    'turn', v_room.turn, 'state', v_room.state, 'winner_id', v_room.winner_id,
    'expires_at', v_room.expires_at
  );
end;
$$;

create or replace function public.cancel_game_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.game_rooms%rowtype;
begin
  if auth.uid() is null or not public.pl_multiplayer_is_member(p_room_id) then
    raise exception 'You are not a player in this room.';
  end if;
  update public.game_rooms
     set status = 'cancelled', updated_at = now()
   where id = p_room_id and status in ('waiting', 'playing')
   returning * into v_room;
  if not found then raise exception 'This room is already closed.'; end if;
  return jsonb_build_object('id', v_room.id, 'status', v_room.status);
end;
$$;

revoke all on function public.create_game_room(text) from public, anon;
revoke all on function public.join_game_room(text) from public, anon;
revoke all on function public.get_game_room(uuid) from public, anon;
revoke all on function public.play_multiplayer_move(uuid, jsonb) from public, anon;
revoke all on function public.cancel_game_room(uuid) from public, anon;
grant execute on function public.create_game_room(text) to authenticated;
grant execute on function public.join_game_room(text) to authenticated;
grant execute on function public.get_game_room(uuid) to authenticated;
grant execute on function public.play_multiplayer_move(uuid, jsonb) to authenticated;
grant execute on function public.cancel_game_room(uuid) to authenticated;
