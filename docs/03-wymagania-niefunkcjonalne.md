# 03 — Wymagania niefunkcjonalne

Identyfikatory: `WN-<kategoria>-<nr>`.

## 1. Wydajność (PERF)

| ID | Wymaganie | Cel |
|----|-----------|-----|
| WN-PERF-01 | Start aplikacji do interaktywnego ekranu | < 2 s na średnim telefonie, < 1 s przy ciepłym starcie |
| WN-PERF-02 | Czas od zakończenia nagrania do pokazania ekranu „przetwarzanie” | < 500 ms (lokalnie, bez czekania na sieć) |
| WN-PERF-03 | Transkrypcja 60 s nagrania | < 15 s (online) |
| WN-PERF-04 | Ekstrakcja + tagowanie technik | < 10 s |
| WN-PERF-05 | Wyświetlenie materiałów techniki z cache | < 300 ms |
| WN-PERF-06 | Odczyt danych własnych (lista treningów, pulpit) | natychmiastowy (z lokalnej bazy), bez spinnera |
| WN-PERF-07 | Płynność UI | 60 fps przy przewijaniu list, brak janku przy synchronizacji |

## 2. Niezawodność i dostępność (REL)

| ID | Wymaganie |
|----|-----------|
| WN-REL-01 | Utrata sieci NIE MOŻE powodować utraty żadnych danych wprowadzonych przez użytkownika. |
| WN-REL-02 | Awaria usługi AI NIE MOŻE blokować zapisu treningu — sesja zapisuje się, AI dołącza dane później (degradacja stopniowa). |
| WN-REL-03 | Operacje sieciowe MUSZĄ być idempotentne (ponowienie nie tworzy duplikatów) — klucze idempotencji. |
| WN-REL-04 | Nagrania audio MUSZĄ być trwale zapisane lokalnie do czasu potwierdzenia uploadu. |
| WN-REL-05 | Cel dostępności backendu (Supabase) ≥ 99,9% (zgodnie z SLA dostawcy). |

## 3. Skalowalność (SCALE)

| ID | Wymaganie |
|----|-----------|
| WN-SCALE-01 | Model danych i RLS MUSZĄ obsługiwać wielu użytkowników bez zmian schematu (multi-tenant przez `user_id`). |
| WN-SCALE-02 | Słownik technik i materiały MUSZĄ być współdzielone (globalne) i cache'owane, niezależne od liczby użytkowników. |
| WN-SCALE-03 | Koszt AI MUSI rosnąć sublinearnie dzięki cache materiałów per-technika. |
| WN-SCALE-04 | Zapytania pulpitu MUSZĄ korzystać z indeksów/widoków zmaterializowanych przy rosnącej liczbie sesji. |

## 4. Bezpieczeństwo i prywatność (SEC)

| ID | Wymaganie |
|----|-----------|
| WN-SEC-01 | Dane użytkownika MUSZĄ być izolowane przez RLS (użytkownik widzi tylko swoje). |
| WN-SEC-02 | Transmisja MUSI być szyfrowana (TLS); dane w spoczynku szyfrowane przez dostawcę. |
| WN-SEC-03 | Klucze API (Claude, YouTube, STT) NIE MOGĄ znajdować się w aplikacji klienckiej — tylko po stronie Edge Functions. |
| WN-SEC-04 | Treści wysyłane do AI MUSZĄ być minimalizowane; brak danych zbędnych do zadania. |
| WN-SEC-05 | Użytkownik MUSI móc usunąć konto i wszystkie dane (RODO, prawo do bycia zapomnianym). |
| WN-SEC-06 | Logi NIE MOGĄ zawierać treści notatek ani PII w postaci jawnej. |

Szczegóły → [11 — Bezpieczeństwo i prywatność](11-bezpieczenstwo-prywatnosc.md).

## 5. Użyteczność i dostępność cyfrowa (UX/A11Y)

| ID | Wymaganie |
|----|-----------|
| WN-UX-01 | Zapis treningu głosem MUSI być osiągalny w ≤ 2 dotknięcia od ekranu głównego. |
| WN-UX-02 | Aplikacja MUSI działać jednoręcznie (kluczowe akcje w zasięgu kciuka). |
| WN-UX-03 | Kontrast i rozmiary MUSZĄ spełniać WCAG 2.1 AA. |
| WN-UX-04 | Aplikacja MUSI wspierać tryb ciemny (sale treningowe, wieczory). |
| WN-UX-05 | Wszystkie stany (ładowanie, błąd, pusto, offline) MUSZĄ mieć zaprojektowany widok. |
| WN-UX-06 | Aplikacja POWINNA wspierać czytniki ekranu (etykiety dostępności). |

## 6. Jakość kodu i utrzymanie (MAINT)

| ID | Wymaganie |
|----|-----------|
| WN-MAINT-01 | Cały kod w TypeScript w trybie `strict`. |
| WN-MAINT-02 | Wspólna logika domenowa (typy, walidacja) MUSI być współdzielona między web i mobile (monorepo/pakiet `core`). |
| WN-MAINT-03 | Schemat danych MUSI być wersjonowany migracjami (SQL w repo). |
| WN-MAINT-04 | Kontrakty API/typy generowane z bazy (typy Supabase) — jedno źródło prawdy. |
| WN-MAINT-05 | Krytyczne ścieżki (ekstrakcja, sync, mapowanie technik) MUSZĄ mieć testy jednostkowe; pipeline AI — testy na zestawie przykładów (golden set). |
| WN-MAINT-06 | Walidacja danych wejścia/wyjścia AI schematem (np. Zod) — twarde kontrakty. |

## 7. Obserwowalność (OBS)

| ID | Wymaganie |
|----|-----------|
| WN-OBS-01 | System MUSI zbierać metryki pipeline AI: czas, koszt, pewność, wskaźnik korekt ręcznych. |
| WN-OBS-02 | Błędy klienta i Edge Functions MUSZĄ trafiać do narzędzia monitoringu (np. Sentry). |
| WN-OBS-03 | Stan synchronizacji i kolejki MUSI być diagnozowalny (log lokalny + ekran diagnostyczny). |

## 8. Koszt (COST)

| ID | Wymaganie |
|----|-----------|
| WN-COST-01 | Średni koszt AI na trening < 0,05 USD; twardy limit per użytkownik/miesiąc konfigurowalny. |
| WN-COST-02 | MVP MUSI mieścić się w darmowych progach Supabase/Expo dla jednego użytkownika. |
| WN-COST-03 | Materiały AI per-technika generowane raz i współdzielone (brak ponownego liczenia). |

## 9. Internacjonalizacja (I18N)

| ID | Wymaganie |
|----|-----------|
| WN-I18N-01 | UI w języku polskim; architektura tekstów gotowa na dodanie EN (klucze i18n). |
| WN-I18N-02 | Techniki przechowywane dwujęzycznie (PL/EN), prezentacja zależna od preferencji. |
| WN-I18N-03 | Formatowanie dat/liczb/jednostek zależne od ustawień użytkownika. |
