-- =====================================================================
-- 0002_policies — Row Level Security (Etap 0)
-- Zasada: dane prywatne tylko dla właściciela; słownik globalny do odczytu.
-- =====================================================================

-- ---------------------------------------------------------------------
-- disciplines: odczyt dla zalogowanych, brak zapisu z klienta
-- ---------------------------------------------------------------------
alter table public.disciplines enable row level security;

create policy "disciplines_select_authenticated"
  on public.disciplines for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- profiles: właściciel czyta i edytuje swój profil
-- (insert realizuje trigger on_auth_user_created; polityka insert jako fallback)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- training_sessions: pełny CRUD tylko dla właściciela
-- ---------------------------------------------------------------------
alter table public.training_sessions enable row level security;

create policy "training_sessions_select_own"
  on public.training_sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "training_sessions_insert_own"
  on public.training_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "training_sessions_update_own"
  on public.training_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "training_sessions_delete_own"
  on public.training_sessions for delete
  to authenticated
  using (user_id = auth.uid());
