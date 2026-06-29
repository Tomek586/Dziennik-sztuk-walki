# 02 — Wymagania funkcjonalne

Identyfikatory: `WF-<obszar>-<nr>`. Obszary: `AUT` (konto), `TRN` (treningi),
`VOI` (głos/AI), `TEC` (techniki), `LRN` (nauka/materiały), `PRG` (progres),
`SPR` (sparingi), `BDY` (waga/kondycja), `SYNC` (offline/sync), `SET` (ustawienia).

Każde wymaganie ma priorytet (MUSI/POWINNO/MOŻE) i etap (`[MVP]/[v1]/[v2]`).

---

## 1. Konto i logowanie (AUT)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-AUT-01 | Użytkownik MUSI móc założyć konto e-mailem i hasłem oraz zalogować się. | MUSI | MVP |
| WF-AUT-02 | System POWINIEN wspierać logowanie przez Google/Apple (OAuth). | POWINNO | v1 |
| WF-AUT-03 | Użytkownik MUSI móc zresetować hasło przez e-mail. | MUSI | MVP |
| WF-AUT-04 | Profil MUSI zawierać: imię/nick, trenowane dyscypliny, stopień/pas per dyscyplina, jednostki (kg/lb). | MUSI | MVP |
| WF-AUT-05 | Użytkownik MUSI móc usunąć konto wraz z danymi (RODO). | MUSI | v1 |
| WF-AUT-06 | Sesja MUSI być utrzymywana między uruchomieniami (token odświeżany). | MUSI | MVP |

## 2. Zapis treningu (TRN)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-TRN-01 | Użytkownik MUSI móc utworzyć sesję treningową z polami: data/godzina, dyscyplina, typ treningu, czas trwania, miejsce/klub, intensywność (1–10), samopoczucie (1–5), notatki tekstowe. | MUSI | MVP |
| WF-TRN-02 | Typy treningu MUSZĄ zależeć od dyscypliny (np. BJJ: gi/no-gi, technika, drilling, sparingi/rolls; uderzane: praca na worku, tarcze, sparing, kondycja). | MUSI | MVP |
| WF-TRN-03 | Sesja MUSI dać się utworzyć i zapisać w całości offline. | MUSI | MVP |
| WF-TRN-04 | Użytkownik MUSI móc edytować i usuwać sesję. | MUSI | MVP |
| WF-TRN-05 | Sesja MUSI przechowywać listę technik (z notatkami „dobrze/źle” per technika) oraz listę sparingów. | MUSI | MVP |
| WF-TRN-06 | Użytkownik MOŻE dodać zdjęcia/krótkie wideo do sesji. | MOŻE | v1 |
| WF-TRN-07 | System POWINIEN sugerować datę/typ na podstawie harmonogramu/historii. | POWINNO | v1 |

## 3. Notatka głosowa i AI (VOI)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-VOI-01 | Użytkownik MUSI móc nagrać notatkę głosową w aplikacji (z licznikiem czasu, pauzą). | MUSI | MVP |
| WF-VOI-02 | Nagranie MUSI dać się zrobić offline; transkrypcja i ekstrakcja wykonują się po odzyskaniu sieci. | MUSI | MVP |
| WF-VOI-03 | System MUSI transkrybować nagranie na tekst (PL) i pokazać transkrypcję do korekty. | MUSI | MVP |
| WF-VOI-04 | System MUSI wyciągnąć z transkrypcji: ćwiczone techniki, ocenę co poszło dobrze/źle, sparingi (wyniki, tapy), samopoczucie, czas/typ jeśli wspomniane. | MUSI | MVP |
| WF-VOI-05 | Wynik ekstrakcji MUSI być w pełni edytowalny przed zapisem (potwierdź/popraw/odrzuć każdy element). | MUSI | MVP |
| WF-VOI-06 | Elementy o niskiej pewności rozpoznania MUSZĄ być oznaczone do weryfikacji. | MUSI | MVP |
| WF-VOI-07 | Użytkownik MOŻE wpisać/wkleić tekst zamiast nagrania i przepuścić go przez tę samą ekstrakcję. | POWINNO | MVP |
| WF-VOI-08 | System POWINIEN pozwalać dograć kilka notatek do jednej sesji. | POWINNO | v1 |
| WF-VOI-09 | Nagranie audio MOŻE być przechowywane (do odsłuchu) lub kasowane po transkrypcji — wybór w ustawieniach. | MOŻE | v1 |

