-- Map pins: optional cached WGS84 coordinates per directory row.
-- Apply in Supabase SQL editor (or CLI) before the mobile app selects these columns.

alter table public.pub_place_details
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_resolved_at timestamptz;

comment on column public.pub_place_details.latitude is 'Cached map pin latitude (WGS84). Populate via admin, script, or Google APIs.';
comment on column public.pub_place_details.longitude is 'Cached map pin longitude (WGS84).';
comment on column public.pub_place_details.location_resolved_at is 'When latitude/longitude were last written.';

-- Example backfill for one bar (replace with your values from Geocoding or Places):
-- update public.pub_place_details
-- set latitude = 13.7391, longitude = 100.5829, location_resolved_at = timezone('utc', now())
-- where bar_key = 'black cabin bar bangkok';
