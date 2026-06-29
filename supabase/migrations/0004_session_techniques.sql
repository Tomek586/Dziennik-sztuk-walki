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