## 4. Techniki i słownik (TEC)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-TEC-01 | System MUSI utrzymywać kanoniczny słownik technik (PL+EN, kategoria, pozycja, dyscyplina) — patrz [06](06-slownik-technik.md). | MUSI | MVP |
| WF-TEC-02 | System MUSI mapować aliasy/slang na technikę kanoniczną (np. „RNC”, „mata leão”, „duszenie zza pleców”). | MUSI | MVP |
| WF-TEC-03 | Gdy AI rozpozna technikę spoza słownika, system MUSI utworzyć kandydata do zatwierdzenia (i opcjonalnie dodać alias). | MUSI | MVP |
| WF-TEC-04 | Użytkownik MUSI móc ręcznie wyszukać i dodać technikę do sesji (autouzupełnianie). | MUSI | MVP |
| WF-TEC-05 | Użytkownik MOŻE tworzyć własne, prywatne techniki/warianty. | MOŻE | v1 |
| WF-TEC-06 | Techniki MUSZĄ być powiązane relacjami (np. wariant, kontra, przejście z pozycji). | POWINNO | v1 |

## 5. Nauka i materiały (LRN)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-LRN-01 | Każda technika MUSI mieć stronę z: streszczeniem AI, punktami kluczowymi, typowymi błędami, dobranymi materiałami wideo. | MUSI | MVP |
| WF-LRN-02 | Po dodaniu techniki do sesji system MUSI automatycznie zaproponować/wyświetlić powiązane materiały. | MUSI | MVP |
| WF-LRN-03 | Materiały (streszczenie + linki) MUSZĄ być cache'owane per-technika i współdzielone między użytkownikami (oszczędność kosztów AI). | MUSI | MVP |
| WF-LRN-04 | Użytkownik MUSI móc oznaczyć materiał jako pomocny/niepomocny (feedback poprawia dobór). | POWINNO | v1 |
| WF-LRN-05 | Użytkownik MUSI móc zapisać własny link/notatkę do techniki. | POWINNO | MVP |
| WF-LRN-06 | System POWINIEN odświeżać/rewalidować linki wideo (martwe linki → ponowne wyszukanie). | POWINNO | v1 |
| WF-LRN-07 | Użytkownik MOŻE oznaczyć materiał „do obejrzenia” i mieć listę nauki (watchlist). | MOŻE | v1 |

## 6. Progres i statystyki (PRG)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-PRG-01 | System MUSI śledzić poziom opanowania każdej techniki (np. *poznana → ćwiczona → działa w drillu → działa w sparingu*) z historią zmian. | MUSI | MVP |
| WF-PRG-02 | Pulpit MUSI pokazywać frekwencję i wolumen: liczba treningów, godziny/rundy w tygodniu/miesiącu, seria (streak). | MUSI | MVP |
| WF-PRG-03 | System MUSI pokazywać kalendarz aktywności (heatmapa dni treningowych). | MUSI | MVP |
| WF-PRG-04 | System MUSI pokazywać statystyki sparingów: bilans, tapy złapane/oddane, typy zakończeń. | MUSI | MVP |
| WF-PRG-05 | System MUSI prezentować wykres wagi i historii stopni/pasów. | MUSI | MVP |
| WF-PRG-06 | Użytkownik MUSI móc ustawiać cele (np. „3 treningi/tydz.”, „opanować trójkąt”) i widzieć postęp. | POWINNO | v1 |
| WF-PRG-07 | System POWINIEN generować okresowe podsumowania (tydzień/miesiąc) z wnioskami AI. | POWINNO | v1 |
| WF-PRG-08 | System MOŻE wskazywać „zaniedbane” techniki (dawno niećwiczone, oznaczone do poprawy). | MOŻE | v1 |

