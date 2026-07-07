-- =====================================================================
-- 0008 — newsy ze świata sztuk walki
-- Treści wspólne dla wszystkich użytkowników; zapis wyłącznie przez
-- Edge Function news-refresh (service role). Klient tylko czyta.
-- =====================================================================

create table public.news_items (
  id           uuid primary key default gen_random_uuid(),
  url          text not null unique,
  title        text not null,          -- tytuł po polsku (AI tłumaczy zagraniczne)
  summary      text,                   -- 1-3 zdania po polsku
  source       text not null,          -- nazwa portalu (np. "InTheCage", "MMA Fighting")
  category     text not null default 'inne',  -- mma | bjj | boks | inne
  image_url    text,
  published_at timestamptz,
  fetched_at   timestamptz not null default now()
);
create index news_items_published_idx on public.news_items (published_at desc);
create index news_items_category_idx on public.news_items (category, published_at desc);

alter table public.news_items enable row level security;
create policy "news_items_select"
  on public.news_items for select to authenticated using (true);

-- pojedynczy wiersz meta — kiedy ostatnio odświeżono (rate-limit odświeżania)
create table public.news_meta (
  id           int primary key default 1 check (id = 1),
  last_refresh timestamptz not null default 'epoch'
);
insert into news_meta (id) values (1);

alter table public.news_meta enable row level security;
create policy "news_meta_select"
  on public.news_meta for select to authenticated using (true);
