# Dziennik Sztuk Walki — Dokumentacja Projektu

> Aplikacja webowa i mobilna do prowadzenia dziennika treningów sztuk walki:
> monitorowanie progresu, zapisywanie treningów (głosem), analiza co poszło
> dobrze/źle oraz automatyczne łączenie ćwiczonych technik z materiałami do nauki
> dobieranymi i streszczanymi przez AI.

**Nazwa robocza:** Dziennik Sztuk Walki (docelowa nazwa do ustalenia — np. *MatLog*, *RollBook*, *Tatami*).
**Status dokumentacji:** wersja 1.0 (29.06.2026)
**Autor produktu:** Tomasz Dziedzic

---

## Jak czytać tę dokumentację

Dokumenty są ułożone od „dlaczego i co” (produkt) przez „jak” (architektura,
dane, AI) po „kiedy” (roadmapa). Jeśli czytasz pierwszy raz — idź po kolei.
Jeśli wracasz do konkretnego tematu — skacz po linkach.

| # | Dokument | O czym jest |
|---|----------|-------------|
| 00 | [Słowniczek i konwencje](00-slowniczek-i-konwencje.md) | Pojęcia, skróty, konwencje używane w całej dokumentacji |
| 01 | [Wizja produktu (PRD)](01-wizja-produktu.md) | Problem, cele, persony, propozycja wartości, zakres |
| 02 | [Wymagania funkcjonalne](02-wymagania-funkcjonalne.md) | Funkcje, historyjki użytkownika, kryteria akceptacji |
| 03 | [Wymagania niefunkcjonalne](03-wymagania-niefunkcjonalne.md) | Wydajność, bezpieczeństwo, dostępność, jakość |
| 04 | [Architektura techniczna](04-architektura-techniczna.md) | Stos technologiczny, komponenty, diagramy systemu |
| 05 | [Model danych](05-model-danych.md) | Encje, ERD, schemat tabel, RLS, indeksy |
| 06 | [Słownik technik](06-slownik-technik.md) | Taksonomia technik (rdzeń produktu), mapowanie PL↔EN, aliasy |
| 07 | [Pipeline AI](07-pipeline-ai.md) | Głos → transkrypcja → ekstrakcja → tagowanie → materiały |
| 08 | [Specyfikacja API i integracji](08-specyfikacja-api.md) | Endpointy, kontrakty, YouTube, Claude, Whisper |
| 09 | [Projekt UX](09-projekt-ux.md) | Przepływy użytkownika, ekrany, nawigacja, design system |
| 10 | [Offline-first i synchronizacja](10-offline-sync.md) | Strategia offline, kolejka, rozwiązywanie konfliktów |
| 11 | [Bezpieczeństwo i prywatność](11-bezpieczenstwo-prywatnosc.md) | Auth, RODO, szyfrowanie, model uprawnień |
| 12 | [Roadmapa](12-roadmapa.md) | Etapy MVP → v1 → v2, kamienie milowe, kryteria wyjścia |
| 13 | [Środowisko i koszty](13-srodowisko-i-koszty.md) | Setup deweloperski, narzędzia, CI/CD, szacunek kosztów |
| 14 | [Rejestr decyzji (ADR)](14-decyzje-architektoniczne.md) | Kluczowe decyzje i ich uzasadnienie |

---

## Najważniejsze decyzje (skrót)

- **Platformy:** web + iOS + Android z jednego kodu (Expo / React Native + TypeScript).
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions).
- **Tryb pracy:** offline-first — trening zapiszesz bez zasięgu, dane zsynchronizują się później.
- **Wejście:** notatka głosowa po treningu → transkrypcja (Whisper) → strukturyzacja (Claude).
- **Rdzeń wartości:** rozpoznana technika automatycznie łączy się ze streszczeniem i materiałami wideo dobranymi przez AI.
- **Dyscypliny na start:** BJJ/Grappling, MMA, sporty uderzane (boks, muay thai, kickboxing).
- **Prywatność:** dane domyślnie prywatne; model danych przygotowany pod dzielenie się z trenerem.

Pełne uzasadnienia → [14 — Rejestr decyzji](14-decyzje-architektoniczne.md).

---

## Słownik statusu wymagań

W całej dokumentacji używamy słów kluczowych zgodnie z RFC 2119 (w wersji PL):

- **MUSI / WYMAGANE** — twardy wymóg.
- **POWINNO / ZALECANE** — silna rekomendacja, dopuszczalne odstępstwo z uzasadnieniem.
- **MOŻE / OPCJONALNE** — funkcja dodatkowa, do rozważenia w przyszłych etapach.

Każda funkcja jest dodatkowo otagowana etapem: **[MVP]**, **[v1]**, **[v2]**.
