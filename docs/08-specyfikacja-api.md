# 08 — Specyfikacja API i integracji

Klient korzysta z dwóch rodzajów dostępu do backendu:

1. **Bezpośredni dostęp do danych** przez Supabase (PostgREST + Realtime),
   chroniony RLS — do CRUD danych własnych i odczytu danych globalnych.
2. **Edge Functions** (HTTPS, autoryzacja JWT) — do operacji wymagających kluczy
   serwerowych lub logiki (AI, integracje, usuwanie konta).

Klucze do Claude/YouTube/STT istnieją **wyłącznie** po stronie Edge Functions
(WN-SEC-03).

## 1. Konwencje

- Autoryzacja: nagłówek `Authorization: Bearer <supabase_jwt>`.
- Format: JSON; czas w ISO 8601 UTC.
- Idempotencja: nagłówek `Idempotency-Key` dla operacji tworzących (WN-REL-03).
- Błędy: `{ "error": { "code": "...", "message": "...", "details": {...} } }`.
- Kody: `400` walidacja, `401` brak auth, `403` RLS/uprawnienia, `409` konflikt
  sync, `422` błąd kontraktu AI, `429` limit, `5xx` błąd serwera.

## 2. Dostęp do danych (Supabase / PostgREST)

CRUD realizowany przez klienta `@supabase/supabase-js` z RLS. Przykłady operacji
(pojęciowo — nie pełne ścieżki REST):

| Operacja | Tabela | Uwagi |
|----------|--------|-------|
| Lista treningów | `training_sessions` | filtr `user_id=auth.uid()`, sort `occurred_at desc` |
| Szczegóły treningu | `training_sessions` + `session_techniques` + `sparring_rounds` | join po stronie klienta/RPC |
| Wyszukiwanie technik | `techniques`, `technique_aliases` | po `normalized`/`pg_trgm` |
| Materiały techniki | `learning_materials`, `material_sources` | tylko-odczyt |
| Progres | `technique_progress`, widoki agregujące | pulpit |
| Zapis pomiaru/oceny | `body_metrics`, `grades`, `goals` | offline → sync |

> Złożone odczyty pulpitu udostępniamy jako funkcje RPC/widoki (np.
> `rpc_dashboard_summary`) aby ograniczyć liczbę zapytań.

## 3. Edge Functions (kontrakty)

### `POST /functions/v1/transcribe`
Uruchamia transkrypcję nagrania.
```jsonc
// request
{ "voice_note_id": "uuid", "lang": "pl" }
// response 202
{ "voice_note_id": "uuid", "status": "transcribing" }
```
Wynik (transkrypcja, zmiana statusu) trafia do `voice_notes`; klient dostaje
aktualizację przez Realtime.

### `POST /functions/v1/extract`
Ekstrakcja struktury z transkrypcji (Claude) + mapowanie technik.
```jsonc
// request
{ "voice_note_id": "uuid" }            // używa zapisanej transkrypcji
// lub
{ "text": "wolny tekst opisu treningu", "discipline_code": "BJJ" }
// response 200
{
  "extraction_id": "uuid",
  "status": "needs_review",
  "session_draft": { /* patrz 07 — schemat */ },
  "mapped_techniques": [
    { "technique_id": "uuid", "raw_text": "...", "confidence": 0.82, "needs_review": false }
  ],
  "candidates": [ { "raw_text": "...", "suggested_name_en": "..." } ]
}
```

### `POST /functions/v1/materials`
Zapewnia (z cache lub generuje) materiały do techniki.
```jsonc
// request
{ "technique_id": "uuid", "lang": "pl", "force_refresh": false }
// response 200
{
  "material": {
    "summary": "…",
    "key_points": ["…"],
    "common_errors": ["…"],
    "generated_at": "2026-06-29T10:00:00Z"
  },
  "sources": [
    { "provider": "youtube", "url": "https://…", "title": "…",
      "channel": "…", "duration_s": 540, "ai_reason": "…", "rank": 0 }
  ],
  "from_cache": true
}
```

### `POST /functions/v1/account-delete`
Usuwa konto i wszystkie dane użytkownika (RODO).
```jsonc
// request
{ "confirm": true }
// response 200
{ "status": "scheduled", "purge_at": "2026-06-29T10:05:00Z" }
```

### (wewn./cron) `link-validate`
Bez interfejsu publicznego — uruchamiana harmonogramem; rewaliduje
`material_sources`.

## 4. Integracje zewnętrzne

### 4.1 Transkrypcja (Whisper)
- **Cel:** audio (PL) → tekst.
- **Wejście:** plik audio (pobrany ze Storage przez funkcję), język `pl`.
- **Uwagi:** limit długości nagrania (np. ≤ 5 min) w MVP; dłuższe → dzielenie.
- **Wybór hostingu:** API zarządzane vs self-host → [14 — ADR-007](14-decyzje-architektoniczne.md).

### 4.2 Claude API
- **Cele:** ekstrakcja strukturalna, wybór i uzasadnienie materiałów, streszczenia,
  punkty kluczowe, typowe błędy.
- **Ustawienia:** niska temperatura, wymuszony JSON, walidacja Zod, 1 retry przy
  niezgodności formatu.
- **Model:** najnowszy odpowiedni model Claude; konfigurowalny przez env.
- **Bezpieczeństwo:** minimalizacja danych wejściowych (WN-SEC-04).

### 4.3 YouTube Data API v3
- **Cel:** wyszukiwanie i metadane materiałów wideo.
- **Operacje:** `search.list` (kandydaci wg zapytania), `videos.list`
  (czas trwania, statystyki), walidacja dostępności.
- **Limity:** dzienny limit jednostek API — stąd **cache** materiałów i
  ograniczanie zapytań (tylko dla nowych technik / nieświeżego cache).
- **Budowanie zapytania:** nazwa EN techniki + kategoria + (opcjonalnie) zaufane
  kanały/instruktorzy; filtr języka/jakości po stronie Claude.

## 5. Realtime

- Kanały subskrypcji: zmiany w `voice_notes` (postęp przetwarzania),
  `ai_extractions` (gotowy szkic), `learning_materials` (materiał gotowy),
  oraz strumień zmian danych użytkownika do synchronizacji.
- Klient łączy Realtime z lokalną bazą (aktualizacja widoków bez odpytywania).

## 6. Wersjonowanie i typy

- Typy TypeScript generowane z bazy (`supabase gen types`) → pakiet
  `packages/api-types` (jedno źródło prawdy, WN-MAINT-04).
- Kontrakty Edge Functions opisane schematami Zod współdzielonymi z `core`.
- Zmiany łamiące kontrakt → migracja + bump typów + aktualizacja golden setu.

## 7. Limity i zabezpieczenia wywołań AI

- Rate limiting per użytkownik na Edge Functions (np. token bucket w tabeli/Redis-lite).
- Twardy limit kosztu miesięcznego (`profiles.ai_monthly_limit_cents`).
- Idempotencja `extract`/`materials` (ten sam `voice_note_id`/`technique_id`
  nie generuje podwójnych kosztów).
