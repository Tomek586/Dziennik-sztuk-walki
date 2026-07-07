-- =====================================================================
-- 0009 — kluby sztuk walki w Polsce (mapa „gdzie trenować")
-- Dane z OpenStreetMap (Overpass) agreguje Edge Function clubs-refresh
-- (service role, odświeżanie co 7 dni). Klient tylko czyta.
-- =====================================================================

create table public.clubs (
  id          uuid primary key default gen_random_uuid(),
  osm_key     text not null unique,   -- np. "node/448092104"
  name        text not null,
  sports      text not null,          -- surowe tagi sport z OSM (po średnikach)
  categories  text not null,          -- nasze kategorie CSV: bjj,mma,boks,kick,zapasy,inne
  lat         double precision not null,
  lon         double precision not null,
  city        text,
  street      text,
  website     text,
  phone       text,
  fetched_at  timestamptz not null default now()
);
create index clubs_categories_idx on public.clubs (categories);

alter table public.clubs enable row level security;
create policy "clubs_select"
  on public.clubs for select to authenticated using (true);

-- meta odświeżania (rate-limit)
create table public.clubs_meta (
  id           int primary key default 1 check (id = 1),
  last_refresh timestamptz not null default 'epoch'
);
insert into clubs_meta (id) values (1);

alter table public.clubs_meta enable row level security;
create policy "clubs_meta_select"
  on public.clubs_meta for select to authenticated using (true);
