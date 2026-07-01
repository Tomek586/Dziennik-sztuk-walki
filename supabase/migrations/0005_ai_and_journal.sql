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
