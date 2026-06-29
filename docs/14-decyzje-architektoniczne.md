# 14 — Rejestr decyzji architektonicznych (ADR)

Każda decyzja: kontekst, decyzja, alternatywy, konsekwencje. Status: **przyjęta**
(potwierdzona z autorem) lub **propozycja** (do potwierdzenia w implementacji).

---

## ADR-001 — Jeden kod na web + mobile (Expo / React Native)
**Status:** przyjęta.
**Kontekst:** projekt jednoosobowy, potrzeba web + iOS + Android.
**Decyzja:** Expo / React Native + TypeScript; Expo Router; EAS do buildów i OTA.
**Alternatywy:** Flutter (inny ekosystem niż webowy React); osobne kody web +
native (duplikacja); PWA (słabszy dostęp natywny/offline).
**Konsekwencje:** maksymalne współdzielenie kodu i niski narzut utrzymania;
zależność od ekosystemu Expo; część natywnych niuansów wymaga dev buildów.

## ADR-002 — Supabase jako backend (BaaS)
**Status:** przyjęta.
**Kontekst:** potrzeba bazy, auth, storage, realtime i logiki serwerowej przy
małym zespole; architektura gotowa na wielu użytkowników.
**Decyzja:** Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions).
**Alternatywy:** Firebase (NoSQL — trudniejsze złożone statystyki/relacje, które
są tu istotne); własny backend (Node/NestJS — większy nakład); inne BaaS.
**Konsekwencje:** relacyjny model idealny pod słownik technik i statystyki; RLS
daje izolację multi-tenant; pewne uzależnienie od dostawcy (mitygacja: standardowy
Postgres, migracje w repo).

## ADR-003 — Offline-first z lokalną bazą i outboxem
**Status:** przyjęta.
**Kontekst:** sale treningowe bez zasięgu; zapis nie może czekać na sieć.
**Decyzja:** WatermelonDB (SQLite) jako źródło prawdy UI + kolejka mutacji + sync
push/pull; pola `version`/`updated_at`/`deleted_at`.
**Alternatywy:** tylko cache TanStack Query (niewystarczające dla pełnego
offline); RxDB/PowerSync/inne silniki sync.
**Konsekwencje:** doskonałe UX offline i natychmiastowe odczyty; większa złożoność
synchronizacji i konfliktów (patrz [10](10-offline-sync.md)).

## ADR-004 — Wejście głosowe jako podstawowy sposób zapisu
**Status:** przyjęta.
**Kontekst:** po treningu wysiłek na wyklikiwanie jest barierą; wybór autora.
**Decyzja:** nagranie głosowe → transkrypcja → ekstrakcja AI; formularz to korekta.
**Alternatywy:** formularz strukturalny jako podstawa (większe tarcie); czysty
wolny tekst + AI (gorsze dane do wykresów).
**Konsekwencje:** najniższe tarcie; zależność od jakości STT i ekstrakcji →
obowiązkowy krok przeglądu/korekty i metryki jakości.

## ADR-005 — AI dobiera i streszcza materiały (cache współdzielony)
**Status:** przyjęta.
**Kontekst:** ręczne szukanie dobrych materiałów jest czasochłonne; jakość losowa.
**Decyzja:** Claude wybiera i uzasadnia materiały oraz tworzy streszczenia/punkty;
wyniki cache'owane **per technika** i współdzielone między użytkownikami.
**Alternatywy:** czyste auto-wyszukiwanie YouTube (losowa jakość); ręczna
biblioteka (praca po stronie użytkownika); kombinacja kurowana+fallback.
**Konsekwencje:** wysoka trafność i tania skala (koszt rośnie z liczbą technik,
nie użytkowników); zależność od dostępności wideo → rewalidacja linków i feedback.

## ADR-006 — Rozwiązywanie konfliktów: LWW + append
**Status:** propozycja.
**Kontekst:** rzadkie konflikty (głównie jeden użytkownik, czasem 2 urządzenia).
**Decyzja:** Last-Write-Wins na rekord (`version`/`updated_at`); encje szczegółowe
traktowane jako append; usuwanie miękkie.
**Alternatywy:** pełne CRDT (nadmiarowe dla tej domeny); rozwiązywanie ręczne
(uciążliwe).
**Konsekwencje:** prostota i przewidywalność; rzadkie utraty „przegranej” edycji
łagodzone dziennikiem konfliktów.

