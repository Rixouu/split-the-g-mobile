-- Run in the SQL editor after the migration. Test writes are rolled back.
-- Uses one existing favorite with no note; no personal data is returned.
begin;
create temporary table notebook_test_target as
  select f.id, f.user_id from public.user_favorite_bars f
  where not exists (select 1 from public.user_pub_notes n where n.favorite_id = f.id) limit 1;
grant select on notebook_test_target to authenticated;
do $$ begin
  if not exists (select 1 from notebook_test_target) then raise exception 'Need one saved place without a note for this rollback-only test'; end if;
  if has_table_privilege('anon', 'public.user_pub_notes', 'SELECT') then raise exception 'Anonymous access must be denied'; end if;
end $$;
select set_config('request.jwt.claim.sub', (select user_id::text from notebook_test_target), true) is not null as owner_context_set;
set local role authenticated;
insert into public.user_pub_notes (favorite_id, user_id, notes)
  select id, user_id, 'transaction-only privacy test' from notebook_test_target;
update public.user_pub_notes set status = 'visited' where favorite_id = (select id from notebook_test_target);
do $$ begin
  if not exists (select 1 from public.user_pub_notes where favorite_id = (select id from notebook_test_target) and status = 'visited') then raise exception 'Owner CRUD failed'; end if;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000099', true) is not null as other_context_set;
do $$ declare affected integer; begin
  if exists (select 1 from public.user_pub_notes where favorite_id = (select id from notebook_test_target)) then raise exception 'Other user can read note'; end if;
  update public.user_pub_notes set notes = 'not allowed' where favorite_id = (select id from notebook_test_target);
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Other user can update note'; end if;
  delete from public.user_pub_notes where favorite_id = (select id from notebook_test_target);
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Other user can delete note'; end if;
  begin
    insert into public.user_pub_notes(favorite_id, user_id) select id, auth.uid() from notebook_test_target;
    raise exception 'Other user can attach a note to someone else favorite';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
select 'PASS: owner read/write; other-user read/update/delete/insert denied; anon denied; all test writes rolled back' as result;
