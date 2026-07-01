# Uruchomienie pełnej funkcjonalności (baza + AI)

Ten dokument zbiera wszystko, co trzeba zrobić w panelu Supabase, aby aplikacja
działała w 100% (łącznie z pipeline'em AI: głos → transkrypcja → wyciąganie
technik → materiały).

> Aplikacja działa też **bez kluczy AI** — w „trybie demo": transkrypcja prosi o
> ręczne wpisanie tekstu, a ekstrakcja rozpoznaje techniki po słowach kluczowych
> ze słownika. Klucze włączają pełną jakość (Whisper + LLM + filmy z YouTube).

## Krok 1 — Wgraj schemat Etapu 1 (jedna wklejka)

Supabase → **SQL Editor** → New query → wklej całość
[`supabase/setup_stage1.sql`](../supabase/setup_stage1.sql) → **Run**.

Tworzy: słownik technik (+ seed), `session_techniques`, pipeline (`voice_notes`,
`ai_extractions`, `learning_materials`, `material_sources`), sparingi, wagę,
stopnie oraz prywatny bucket Storage `voice-notes`.

(Zakłada, że baza ma już Etap 0: `0001` + `0002` + `seed.sql`.)

## Krok 2 — Wdróż 3 Edge Functions (z panelu, bez CLI)

Supabase → **Edge Functions** → **Deploy a new function** (edytor w przeglądarce).
Dla każdej: nazwa **dokładnie** jak niżej, wklej zawartość pliku, **Deploy**.

| Nazwa funkcji | Wklej z pliku |
|---------------|---------------|
| `transcribe` | [`supabase/functions/transcribe/index.ts`](../supabase/functions/transcribe/index.ts) |
| `extract`    | [`supabase/functions/extract/index.ts`](../supabase/functions/extract/index.ts) |
| `materials`  | [`supabase/functions/materials/index.ts`](../supabase/functions/materials/index.ts) |
| `account-delete` | [`supabase/functions/account-delete/index.ts`](../supabase/functions/account-delete/index.ts) — usuwanie konta (RODO); nie wymaga kluczy |

Domyślne ustawienia są OK (weryfikacja JWT włączona — aplikacja wysyła token
zalogowanego użytkownika).

## Krok 3 — Ustaw sekrety (klucze API)

Supabase → **Edge Functions** → **Secrets** (lub Project Settings → Edge
Functions → Secrets) → dodaj:

| Sekret | Wartość | Wymagany? |
|--------|---------|-----------|
| `GROQ_API_KEY` | klucz z console.groq.com (`gsk_...`) | do transkrypcji i ekstrakcji AI |
| `YOUTUBE_API_KEY` | klucz z Google Cloud (YouTube Data API v3) | do filmów w materiałach |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` są dostępne
automatycznie — **nie** dodawaj ich ręcznie.

> Bez `GROQ_API_KEY` → tryb demo (dopasowanie po słowach kluczowych).
> Bez `YOUTUBE_API_KEY` → materiały bez filmów (samo streszczenie, jeśli jest Groq).

## Krok 4 — Klient

Plik `apps/app/.env` jest już ustawiony (URL + anon key z Etapu 0). Nic więcej nie
trzeba. Uruchom: `pnpm app:web`.

## Jak przetestować

1. **Tekst → AI:** pulpit → „Opisz trening tekstem (AI)" → wpisz np.
   „no-gi, drillowałem duszenie zza pleców i trójkąt, w sparingu gilotyna" →
   Analizuj → Przegląd → Zapisz. Działa nawet bez kluczy (dopasowanie słów).
2. **Głos → AI (z kluczem Groq):** pulpit → „Nagraj notatkę głosową" → nagraj →
   „Analizuj (AI)" → Przegląd → Zapisz.
3. **Materiały:** Biblioteka technik → wejdź w technikę → „Pobierz materiały (AI)".

## Gdzie co jest w kodzie

- Edge Functions: `supabase/functions/{transcribe,extract,materials}/index.ts`
- Klient AI: `apps/app/src/features/ai/repository.ts`
- Ekrany: `analyze.tsx`, `review.tsx`, `record.tsx`, `techniques/[id].tsx`
