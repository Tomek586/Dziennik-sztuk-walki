-- =====================================================================
-- setup_stage1.sql — Etap 1 + v1 w jednym pliku (wklej po Etapie 0).
-- Zawiera: 0003 techniki + seed + 0004 session_techniques + 0005 AI/dziennik + 0006 v1
-- Uruchom RAZ, po tym jak baza ma już 0001+0002+seed z Etapu 0.
-- =====================================================================

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


-- =====================================================================
-- seed_techniques — startowy słownik technik + aliasy + relacje (Etap 1)
-- Idempotentne. Uruchom PO 0003_techniques.sql.
-- normalized w aliasach wylicza się automatycznie (kolumna generowana).
-- =====================================================================

-- skróty do id dyscyplin
-- (używamy podzapytań po code, więc seed jest niezależny od konkretnych uuid)

-- ---------------------------------------------------------------------
-- TECHNIKI
-- ---------------------------------------------------------------------
insert into public.techniques (discipline_id, name_pl, name_en, slug, category, position, gi_context) values
  -- BJJ / grappling
  ((select id from public.disciplines where code='BJJ'), 'duszenie zza pleców',          'rear naked choke',      'rear-naked-choke',   'duszenie',  'plecy',  'both'),
  ((select id from public.disciplines where code='BJJ'), 'trójkąt',                       'triangle choke',        'triangle-choke',     'duszenie',  'gard',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'gilotyna',                      'guillotine',            'guillotine',         'duszenie',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'dźwignia na ramię z krzyża',    'armbar',                'armbar',             'dzwignia',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'kimura',                        'kimura',                'kimura',             'dzwignia',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'americana',                     'americana',             'americana',          'dzwignia',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'omoplata',                      'omoplata',              'omoplata',           'dzwignia',  'gard',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'dźwignia na piętę',             'heel hook',             'heel-hook',          'dzwignia',  'nogi',   'no-gi'),
  ((select id from public.disciplines where code='BJJ'), 'dźwignia na kolano',            'kneebar',               'kneebar',            'dzwignia',  'nogi',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'dosiad',                        'mount',                 'mount',              'pozycja',   'mount',  'both'),
  ((select id from public.disciplines where code='BJJ'), 'plecy',                         'back control',          'back-control',       'pozycja',   'plecy',  'both'),
  ((select id from public.disciplines where code='BJJ'), 'boczne trzymanie',              'side control',          'side-control',       'pozycja',   null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'zamknięta garda',               'closed guard',          'closed-guard',       'gard',      'gard',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'półgarda',                      'half guard',            'half-guard',         'gard',      'gard',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'sprowadzenie oburącz',          'double leg takedown',   'double-leg',         'obalenie',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'sprowadzenie jednonóż',         'single leg takedown',   'single-leg',         'obalenie',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'sprawl',                        'sprawl',                'sprawl',             'obrona',    null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'przejście gardy toreando',      'toreando pass',         'toreando-pass',      'przejscie', null,     'both'),
  -- sporty uderzane (BOX / MT / KB)
  ((select id from public.disciplines where code='BOX'), 'lewy prosty',                   'jab',                   'jab',                'uderzenie', null,     'n/a'),
  ((select id from public.disciplines where code='BOX'), 'prawy prosty',                  'cross',                 'cross',              'uderzenie', null,     'n/a'),
  ((select id from public.disciplines where code='BOX'), 'sierpowy',                      'hook',                  'hook',               'uderzenie', null,     'n/a'),
  ((select id from public.disciplines where code='BOX'), 'podbródkowy',                   'uppercut',              'uppercut',           'uderzenie', null,     'n/a'),
  ((select id from public.disciplines where code='MT'),  'low kick',                      'low kick',              'low-kick',           'kopniecie', null,     'n/a'),
  ((select id from public.disciplines where code='MT'),  'kopnięcie frontalne',           'teep',                  'teep',               'kopniecie', null,     'n/a'),
  ((select id from public.disciplines where code='MT'),  'kopnięcie okrężne',             'roundhouse kick',       'roundhouse-kick',    'kopniecie', null,     'n/a'),
  -- MMA
  ((select id from public.disciplines where code='MMA'), 'uderzenia w parterze',          'ground and pound',      'ground-and-pound',   'uderzenie', 'parter', 'n/a')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- ALIASY (slang, skróty, warianty zapisu). normalized liczy się sam.