## 7. Sparingi (SPR)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-SPR-01 | Użytkownik MUSI móc zapisać rundy sparingowe: liczba, czas rundy, partnerzy (anonimowo/nick), wynik. | MUSI | MVP |
| WF-SPR-02 | Dla grapplingu system MUSI rejestrować tapy oddane/złapane i technikę zakończenia. | MUSI | MVP |
| WF-SPR-03 | Dla sportów uderzanych system POWINIEN rejestrować notatki o wymianach/dominacji rund. | POWINNO | v1 |
| WF-SPR-04 | Użytkownik MOŻE prowadzić „profil przeciwnika” (powtarzający się partnerzy, notatki). | MOŻE | v2 |

## 8. Waga i kondycja (BDY)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-BDY-01 | Użytkownik MUSI móc zapisać pomiar wagi z datą. | MUSI | MVP |
| WF-BDY-02 | Użytkownik MUSI móc zapisać stopień/pas i datę nadania per dyscyplina. | MUSI | MVP |
| WF-BDY-03 | Użytkownik MOŻE logować subiektywną kondycję/zmęczenie/sen i kontuzje. | MOŻE | v1 |

## 9. Offline i synchronizacja (SYNC)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-SYNC-01 | Wszystkie operacje zapisu/odczytu danych własnych MUSZĄ działać offline. | MUSI | MVP |
| WF-SYNC-02 | Zmiany offline MUSZĄ trafiać do kolejki i synchronizować się automatycznie po odzyskaniu sieci. | MUSI | MVP |
| WF-SYNC-03 | System MUSI pokazywać stan synchronizacji (oczekujące zmiany, ostatnia synchronizacja). | MUSI | MVP |
| WF-SYNC-04 | Konflikty MUSZĄ być rozwiązywane wg jasnej strategii (LWW + wersje), patrz [10](10-offline-sync.md). | MUSI | MVP |

## 10. Ustawienia i pozostałe (SET)

| ID | Wymaganie | Prio | Etap |
|----|-----------|------|------|
| WF-SET-01 | Użytkownik MUSI móc ustawić: jednostki, język, dyscypliny, przechowywanie audio, limity AI. | MUSI | MVP |
| WF-SET-02 | Użytkownik MUSI móc wyeksportować swoje dane (JSON/CSV). | POWINNO | v1 |
| WF-SET-03 | Użytkownik MOŻE włączyć powiadomienia (przypomnienie o zapisaniu treningu, watchlist). | MOŻE | v1 |
| WF-SET-04 | (v2) Użytkownik MOŻE udostępnić dziennik trenerowi z wybranym zakresem i rolą. | MOŻE | v2 |

---

## Historyjki użytkownika (kluczowe)

- **US-01** — *Jako trenujący, po treningu nagrywam 60-sekundową notatkę, żeby
  zapisać sesję bez wyklikiwania.*
  **Akceptacja:** nagranie startuje ≤ 2 kliknięcia od ekranu głównego; po
  zakończeniu widzę ekran „przetwarzanie” (lub „zapisano, przetworzę po
  połączeniu” offline).

- **US-02** — *Jako trenujący, chcę zobaczyć wyciągnięte techniki i oceny i je
  poprawić, żeby dane były wiarygodne.*
  **Akceptacja:** lista technik z oznaczeniem pewności; każdy element edytowalny;
  zapis aktualizuje progres.

- **US-03** — *Jako trenujący, gdy dodam technikę „duszenie zza pleców”, chcę od
  razu zobaczyć streszczenie i 2–3 dobre filmy, żeby ją dopracować.*
  **Akceptacja:** strona techniki z materiałem pojawia się ≤ 3 s (z cache) lub z
  jasnym stanem „dobieram materiały…”.

- **US-04** — *Jako trenujący, chcę zobaczyć na pulpicie, ile trenowałem w tym
  miesiącu i jak idą sparingi, żeby ocenić progres.*
  **Akceptacja:** pulpit pokazuje frekwencję, streak, heatmapę, bilans sparingów.

- **US-05** — *Jako trenujący na sali bez zasięgu, chcę zapisać cały trening i
  mieć pewność, że nic nie zginie.*
  **Akceptacja:** pełny zapis offline; widoczny status „oczekuje na synchronizację”;
  po sieci dane wysyłają się bez działania użytkownika.

Pełne przepływy i ekrany → [09 — Projekt UX](09-projekt-ux.md).
