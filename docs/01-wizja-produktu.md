# 01 — Wizja produktu (PRD)

## 1. Problem

Osoby trenujące sztuki walki uczą się dziesiątek technik, ale po treningu ich
wiedza ulatuje:

- **Brak pamięci treningu.** Po kilku dniach nie pamiętasz, czego dokładnie
  uczył trener, co poprawiłeś, a co znów nie wyszło w sparingu.
- **Notatki są uciążliwe.** Po wyczerpującym treningu nikt nie chce wyklikiwać
  formularzy. Notatki w telefonie są chaotyczne i nieprzeszukiwalne.
- **Nauka jest oderwana od praktyki.** „Muszę dopracować duszenie zza pleców” —
  i co dalej? Szukanie dobrych materiałów wideo zajmuje czas i kończy się
  przypadkowymi filmami o różnej jakości.
- **Progres jest niewidoczny.** Trudno zobaczyć, czy faktycznie idziesz do
  przodu: ile trenujesz, które techniki opanowujesz, jak wypadasz w sparingach.

## 2. Propozycja wartości

> **Mów, co było na treningu — resztą zajmie się aplikacja.**

Po treningu nagrywasz krótką notatkę głosową. Aplikacja:

1. **Transkrybuje** ją (po polsku),
2. **Rozumie** treść — wyciąga ćwiczone techniki, to co poszło dobrze/źle,
   wyniki sparingów, samopoczucie,
3. **Taguje** techniki według słownika (PL↔EN) i aktualizuje Twój progres,
4. **Łączy** każdą technikę z materiałami do nauki — streszczeniem AI, punktami
   kluczowymi i dobranymi filmami,
5. **Pokazuje** progres w czytelnych wykresach i kalendarzu aktywności.

Efekt: prowadzenie szczegółowego dziennika kosztuje Cię 60 sekund mówienia, a w
zamian dostajesz uporządkowaną wiedzę, spersonalizowane materiały i mierzalny
progres.

## 3. Cele produktu

### Cele użytkownika
- Zapisać trening w < 90 sekund, bez wyklikiwania.
- W każdej chwili wiedzieć, czego się uczył i co wymaga pracy.
- Mieć „pod ręką” dobre materiały do każdej ćwiczonej techniki.
- Widzieć obiektywny progres (techniki, frekwencja, sparingi, stopnie).

### Cele biznesowe/projektowe
- Zbudować działające MVP dla jednego użytkownika (autora) i potwierdzić wartość.
- Architektura gotowa do skalowania na wielu użytkowników bez przepisywania.
- Utrzymać niski koszt operacyjny (AI on-demand, hojne darmowe progi Supabase/Expo).

### Mierniki sukcesu (KPI)
| Miernik | Cel MVP |
|---------|---------|
| Czas zapisu treningu | < 90 s (mediana) |
| Skuteczność rozpoznania technik | ≥ 85% poprawnych tagów na zdaniu opisującym technikę |
| Trafność materiałów (subiektywna ocena 1–5) | ≥ 4,0 średnio |
| Retencja własna (autor loguje treningi) | ≥ 80% treningów zapisanych |
| Koszt AI na trening | < 0,05 USD (cel), twardy limit < 0,15 USD |

## 4. Persony

### Persona główna — „Tomek, hobbysta z ambicją” (MVP)
- Trenuje BJJ 3×/tydz. + okazjonalnie MMA i muay thai.
- Chce realnie się rozwijać, nie tylko „chodzić na trening”.
- Ma dość gubienia wiedzy i chaotycznych notatek.
- Technicznie ogarnięty, ale po treningu zmęczony — liczy się minimalny wysiłek.
- **Potrzeba:** szybki zapis głosowy + automatyczne łączenie z nauką + widoczny progres.

### Persona wtórna — „Trener” (v2, projektowana w modelu danych już teraz)
- Prowadzi grupę zawodników.
- Chce wglądu w dzienniki podopiecznych (za zgodą), komentowania, zadawania pracy.
- **Potrzeba:** współdzielony wgląd, role i uprawnienia, feedback.

### Persona wtórna — „Zawodnik przygotowujący się do walki” (v2)
- Cykl przygotowań, kontrola wagi, plan, analiza przeciwników.
- **Potrzeba:** zaawansowane statystyki, planowanie obozu, cele.

## 5. Zakres (Scope)

### W zakresie MVP
- Konto i logowanie (jeden użytkownik, ale pełen auth).
- Zapis treningu: notatka głosowa → transkrypcja → ekstrakcja → strukturyzacja.
- Ręczna korekta wyniku ekstrakcji (edycja technik, ocen, sparingów).
- Słownik technik dla BJJ/Grappling, MMA, sportów uderzanych (zalążek + rozbudowa).
- Automatyczne łączenie technik z materiałami (streszczenie AI + linki wideo).
- Progres: opanowanie technik, frekwencja/wolumen, sparingi, waga/stopnie.
- Pulpit i kalendarz aktywności.
- Działanie offline-first z synchronizacją.

### Poza zakresem MVP (później)
- Udostępnianie trenerowi i funkcje społecznościowe (v2 — ale model danych gotowy).
- Planowanie obozów/cykli przygotowań (v2).
- Zaawansowana analityka porównawcza, rankingi (v2).
- Monetyzacja / subskrypcje (do rozważenia po walidacji).
- Integracje z urządzeniami (puls, sen) (v2+).

## 6. Założenia i ograniczenia

- **Język główny:** polski (UI i transkrypcja). Terminy technik dwujęzyczne.
- **Jeden twórca:** decyzje technologiczne premiują niski narzut utrzymania.
- **Koszt AI płatny za użycie** — pipeline musi być tani i odporny na błędy
  (np. degradacja do trybu bez AI, gdy brak budżetu/sieci).
- **Prywatność danych treningowych** — dane są prywatne domyślnie (RLS).

## 7. Ryzyka i mitygacje

| Ryzyko | Wpływ | Mitygacja |
|--------|-------|-----------|
| Słaba jakość transkrypcji PL (slang, hałas na sali) | Wysoki | Whisper large/dedykowany model PL, możliwość poprawy tekstu ręcznie, zachęta do nagrywania w ciszy po treningu |
| Błędne rozpoznanie techniki | Średni | Ekstrakcja zawsze edytowalna; uczenie aliasów; potwierdzenie niskiej pewności |
| Koszt AI rośnie z użyciem | Średni | Limity, cache materiałów per-technika (współdzielony), batchowanie |
| Materiał wideo zniknie (YouTube) | Niski | Walidacja linków, fallback do nowego wyszukania, cache metadanych |
| Rozjazd danych offline/online | Średni | Jasna strategia sync (LWW + wersje), patrz [10](10-offline-sync.md) |
| Przeładowanie zakresu (over-scope) | Wysoki | Twardy podział MVP/v1/v2, patrz [12 — Roadmapa](12-roadmapa.md) |

## 8. Czego NIE robimy (zasady)

- Nie zmuszamy do wyklikiwania — głos jest pierwszorzędny, formularz jest korektą.
- Nie pokazujemy losowych filmów — materiał ma być trafny lub żaden.
- Nie blokujemy użytkownika offline — brak sieci nie może zatrzymać zapisu treningu.
- Nie komplikujemy MVP funkcjami społecznościowymi — ale ich nie zamykamy w danych.