-- ---------------------------------------------------------------------
insert into public.technique_aliases (technique_id, alias, lang) values
  ((select id from public.techniques where slug='rear-naked-choke'), 'duszenie zza pleców', 'pl'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'duszenie zza plecow', 'pl'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'duszenie z plecow',   'pl'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'RNC',                 'en'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'rear naked choke',    'en'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'mata leão',           'other'),
  ((select id from public.techniques where slug='triangle-choke'),   'trójkąt',             'pl'),
  ((select id from public.techniques where slug='triangle-choke'),   'trojkat',             'pl'),
  ((select id from public.techniques where slug='triangle-choke'),   'triangle',            'en'),
  ((select id from public.techniques where slug='guillotine'),       'gilotyna',            'pl'),
  ((select id from public.techniques where slug='guillotine'),       'guillotine',          'en'),
  ((select id from public.techniques where slug='armbar'),           'dźwignia na ramię',   'pl'),
  ((select id from public.techniques where slug='armbar'),           'armbar',              'en'),
  ((select id from public.techniques where slug='armbar'),           'juji gatame',         'other'),
  ((select id from public.techniques where slug='kimura'),           'kimura',              'en'),
  ((select id from public.techniques where slug='americana'),        'americana',           'en'),
  ((select id from public.techniques where slug='americana'),        'keylock',             'en'),
  ((select id from public.techniques where slug='omoplata'),         'omoplata',            'other'),
  ((select id from public.techniques where slug='heel-hook'),        'dźwignia na piętę',   'pl'),
  ((select id from public.techniques where slug='heel-hook'),        'heel hook',           'en'),
  ((select id from public.techniques where slug='mount'),            'dosiad',              'pl'),
  ((select id from public.techniques where slug='mount'),            'mount',               'en'),
  ((select id from public.techniques where slug='back-control'),     'plecy',               'pl'),
  ((select id from public.techniques where slug='back-control'),     'back control',        'en'),
  ((select id from public.techniques where slug='back-control'),     'back',                'en'),
  ((select id from public.techniques where slug='side-control'),     'boczne trzymanie',    'pl'),
  ((select id from public.techniques where slug='side-control'),     'side control',        'en'),
  ((select id from public.techniques where slug='closed-guard'),     'zamknięta garda',     'pl'),
  ((select id from public.techniques where slug='closed-guard'),     'closed guard',        'en'),
  ((select id from public.techniques where slug='half-guard'),       'półgarda',            'pl'),
  ((select id from public.techniques where slug='half-guard'),       'half guard',          'en'),
  ((select id from public.techniques where slug='double-leg'),       'sprowadzenie oburącz','pl'),
  ((select id from public.techniques where slug='double-leg'),       'double leg',          'en'),
  ((select id from public.techniques where slug='single-leg'),       'sprowadzenie jednonóż','pl'),
  ((select id from public.techniques where slug='single-leg'),       'single leg',          'en'),
  ((select id from public.techniques where slug='toreando-pass'),    'toreando',            'other'),
  ((select id from public.techniques where slug='jab'),              'lewy prosty',         'pl'),
  ((select id from public.techniques where slug='jab'),              'jab',                 'en'),
  ((select id from public.techniques where slug='cross'),            'prawy prosty',        'pl'),
  ((select id from public.techniques where slug='cross'),            'cross',               'en'),
  ((select id from public.techniques where slug='hook'),             'sierpowy',            'pl'),
  ((select id from public.techniques where slug='hook'),             'hook',                'en'),
  ((select id from public.techniques where slug='uppercut'),         'podbródkowy',         'pl'),
  ((select id from public.techniques where slug='uppercut'),         'uppercut',            'en'),
  ((select id from public.techniques where slug='low-kick'),         'low kick',            'en'),
  ((select id from public.techniques where slug='low-kick'),         'lowik',               'pl'),
  ((select id from public.techniques where slug='teep'),             'teep',                'en'),
  ((select id from public.techniques where slug='teep'),             'push kick',           'en'),
  ((select id from public.techniques where slug='roundhouse-kick'),  'kopnięcie okrężne',   'pl'),
  ((select id from public.techniques where slug='roundhouse-kick'),  'roundhouse',          'en'),
  ((select id from public.techniques where slug='ground-and-pound'), 'ground and pound',    'en'),
  ((select id from public.techniques where slug='ground-and-pound'), 'gnp',                 'en')
on conflict (technique_id, alias) do nothing;

