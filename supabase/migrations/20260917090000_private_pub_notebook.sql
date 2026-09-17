-- Additive: existing favorites and all web-app data remain unchanged.
begin;
create table public.user_pub_notes (
  favorite_id uuid primary key references public.user_favorite_bars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'want_to_visit' check (status in ('want_to_visit', 'visited')),
  notes text not null default '' check (char_length(notes) <= 2000),
  tags text[] not null default '{}' check (
    cardinality(tags) <= 6 and
    tags <@ array['Food', 'Outdoor seating', 'Quiet', 'Live music', 'Alcohol-free options', 'Step-free access']::text[]
  ),
  updated_at timestamptz not null default now()
);
create index user_pub_notes_user_id_idx on public.user_pub_notes(user_id);
alter table public.user_pub_notes enable row level security;
revoke all on public.user_pub_notes from anon, authenticated;
grant select, insert, update, delete on public.user_pub_notes to authenticated;
create policy "Read own pub notes" on public.user_pub_notes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Insert own pub notes" on public.user_pub_notes for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.user_favorite_bars f where f.id = favorite_id and f.user_id = (select auth.uid())
  ));
create policy "Update own pub notes" on public.user_pub_notes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.user_favorite_bars f where f.id = favorite_id and f.user_id = (select auth.uid())
  ));
create policy "Delete own pub notes" on public.user_pub_notes for delete to authenticated
  using (user_id = (select auth.uid()));
create function public.touch_pub_note_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger pub_note_updated_at before update on public.user_pub_notes
  for each row execute function public.touch_pub_note_updated_at();
comment on table public.user_pub_notes is 'Private venue-planning notes. Tags are personal observations, not verified venue amenities. No drinking rewards or rankings.';
commit;