## ADR-007 — Dostawca transkrypcji (Whisper): API vs self-host
**Status:** propozycja (decyzja przy implementacji MVP).
**Kontekst:** potrzebna dobra jakość PL przy rozsądnym koszcie i prywatności.
**Decyzja (wstępna):** start na zarządzanym API Whisper (szybkie wdrożenie);
ewaluacja self-host/alternatyw, jeśli koszt/prywatność tego wymagają.
**Alternatywy:** self-host Whisper (kontrola/prywatność, większy nakład ops); inni
dostawcy STT.
**Konsekwencje:** szybki start; punkt do rewizji po pomiarze jakości PL i kosztu
na golden secie.

## ADR-008 — Słownik technik jako rdzeń z aliasami i mapowaniem AI
**Status:** przyjęta.
**Kontekst:** automatyczne łączenie „żywego języka” notatek z techniką i nauką.
**Decyzja:** kanon PL/EN + aliasy (slang/skróty) + wieloetapowe dopasowanie
(dokładne → rozmyte → semantyczne AI) + kandydaci do zatwierdzenia.
**Alternatywy:** wyłącznie dopasowanie tekstowe (zawodne dla slangu); wyłącznie AI
za każdym razem (kosztowne, niestabilne).
**Konsekwencje:** wysoka trafność tagowania i kontrola jakości; konieczność
utrzymania słownika i higieny aliasów.

## ADR-009 — Monorepo z wydzieloną logiką domenową
**Status:** przyjęta.
**Kontekst:** współdzielenie typów/logiki między web, mobile i Edge Functions.
**Decyzja:** monorepo (pnpm + Turborepo); `packages/core` (logika), `packages/ui`,
`packages/api-types` (typy z bazy).
**Alternatywy:** osobne repozytoria (rozjazd typów/logiki).
**Konsekwencje:** jedno źródło prawdy dla typów i reguł; nieco większa złożoność
konfiguracji buildów.

## ADR-010 — Dane współpracy (trener) w schemacie od MVP, w UI od v2
**Status:** przyjęta.
**Kontekst:** „prywatne teraz, gotowe na trenera później”.
**Decyzja:** tabele `gyms`/`memberships`/`share_grants` i polityki RLS
przewidziane od początku; UI dopiero w v2.
**Alternatywy:** dodać później z migracją (ryzyko rozbicia danych/uprawnień).
**Konsekwencje:** brak kosztownej migracji w przyszłości; minimalny dodatkowy
nakład na starcie.

## ADR-011 — Warstwa offline w Etapie 0: lekki magazyn zamiast WatermelonDB
**Status:** przyjęta (zakres: Etap 0).
**Kontekst:** cel Etapu 0 to działający pionowy plasterek na web i telefonie
(Expo Go) bez dev buildu. WatermelonDB (ADR-003) wymaga natywnych modułów i
własnego dev buildu, a na web osobnego adaptera — to blokuje szybki slice.
**Decyzja:** w Etapie 0 offline-first realizujemy za abstrakcją
(`offline/collection` + `Outbox` + `SyncEngine`) na bazie AsyncStorage
(cross-platform: web + Expo Go). Kontrakt warstwy jest stabilny; w v1 podmienimy
implementację magazynu na WatermelonDB bez zmian w warstwach wyżej.
**Alternatywy:** WatermelonDB od razu (blokuje Expo Go, komplikuje web w MVP);
brak offline (sprzeczne z wymaganiami WF-SYNC-*).
**Konsekwencje:** szybkie, weryfikowalne MVP slice (web bundle przechodzi);
AsyncStorage nie jest wydajny przy bardzo dużych zbiorach — akceptowalne na
Etapie 0; migracja do WatermelonDB zaplanowana na v1.

---

## Decyzje otwarte (do potwierdzenia)
- **D-1:** Docelowa nazwa i branding produktu.
- **D-2:** Konkretny dostawca STT (po ewaluacji jakości PL/kosztu) — ADR-007.
- **D-3:** Hosting web (Vercel/Netlify/Cloudflare) — wg preferencji i kosztu.
- **D-4:** Model monetyzacji (po walidacji wartości) — etap v2.
- **D-5:** Zakres seeda słownika technik na start (ile technik/aliasów na MVP).
