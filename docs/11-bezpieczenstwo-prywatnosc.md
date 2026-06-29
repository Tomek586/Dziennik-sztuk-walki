# 11 — Bezpieczeństwo i prywatność

Dane treningowe są osobiste (kontuzje, samopoczucie, wyniki sparingów), dlatego
prywatność jest domyślna i twarda.

## 1. Uwierzytelnianie i sesje

- Supabase Auth: e-mail/hasło (MVP), OAuth Google/Apple (v1).
- JWT krótkożyjący + refresh token; bezpieczne przechowywanie na kliencie
  (Secure Store na mobile, httpOnly/Secure na web gdzie możliwe).
- Reset hasła przez e-mail; ochrona przed enumeracją kont.
- (v1) Opcjonalna blokada aplikacji biometrią/PIN-em.

## 2. Autoryzacja i izolacja danych (RLS)

- Każda tabela danych prywatnych ma RLS ograniczające dostęp do `auth.uid()`
  (WN-SEC-01). Wzorce → [05 §6](05-model-danych.md).
- Dane globalne (słownik, materiały): odczyt dla zalogowanych, zapis wyłącznie
  przez Edge Functions (klucz serwisowy).
- (v2) Dzielenie z trenerem przez `share_grants` — dodatkowe polityki RLS,
  domyślnie brak dostępu; grant jawny, odwoływalny (`revoked_at`).

## 3. Sekrety i klucze

- Klucze Claude/YouTube/STT **tylko** w Edge Functions (zmienne środowiskowe /
  Supabase secrets), nigdy w bundlu klienta (WN-SEC-03).
- Brak kluczy w repo; `.env` ignorowane; sekrety w EAS Secrets / Supabase.
- Rotacja kluczy udokumentowana; zasada najmniejszych uprawnień dla kluczy API.

## 4. Dane w tranzycie i spoczynku

- TLS dla całej komunikacji (WN-SEC-02).
- Szyfrowanie w spoczynku po stronie Supabase/Storage.
- Audio w Storage dostępne wyłącznie przez krótkożyjące podpisane URL-e.
- Lokalna baza na urządzeniu: rozważyć szyfrowanie SQLite (v1) i czyszczenie po
  wylogowaniu.

## 5. Prywatność wobec AI

- Minimalizacja danych: do modeli trafia tylko to, co potrzebne (transkrypcja,
  nazwa techniki, kategorie) — bez danych identyfikujących (WN-SEC-04).
- Wybór dostawców z jasną polityką retencji/regionu; preferencja opcji bez
  trenowania na danych klienta.
- Możliwość wyłączenia przechowywania audio (`profiles.store_audio=false`) —
  kasowanie pliku po transkrypcji.
- Transkrypcje i ekstrakcje są danymi użytkownika (RLS), usuwalne wraz z kontem.

## 6. RODO / prawa użytkownika

- **Dostęp i przenośność:** eksport danych (JSON/CSV) — WF-SET-02 (v1).
- **Usunięcie:** `account-delete` kasuje konto i dane powiązane (kaskady FK),
  pliki w Storage oraz transkrypcje/ekstrakcje (WN-SEC-05).
- **Minimalizacja:** zbieramy tylko dane potrzebne do funkcji.
- **Podstawa prawna:** zgoda przy rejestracji; polityka prywatności i regulamin
  (do przygotowania przed publicznym udostępnieniem).
- **Powierzenie przetwarzania:** umowy/DPA z dostawcami (Supabase, dostawca STT,
  Anthropic, Google) — do skompletowania przy wyjściu poza użytek własny.

## 7. Logowanie i monitoring

- Logi bez treści notatek i PII w postaci jawnej (WN-SEC-06); identyfikatory
  zamiast treści.
- Monitoring błędów (Sentry) z filtrowaniem danych wrażliwych (scrubbing).
- Metryki AI (koszt, czas, pewność) bez treści wejściowych.

## 8. Zabezpieczenia nadużyć i kosztów

- Rate limiting Edge Functions per użytkownik; idempotencja operacji AI.
- Twardy limit miesięcznego kosztu AI per użytkownik.
- Walidacja wejścia (rozmiar/typ audio, długość tekstu) przed wywołaniem AI.

## 9. Bezpieczeństwo wytwarzania

- TypeScript `strict`, walidacja Zod na granicach (wejście klienta i wyjście AI).
- Migracje SQL wersjonowane; przegląd polityk RLS przy każdej zmianie schematu.
- Zależności skanowane (np. `npm audit` / Dependabot); sekrety skanowane w CI.
- Środowiska rozdzielone (`local`/`staging`/`production`), brak danych prod w dev.

## 10. Lista kontrolna przed publicznym udostępnieniem (v1/v2)

- [ ] Polityka prywatności i regulamin (PL).
- [ ] DPA z dostawcami AI/infra.
- [ ] Eksport i usuwanie danych przetestowane.
- [ ] Przegląd RLS (w tym `share_grants` dla trenera).
- [ ] Scrubbing logów zweryfikowany.
- [ ] Limity kosztów i rate limiting aktywne.
- [ ] Szyfrowanie lokalnej bazy (jeśli włączone) i czyszczenie po wylogowaniu.
