-- =====================================================================
-- 0001_init — schemat startowy (Etap 0)
-- Tabele: disciplines (globalna), profiles, training_sessions
-- Zgodne z docs/05-model-danych.md (podzbiór na pionowy plasterek)
-- =====================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Funkcje pomocnicze do synchronizacji (updated_at / version)
-- ---------------------------------------------------------------------

-- Dla tabel bez wersjonowania sync (np. profiles): tylko updated_at
create or replace function public.tg_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Dla tabel synchronizowanych offline: updated_at + inkrement version
create or replace function public.tg_touch_sync()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.version := coalesce(old.version, 0) + 1;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- disciplines (globalne, tylko-odczyt dla klienta)
-- ---------------------------------------------------------------------
create table public.disciplines (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name_pl      text not null,
  name_en      text not null,
  is_grappling boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- profiles (rozszerza auth.users; tworzony automatycznie przy rejestracji)
-- ---------------------------------------------------------------------
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  display_name           text,
  units                  text not null default 'metric',  -- metric | imperial
  locale                 text not null default 'pl',
  store_audio            boolean not null default true,
  ai_monthly_limit_cents int not null default 500,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.tg_touch_updated_at();

-- Automatyczne utworzenie profilu po rejestracji użytkownika
create or replace function public.tg_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();

-- ---------------------------------------------------------------------
-- training_sessions (dane prywatne, synchronizowane offline)
-- ---------------------------------------------------------------------
create table public.training_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  discipline_id uuid not null references public.disciplines(id),
  occurred_at   timestamptz not null,
  duration_min  int,
  session_type  text,
  location      text,
  intensity     smallint,
  feeling       smallint,
  notes         text,
  went_well     text,
  went_bad      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  version       bigint not null default 1,
  deleted_at    timestamptz,
  constraint training_sessions_intensity_range
    check (intensity is null or intensity between 1 and 10),
  constraint training_sessions_feeling_range
    check (feeling is null or feeling between 1 and 5)
);

create index training_sessions_user_occurred_idx
  on public.training_sessions (user_id, occurred_at desc);

-- indeks pod pull synchronizacji (zmiany od last_pulled_at)
create index training_sessions_user_updated_idx
  on public.training_sessions (user_id, updated_at);

create trigger training_sessions_touch
  before update on public.training_sessions
  for each row execute function public.tg_touch_sync();
