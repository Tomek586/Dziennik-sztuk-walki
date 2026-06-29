-- =====================================================================
-- 0003_techniques — słownik technik (Etap 1, część bez AI)
-- Tabele globalne: techniques, technique_aliases, technique_relations
-- Zgodne z docs/05-model-danych.md i docs/06-slownik-technik.md
-- =====================================================================

create extension if not exists "pg_trgm"; -- wyszukiwanie rozmyte aliasów

-- ---------------------------------------------------------------------
-- Normalizacja nazw/aliasów (mirror logiki TS w packages/core).
-- IMMUTABLE — można użyć w kolumnie generowanej i w indeksie.
-- Kroki: lower → zdjęcie znaków diakrytycznych (PL + typowe łacińskie)
--        → zamiana nie-[a-z0-9] na spację → kolaps spacji → trim.
-- ---------------------------------------------------------------------
create or replace function public.dsw_normalize(s text)
returns text language sql immutable as $$
  select trim(both ' ' from regexp_replace(
    regexp_replace(
      translate(
        translate(lower(coalesce(s, '')), 'ąćęłńóśżź', 'acelnoszz'),
        'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
      '[^a-z0-9]+', ' ', 'g'),
    '\s+', ' ', 'g'))
$$;

-- ---------------------------------------------------------------------
-- techniques — kanoniczny słownik (PL/EN). is_official=false + created_by
-- dla technik prywatnych użytkownika (na przyszłość).
-- ---------------------------------------------------------------------
create table public.techniques (
  id            uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references public.disciplines(id),
  name_pl       text not null,
  name_en       text not null,
  slug          text not null unique,
  category      text not null,
  position      text,
  gi_context    text not null default 'both',  -- gi | no-gi | both | n/a
  description   text,
  is_official   boolean not null default true,
  created_by    uuid references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now()
);
create index techniques_discipline_category_idx
  on public.techniques (discipline_id, category);

-- ---------------------------------------------------------------------
-- technique_aliases — slang/synonimy → technika kanoniczna.
-- normalized: kolumna generowana, zawsze spójna z dsw_normalize.
-- ---------------------------------------------------------------------
create table public.technique_aliases (
  id           uuid primary key default gen_random_uuid(),
  technique_id uuid not null references public.techniques(id) on delete cascade,
  alias        text not null,
  lang         text not null default 'pl',   -- pl | en | other
  normalized   text generated always as (public.dsw_normalize(alias)) stored,
  source       text not null default 'seed', -- seed | ai | user
  created_at   timestamptz not null default now(),
  unique (technique_id, alias)
);
create index technique_aliases_normalized_idx
  on public.technique_aliases (normalized);
create index technique_aliases_trgm_idx
  on public.technique_aliases using gin (normalized gin_trgm_ops);

-- ---------------------------------------------------------------------
-- technique_relations — warianty / kontry / przejścia / setupy
-- ---------------------------------------------------------------------
create table public.technique_relations (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references public.techniques(id) on delete cascade,
  to_id      uuid not null references public.techniques(id) on delete cascade,
  relation   text not null,  -- variant_of | counter_to | transition_to | setup_for
  created_at timestamptz not null default now(),
  unique (from_id, to_id, relation)
);

-- ---------------------------------------------------------------------
-- RLS: odczyt dla zalogowanych; techniki prywatne widzi tylko właściciel.
-- Zapis słownika globalnego idzie przez seed/Edge Functions (service role).
-- ---------------------------------------------------------------------
alter table public.techniques enable row level security;
create policy "techniques_select"
  on public.techniques for select to authenticated
  using (is_official or created_by = auth.uid());
create policy "techniques_insert_own_custom"
  on public.techniques for insert to authenticated
  with check (created_by = auth.uid() and is_official = false);
create policy "techniques_update_own_custom"
  on public.techniques for update to authenticated
  using (created_by = auth.uid() and is_official = false)
  with check (created_by = auth.uid() and is_official = false);

alter table public.technique_aliases enable row level security;
create policy "technique_aliases_select"
  on public.technique_aliases for select to authenticated using (true);

alter table public.technique_relations enable row level security;
create policy "technique_relations_select"
  on public.technique_relations for select to authenticated using (true);