-- ---------------------------------------------------------------------
-- RELACJE (przykładowe powiązania)
-- ---------------------------------------------------------------------
insert into public.technique_relations (from_id, to_id, relation) values
  ((select id from public.techniques where slug='mount'),        (select id from public.techniques where slug='back-control'),     'transition_to'),
  ((select id from public.techniques where slug='back-control'), (select id from public.techniques where slug='rear-naked-choke'), 'setup_for'),
  ((select id from public.techniques where slug='closed-guard'), (select id from public.techniques where slug='triangle-choke'),   'setup_for'),
  ((select id from public.techniques where slug='closed-guard'), (select id from public.techniques where slug='armbar'),           'setup_for'),
  ((select id from public.techniques where slug='sprawl'),       (select id from public.techniques where slug='double-leg'),       'counter_to'),
  ((select id from public.techniques where slug='mount'),        (select id from public.techniques where slug='armbar'),           'setup_for')
on conflict (from_id, to_id, relation) do nothing;


-- =====================================================================
-- 0004_session_techniques — techniki ćwiczone w danej sesji (Etap 1)
-- Postęp (mastery) wyliczamy z tych rekordów (funkcja czysta w core),
-- więc nie potrzebujemy osobnej, synchronizowanej tabeli technique_progress.
-- =====================================================================

create table public.session_techniques (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.training_sessions(id) on delete cascade,
  technique_id uuid not null references public.techniques(id),
  user_id      uuid not null references public.profiles(id) on delete cascade, -- denormalizacja pod RLS
  outcome      text,            -- learned | drilled | worked_in_sparring | failed
  reps         int,
  went_well    text,
  went_bad     text,
  confidence   real,            -- pewność rozpoznania AI (null = ręczne)
  source       text not null default 'manual', -- manual | ai
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  version      bigint not null default 1,
  deleted_at   timestamptz,
  constraint session_techniques_outcome_chk
    check (outcome is null or outcome in ('learned', 'drilled', 'worked_in_sparring', 'failed'))
);

create index session_techniques_session_idx on public.session_techniques (session_id);
create index session_techniques_user_tech_idx on public.session_techniques (user_id, technique_id);
create index session_techniques_user_updated_idx on public.session_techniques (user_id, updated_at);

create trigger session_techniques_touch
  before update on public.session_techniques
  for each row execute function public.tg_touch_sync();

alter table public.session_techniques enable row level security;
create policy "session_techniques_select_own"
  on public.session_techniques for select to authenticated using (user_id = auth.uid());
create policy "session_techniques_insert_own"
  on public.session_techniques for insert to authenticated with check (user_id = auth.uid());
create policy "session_techniques_update_own"
  on public.session_techniques for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "session_techniques_delete_own"
  on public.session_techniques for delete to authenticated using (user_id = auth.uid());


-- =====================================================================
-- 0005_ai_and_journal — pipeline AI + rozszerzenia dziennika (Etap 1 MVP)
-- Tabele: voice_notes, ai_extractions, learning_materials, material_sources,
--         sparring_rounds, body_metrics, grades + bucket Storage na audio.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Storage: prywatny bucket na nagrania (ścieżka: <user_id>/<voice_note_id>)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;

create policy "voice_notes_objects_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "voice_notes_objects_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "voice_notes_objects_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- voice_notes — notatki głosowe (synchronizowane)
-- ---------------------------------------------------------------------
create table public.voice_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  session_id   uuid references public.training_sessions(id) on delete set null,
  storage_path text,
  duration_s   int,
  transcript   text,
  lang         text default 'pl',
  status       text not null default 'pending', -- pending|uploaded|transcribed|extracted|failed
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  version      bigint not null default 1,
  deleted_at   timestamptz
);
create index voice_notes_user_updated_idx on public.voice_notes (user_id, updated_at);
create trigger voice_notes_touch before update on public.voice_notes
  for each row execute function public.tg_touch_sync();

