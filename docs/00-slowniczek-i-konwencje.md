# 00 — Słowniczek i konwencje

Dokument referencyjny: pojęcia używane w całej dokumentacji oraz konwencje
zapisu. Terminy techniczne sztuk walki podajemy dwujęzycznie (PL / EN), bo
angielskie nazwy są standardem w materiałach do nauki i w słowniku technik.

## Pojęcia produktowe

| Termin | Znaczenie |
|--------|-----------|
| **Sesja treningowa** | Pojedynczy zapis treningu (data, czas trwania, dyscyplina, typ, notatki). |
| **Notatka głosowa** | Nagranie audio robione po treningu; źródło danych do strukturyzacji przez AI. |
| **Transkrypcja** | Tekst powstały z notatki głosowej (Whisper). |
| **Ekstrakcja** | Ustrukturyzowane dane wyciągnięte z transkrypcji przez Claude (techniki, oceny, sparingi). |
| **Technika** | Pozycja w słowniku technik (kanoniczna), np. *rear naked choke* / *duszenie zza pleców*. |
| **Alias techniki** | Synonim/slangowa nazwa mapowana na technikę kanoniczną (np. „RNC”, „mata leão”). |
| **Opanowanie (mastery)** | Poziom biegłości użytkownika w danej technice, zmieniający się w czasie. |
| **Materiał do nauki** | Streszczenie + punkty kluczowe + linki wideo powiązane z techniką (generowane/kurowane przez AI). |
| **Sparing / roll** | Walka treningowa; w grapplingu „roll”, w sportach uderzanych „sparing”. |
| **Tap / poddanie** | Sygnał poddania w grapplingu (oddany lub złapany). |
| **Dyscyplina** | BJJ/Grappling, MMA, boks, muay thai, kickboxing. |

## Pojęcia techniczne

| Termin | Znaczenie |
|--------|-----------|
| **Expo** | Framework i toolchain nad React Native; jeden kod na web/iOS/Android. |
| **RLS** | Row Level Security — reguły dostępu do wierszy w PostgreSQL (Supabase). |
| **Edge Function** | Funkcja serverless w Supabase (Deno) — tu uruchamiamy logikę AI i integracje. |
| **Offline-first** | Architektura, w której appka działa bez sieci, a dane synchronizują się później. |
| **Outbox / kolejka mutacji** | Lokalna kolejka zmian czekających na wysłanie do serwera. |
| **CRDT / LWW** | Strategie scalania zmian; tu: Last-Write-Wins z polami wersjonującymi. |
| **STT** | Speech-to-Text (transkrypcja mowy na tekst). |
| **PRD** | Product Requirements Document — dokument wymagań produktowych. |
| **ADR** | Architecture Decision Record — zapis pojedynczej decyzji architektonicznej. |

## Konwencje zapisu

- **Słowa kluczowe wymagań:** MUSI / POWINNO / MOŻE (patrz [README](README.md#słownik-statusu-wymagań)).
- **Tagi etapów:** `[MVP]`, `[v1]`, `[v2]` przy funkcjach i wymaganiach.
- **Identyfikatory:**
  - Wymagania funkcjonalne: `WF-<obszar>-<nr>` (np. `WF-TRN-01`).
  - Wymagania niefunkcjonalne: `WN-<kategoria>-<nr>` (np. `WN-PERF-01`).
  - Historyjki użytkownika: `US-<nr>`.
  - Decyzje: `ADR-<nr>`.
- **Nazwy w bazie danych:** `snake_case`, tabele w liczbie mnogiej (`training_sessions`).
- **Nazwy w kodzie (TS):** `camelCase` dla zmiennych/funkcji, `PascalCase` dla komponentów i typów.
- **Diagramy:** Mermaid (renderują się w GitHub/większości edytorów Markdown).
- **Daty:** format ISO `YYYY-MM-DD`; czas w UTC w bazie, prezentacja w strefie użytkownika.

## Skróty dyscyplin (kody wewnętrzne)

| Kod | Dyscyplina |
|-----|------------|
| `BJJ` | Brazilian Jiu-Jitsu / Grappling (gi i no-gi) |
| `MMA` | Mixed Martial Arts |
| `BOX` | Boks |
| `MT`  | Muay Thai |
| `KB`  | Kickboxing |

> Kody dyscyplin są rozszerzalne — dodanie nowej dyscypliny to wpis w tabeli
> `disciplines`, bez zmian w kodzie aplikacji (patrz [05 — Model danych](05-model-danych.md)).
