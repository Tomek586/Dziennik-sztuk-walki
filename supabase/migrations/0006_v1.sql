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
