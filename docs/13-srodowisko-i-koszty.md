# 13 — Środowisko, narzędzia i koszty

## 1. Wymagania deweloperskie

- **Node.js** LTS + **pnpm** (workspaces).
- **Expo CLI / EAS CLI** (build i submit web/iOS/Android).
- **Supabase CLI** (lokalny stack, migracje, typy, Edge Functions).
- **Docker** (lokalny Supabase).
- Konta: **Supabase**, **Anthropic (Claude API)**, **Google Cloud (YouTube Data
  API)**, dostawca **STT/Whisper**, **Expo/EAS**, **Sentry**.
- iOS: konto Apple Developer (do publikacji); Android: konto Google Play (publikacja).

## 2. Konfiguracja i sekrety

- Zmienne publiczne klienta przez `app.config.ts` / `EXPO_PUBLIC_*` (tylko adres
  Supabase i klucz `anon` — bezpieczny do publikacji).
- Sekrety serwerowe (Claude/YouTube/STT, service role) w **Supabase secrets** i
  **EAS Secrets** — nigdy w repo (patrz [11](11-bezpieczenstwo-prywatnosc.md)).
- Pliki `.env*` w `.gitignore`; `.env.example` z listą wymaganych kluczy.

## 3. Lokalny rozwój

- `supabase start` — Postgres, Auth, Storage, Studio lokalnie.
- Migracje: `supabase migration new` / `supabase db push`; typy: `supabase gen types`.
- Edge Functions: `supabase functions serve` (z lokalnymi sekretami testowymi).
- Aplikacja: `pnpm dev` (Expo) — web w przeglądarce, mobile przez Expo Go / dev
  build.

## 4. CI/CD

- **GitHub Actions:** lint, typecheck, testy jednostkowe, testy golden set AI
  (na próbce), build sprawdzający.
- **EAS Build/Submit:** buildy iOS/Android; **EAS Update** (OTA) dla szybkich
  poprawek JS.
- **Web:** hosting statyczny (np. Vercel/Netlify/Cloudflare Pages) z eksportu Expo
  web.
- **Migracje** uruchamiane kontrolowane na `staging` → `production`.

## 5. Środowiska

| Środowisko | Supabase | Klucze AI | Cel |
|------------|----------|-----------|-----|
| `local` | lokalny (Docker) | testowe/ograniczone | rozwój |
| `staging` | osobny projekt | osobne, z limitem | testy E2E, golden set |
| `production` | projekt prod | produkcyjne, limity | użytek realny |

## 6. Testowanie

- **Jednostkowe:** logika w `packages/core` (mapowanie technik, reguły progresu,
  scalanie sync).
- **Kontraktowe AI:** walidacja wyjścia (Zod) + golden set (wejście→oczekiwane).
- **Sync:** scenariusze offline/online, konflikty (symulacje).
- **E2E (v1):** krytyczna ścieżka (nagraj → przegląd → zapis → materiały).

## 7. Szacunek kosztów

> Wartości orientacyjne — dokładne stawki zależą od dostawców i wielkości użycia;
> zweryfikować przed startem.

### MVP (1 użytkownik — autor)
| Pozycja | Koszt |
|---------|-------|
| Supabase | darmowy próg (wystarcza) |
| Expo/EAS | darmowy próg do podstawowych buildów |
| YouTube Data API | darmowy próg jednostek (z cache wystarcza) |
| Whisper (STT) | ~grosze za nagranie (zależnie od długości/dostawcy) |
| Claude (ekstrakcja+materiały) | cel < 0,05 USD/trening |
| **Razem** | **bliskie zera** dla jednego aktywnego użytkownika |

### Skala (wielu użytkowników — v2)
- Główne czynniki: liczba transkrypcji (rośnie z użytkownikami) i **unikalne**
  techniki do wygenerowania materiałów (rośnie wolno — cache współdzielony).
- Supabase i hosting web przechodzą na plan płatny przy większym ruchu/danych.
- Mechanizmy kontroli: cache materiałów, limity per użytkownik, kolejkowanie zadań
  AI, batchowanie (patrz [07 §8](07-pipeline-ai.md)).

## 8. Publikacja

- **Web:** wdrożenie z każdej zmiany na `production` (po przejściu CI).
- **iOS/Android:** EAS Submit do App Store / Google Play; OTA (EAS Update) dla
  poprawek JS bez ponownej recenzji sklepu.
- Przed publicznym wydaniem: polityka prywatności, regulamin, ekrany zgód,
  metadane sklepów (patrz checklista w [11 §10](11-bezpieczenstwo-prywatnosc.md)).

## 9. Backup i odtwarzanie

- Backupy bazy zgodnie z planem Supabase (na `production`).
- Migracje w repo = odtwarzalny schemat; seed słownika w repo.
- Procedura odtworzenia środowiska udokumentowana (skrypt setup).