alter table public.voice_notes enable row level security;
create policy "voice_notes_select_own" on public.voice_notes for select to authenticated using (user_id = auth.uid());
create policy "voice_notes_insert_own" on public.voice_notes for insert to authenticated with check (user_id = auth.uid());
create policy "voice_notes_update_own" on public.voice_notes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "voice_notes_delete_own" on public.voice_notes for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- ai_extractions — ustrukturyzowany wynik AI do przeglądu
-- ---------------------------------------------------------------------
create table public.ai_extractions (
  id            uuid primary key default gen_random_uuid(),
  voice_note_id uuid references public.voice_notes(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  raw           jsonb not null,
  model         text,
  cost_cents    real,
  status        text not null default 'needs_review', -- needs_review|applied|discarded
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  version       bigint not null default 1,
  deleted_at    timestamptz
);
create index ai_extractions_user_updated_idx on public.ai_extractions (user_id, updated_at);
create trigger ai_extractions_touch before update on public.ai_extractions
  for each row execute function public.tg_touch_sync();

alter table public.ai_extractions enable row level security;
create policy "ai_extractions_select_own" on public.ai_extractions for select to authenticated using (user_id = auth.uid());
create policy "ai_extractions_insert_own" on public.ai_extractions for insert to authenticated with check (user_id = auth.uid());
create policy "ai_extractions_update_own" on public.ai_extractions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_extractions_delete_own" on public.ai_extractions for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- learning_materials + material_sources — cache materiałów (globalny)
-- Zapis wyłącznie przez Edge Functions (service role, omija RLS).
-- ---------------------------------------------------------------------
create table public.learning_materials (
  id            uuid primary key default gen_random_uuid(),
  technique_id  uuid not null references public.techniques(id) on delete cascade,
  summary       text not null,
  key_points    jsonb not null default '[]',
  common_errors jsonb not null default '[]',
  lang          text not null default 'pl',
  model         text,
  generated_at  timestamptz not null default now(),
  expires_at    timestamptz,
  unique (technique_id, lang)
);
alter table public.learning_materials enable row level security;
create policy "learning_materials_select" on public.learning_materials for select to authenticated using (true);

create table public.material_sources (
  id            uuid primary key default gen_random_uuid(),
  material_id   uuid not null references public.learning_materials(id) on delete cascade,
  provider      text not null default 'youtube',
  external_id   text not null,
  url           text not null,
  title         text,
  channel       text,
  duration_s    int,
  thumbnail_url text,
  rank          int not null default 0,
  ai_reason     text,
  is_valid      boolean not null default true,
  last_checked  timestamptz,
  created_at    timestamptz not null default now()
);
create index material_sources_material_idx on public.material_sources (material_id, rank);
alter table public.material_sources enable row level security;
create policy "material_sources_select" on public.material_sources for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- sparring_rounds — sparingi (synchronizowane)
-- ---------------------------------------------------------------------
create table public.sparring_rounds (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.training_sessions(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  round_no            int,
  duration_min        int,
  partner_label       text,
  partner_level       text,
  result              text,  -- win|loss|draw|n/a
  taps_for            int not null default 0,
  taps_against        int not null default 0,
  finish_technique_id uuid references public.techniques(id),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  version             bigint not null default 1,
  deleted_at          timestamptz,
  constraint sparring_rounds_result_chk check (result is null or result in ('win','loss','draw','n/a'))
);
create index sparring_rounds_user_updated_idx on public.sparring_rounds (user_id, updated_at);
create index sparring_rounds_session_idx on public.sparring_rounds (session_id);
create trigger sparring_rounds_touch before update on public.sparring_rounds
  for each row execute function public.tg_touch_sync();

alter table public.sparring_rounds enable row level security;
create policy "sparring_rounds_select_own" on public.sparring_rounds for select to authenticated using (user_id = auth.uid());
create policy "sparring_rounds_insert_own" on public.sparring_rounds for insert to authenticated with check (user_id = auth.uid());
create policy "sparring_rounds_update_own" on public.sparring_rounds for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sparring_rounds_delete_own" on public.sparring_rounds for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- body_metrics — waga i parametry (synchronizowane)
-- ---------------------------------------------------------------------
create table public.body_metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  measured_at timestamptz not null,
  weight_kg   real,
  resting_hr  int,
  sleep_h     real,
  fatigue     smallint,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  version     bigint not null default 1,
  deleted_at  timestamptz
);
create index body_metrics_user_measured_idx on public.body_metrics (user_id, measured_at desc);
create index body_metrics_user_updated_idx on public.body_metrics (user_id, updated_at);
create trigger body_metrics_touch before update on public.body_metrics
  for each row execute function public.tg_touch_sync();

alter table public.body_metrics enable row level security;
create policy "body_metrics_select_own" on public.body_metrics for select to authenticated using (user_id = auth.uid());
create policy "body_metrics_insert_own" on public.body_metrics for insert to authenticated with check (user_id = auth.uid());
create policy "body_metrics_update_own" on public.body_metrics for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "body_metrics_delete_own" on public.body_metrics for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- grades — stopnie / pasy (synchronizowane)
-- ---------------------------------------------------------------------
create table public.grades (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  discipline_id uuid not null references public.disciplines(id),
  grade_label   text not null,
  awarded_at    date,
  awarded_by    text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  version       bigint not null default 1,
  deleted_at    timestamptz
);
create index grades_user_updated_idx on public.grades (user_id, updated_at);
create trigger grades_touch before update on public.grades
  for each row execute function public.tg_touch_sync();

alter table public.grades enable row level security;
create policy "grades_select_own" on public.grades for select to authenticated using (user_id = auth.uid());
create policy "grades_insert_own" on public.grades for insert to authenticated with check (user_id = auth.uid());
create policy "grades_update_own" on public.grades for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "grades_delete_own" on public.grades for delete to authenticated using (user_id = auth.uid());


-- =====================================================================
-- 0006_v1 — cele, notatki/watchlist technik, feedback materiałów (Etap v1)
-- =====================================================================

-- ---------------------------------------------------------------------
-- goals — cele treningowe (synchronizowane)
-- target (jsonb): np. {"per_week":3} lub {"technique_id":"...","level":3}
-- ---------------------------------------------------------------------
create table public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null,   -- frequency | technique_mastery | custom
  target     jsonb not null default '{}',
  title      text,
  due_at     date,
  status     text not null default 'active', -- active | done | abandoned
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version    bigint not null default 1,
  deleted_at timestamptz
);
create index goals_user_updated_idx on public.goals (user_id, updated_at);
create trigger goals_touch before update on public.goals
  for each row execute function public.tg_touch_sync();

