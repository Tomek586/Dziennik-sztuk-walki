# Supabase — schemat i konfiguracja

Ten folder zawiera wersjonowany schemat bazy (migracje SQL) oraz dane startowe.

## Pliki
- `migrations/0001_init.sql` — tabele `disciplines`, `profiles`, `training_sessions`,
  funkcje/triggery (auto-profil, `updated_at`/`version`).
- `migrations/0002_policies.sql` — Row Level Security (RLS).
- `migrations/0003_techniques.sql` — słownik technik (`techniques`,
  `technique_aliases` z generowaną kolumną `normalized`, `technique_relations`),
  funkcja `dsw_normalize`, pg_trgm, RLS. (Etap 1)
- `seed.sql` — dyscypliny startowe.
- `seed_techniques.sql` — startowy słownik technik + aliasy + relacje. (Etap 1)
- `setup.sql` — wszystko z Etapu 0 w jednym pliku (wygodne na świeży projekt).

## Jak zastosować schemat

### Wariant A — szybki start (panel Supabase, bez CLI/Dockera)
1. Utwórz projekt na https://supabase.com (darmowy plan).
2. W panelu: **SQL Editor** → wklej i uruchom kolejno:
   `0001_init.sql`, potem `0002_policies.sql`, potem `seed.sql`.
3. Skopiuj **Project URL** i **anon key** (Settings → API) do `apps/app/.env`
   (patrz `.env.example` w katalogu głównym).

### Wariant B — Supabase CLI (zalecane docelowo)
Wymaga zainstalowanego Supabase CLI i Dockera.
```bash
# instalacja CLI (Windows: scoop/choco) — patrz dokumentacja Supabase
supabase init           # jednorazowo, tworzy supabase/config.toml
supabase start          # lokalny stack (Postgres, Auth, Storage, Studio)
supabase db reset       # zastosuje migracje + seed.sql do lokalnej bazy
# generowanie typów TS po zmianach schematu:
supabase gen types typescript --local > ../packages/api-types/src/database.types.ts
```

Aby wypchnąć migracje do projektu w chmurze:
```bash
supabase link --project-ref <ref-projektu>
supabase db push
```

## Uwaga o sekretach
Klucze do Claude / YouTube / STT oraz `service_role` ustawiamy wyłącznie jako
sekrety Edge Functions w Supabase — nigdy w aplikacji klienckiej ani w repo.
Patrz `docs/11-bezpieczenstwo-prywatnosc.md`.
