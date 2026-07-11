-- =====================================================================
-- 0010 — tygodniowe podsumowania AI
-- Generuje Edge Function weekly-summary (service role), cache per
-- użytkownik+tydzień. Klient tylko czyta swoje.
-- =====================================================================

create table public.weekly_summaries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,            -- poniedziałek tygodnia
  content    jsonb not null,           -- {summary, highlights[], focus[]}
  model      text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
create index weekly_summaries_user_idx on public.weekly_summaries (user_id, week_start desc);

alter table public.weekly_summaries enable row level security;
create policy "weekly_summaries_select_own"
  on public.weekly_summaries for select to authenticated
  using (user_id = auth.uid());