alter table public.goals enable row level security;
create policy "goals_select_own" on public.goals for select to authenticated using (user_id = auth.uid());
create policy "goals_insert_own" on public.goals for insert to authenticated with check (user_id = auth.uid());
create policy "goals_update_own" on public.goals for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_delete_own" on public.goals for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- user_technique_notes — własne notatki do techniki (synchronizowane)
-- ---------------------------------------------------------------------
create table public.user_technique_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  technique_id uuid not null references public.techniques(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  version      bigint not null default 1,
  deleted_at   timestamptz
);
create index user_technique_notes_user_updated_idx on public.user_technique_notes (user_id, updated_at);
create index user_technique_notes_tech_idx on public.user_technique_notes (user_id, technique_id);
create trigger user_technique_notes_touch before update on public.user_technique_notes
  for each row execute function public.tg_touch_sync();

alter table public.user_technique_notes enable row level security;
create policy "utn_select_own" on public.user_technique_notes for select to authenticated using (user_id = auth.uid());
create policy "utn_insert_own" on public.user_technique_notes for insert to authenticated with check (user_id = auth.uid());
create policy "utn_update_own" on public.user_technique_notes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "utn_delete_own" on public.user_technique_notes for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- watchlist — techniki „do nauki" (synchronizowane)
-- ---------------------------------------------------------------------
create table public.watchlist (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  technique_id uuid not null references public.techniques(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  version      bigint not null default 1,
  deleted_at   timestamptz,
  unique (user_id, technique_id)
);
create index watchlist_user_updated_idx on public.watchlist (user_id, updated_at);
create trigger watchlist_touch before update on public.watchlist
  for each row execute function public.tg_touch_sync();

alter table public.watchlist enable row level security;
create policy "watchlist_select_own" on public.watchlist for select to authenticated using (user_id = auth.uid());
create policy "watchlist_insert_own" on public.watchlist for insert to authenticated with check (user_id = auth.uid());
create policy "watchlist_update_own" on public.watchlist for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "watchlist_delete_own" on public.watchlist for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- material_feedback — ocena materiału (synchronizowane)
-- ---------------------------------------------------------------------
create table public.material_feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  source_id  uuid not null references public.material_sources(id) on delete cascade,
  helpful    boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version    bigint not null default 1,
  deleted_at timestamptz,
  unique (user_id, source_id)
);
create index material_feedback_user_updated_idx on public.material_feedback (user_id, updated_at);
create trigger material_feedback_touch before update on public.material_feedback
  for each row execute function public.tg_touch_sync();

alter table public.material_feedback enable row level security;
create policy "material_feedback_select_own" on public.material_feedback for select to authenticated using (user_id = auth.uid());
create policy "material_feedback_insert_own" on public.material_feedback for insert to authenticated with check (user_id = auth.uid());
create policy "material_feedback_update_own" on public.material_feedback for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "material_feedback_delete_own" on public.material_feedback for delete to authenticated using (user_id = auth.uid());
