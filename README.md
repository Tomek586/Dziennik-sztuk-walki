# Dziennik Sztuk Walki

Aplikacja web + mobile (jeden kod) do prowadzenia dziennika treningów sztuk walki:
zapis treningów, monitorowanie progresu i automatyczne łączenie ćwiczonych technik
z materiałami do nauki dobieranymi przez AI.

Pełna dokumentacja produktu i architektury: [`docs/`](docs/README.md).

## Stos technologiczny

- **Aplikacja:** Expo / React Native + TypeScript (web, iOS, Android), Expo Router.
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions).
- **Monorepo:** pnpm workspaces + Turborepo.
- **Offline-first:** lokalny magazyn + kolejka (outbox) + synchronizacja
  (w Etapie 0 na AsyncStorage; docelowo WatermelonDB — patrz ADR-011).

## Struktura repo

```
apps/app          # aplikacja Expo (web + iOS + Android)
packages/core     # logika domenowa + walidacja (Zod) + testy
packages/api-types# typy bazy (docelowo generowane z Supabase)
supabase/         # migracje SQL, seed, instrukcja
docs/             # dokumentacja (PRD, architektura, model danych, AI, UX, ...)
```

## Wymagania

- Node.js ≥ 20 (zalecane 22), pnpm ≥ 10.
- Konto Supabase (darmowy plan) do logowania i synchronizacji.
- Do uruchomienia na telefonie: aplikacja **Expo Go** (iOS/Android).

## Szybki start

```bash
# 1. Zależności
pnpm install

# 2. Baza danych (Supabase)
#    Utwórz projekt na supabase.com i zastosuj schemat — instrukcja:
#    supabase/README.md (SQL Editor: 0001_init.sql, 0002_policies.sql, seed.sql)

# 3. Konfiguracja klienta
cp .env.example apps/app/.env
#    i uzupełnij EXPO_PUBLIC_SUPABASE_URL oraz EXPO_PUBLIC_SUPABASE_ANON_KEY

# 4. Uruchomienie
pnpm app:web            # web (przeglądarka)
pnpm --filter @dsw/app start   # Metro: zeskanuj QR w Expo Go (telefon)
```

> Bez konfiguracji Supabase aplikacja uruchomi się w „trybie lokalnym" i pokaże
> instrukcję — logowanie i synchronizacja będą wyłączone.

## Przydatne komendy

```bash
pnpm typecheck     # sprawdzenie typów we wszystkich pakietach
pnpm test          # testy jednostkowe (pakiet core)
pnpm lint          # lint (placeholder)
pnpm format        # prettier
pnpm db:types      # regeneracja typów z lokalnej bazy Supabase (wymaga CLI)
```

## Stan: Etap 0 (fundament)

Zrealizowane: monorepo, schemat Supabase + RLS + seed, logowanie/rejestracja,
profil (auto-tworzony), zapis treningu **offline-first** (lokalnie + outbox +
synchronizacja jednej encji `training_sessions`), działa na web (zweryfikowany
bundle) i w Expo Go. Kolejne kroki w [`docs/12-roadmapa.md`](docs/12-roadmapa.md).
