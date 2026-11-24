drop policy if exists "PixelLab room members can receive private game broadcasts" on realtime.messages;
create policy "PixelLab room members can receive private game broadcasts"
  on realtime.messages
  for select
  to authenticated
  using (
    extension = 'broadcast'
    and exists (
      select 1
      from public.game_room_members as m
      where m.user_id = (select auth.uid())
        and ('pl-room:' || m.room_id::text) = (select realtime.topic())
    )
  );

drop policy if exists "PixelLab room members can send private game broadcasts" on realtime.messages;
create policy "PixelLab room members can send private game broadcasts"
  on realtime.messages
  for insert
  to authenticated
  with check (
    extension = 'broadcast'
    and exists (
      select 1
      from public.game_room_members as m
      where m.user_id = (select auth.uid())
        and ('pl-room:' || m.room_id::text) = (select realtime.topic())
    )
  );
