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
  if v_room.expires_at <= now() then
    raise exception 'This room has expired.';
  end if;

  v_player := case when v_room.host_id = v_uid then 1
                   when v_room.guest_id = v_uid then 2 else 0 end;
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
