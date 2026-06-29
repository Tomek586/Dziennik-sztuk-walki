# 06 — Słownik technik

Słownik technik to **rdzeń wartości** produktu: to on pozwala zamienić zdanie
„uczyłem się duszenia zza pleców” na powiązanie z konkretną techniką, jej
progresem i materiałami do nauki. Dokument opisuje taksonomię, model nazewnictwa
dwujęzycznego, mapowanie aliasów oraz poziomy opanowania.

## 1. Zasady

- **Kanoniczność:** każda technika ma jeden rekord kanoniczny (`techniques`) z
  nazwą PL i EN oraz `slug` (po angielsku, np. `rear-naked-choke`).
- **Dwujęzyczność:** prezentacja zależna od `locale` użytkownika; wewnętrznie
  mapowanie zawsze idzie przez kanon.
- **Aliasy:** slang, skróty, warianty zapisu i błędy mapowane na kanon
  (`technique_aliases`). To one łapią „żywy język” z notatek głosowych.
- **Rozszerzalność:** nowe techniki/aliasy dodawane przez seed, przez AI
  (kandydat do zatwierdzenia) lub przez użytkownika (prywatne).

## 2. Hierarchia

```
Dyscyplina (BJJ / MMA / BOX / MT / KB)
└─ Kategoria (np. duszenie, dźwignia, obalenie, pozycja, uderzenie, kopnięcie, klincz, obrona)
   └─ Pozycja / kontekst (np. plecy, mount, gard, klincz, dystans)
      └─ Technika (kanon PL/EN)
         ├─ Aliasy (slang, skróty, warianty)
         └─ Relacje (wariant / kontra / przejście / setup)
```

## 3. Kategorie wg dyscyplin

### BJJ / Grappling
| Kategoria | Przykłady technik (PL / EN) |
|-----------|------------------------------|
| Duszenia | duszenie zza pleców / rear naked choke; trójkąt / triangle; gilotyna / guillotine; ezekiel / ezekiel choke |
| Dźwignie | dźwignia na ramię z krzyża / armbar; kimura; americana; dźwignia na piętę / heel hook; nożyce na kolano / kneebar |
| Obalenia/podcięcia | double leg; single leg; podcięcie / foot sweep; rzut przez biodro |
| Pozycje (kontrola) | mount / dosiad; plecy / back control; boczna kontrola / side control; north-south; gard / guard |
| Przejścia (passy) | przejście gardy / guard pass; toreando; knee cut; over-under |
| Pozycje gardy | closed guard; half guard / półgarda; butterfly; de la riva; X-guard |
| Obrony/ucieczki | ucieczka z mountu / mount escape; shrimp / ucieczka biodrem; frame'owanie |

### MMA (łączy grappling + uderzenia + specyfika klatki)
| Kategoria | Przykłady |
|-----------|-----------|
| Uderzenia | cios prosty / jab, cross; sierpowy / hook; podbródkowy / uppercut |
| Kopnięcia | low kick; push kick / teep; high kick |
| Walka w klatce | przyciśnięcie do siatki / cage pressure; obalenie przy siatce |
| Ground & pound | uderzenia w parterze; postawa w gardzie |
| Sprowadzenia | takedown; sprawl (obrona przed obaleniem) |

### Sporty uderzane (BOX / MT / KB)
| Kategoria | Przykłady |
|-----------|-----------|
| Ciosy (BOX/KB/MT) | jab, cross, hook, uppercut, overhand |
| Kopnięcia (MT/KB) | low/middle/high kick, teep, kopnięcie okrężne / roundhouse |
| Łokcie/kolana (MT) | łokieć / elbow; kolano / knee; kolano w klinczu |
| Klincz (MT) | kontrola karku / plum clinch; przeciągnięcia |
| Praca nóg/obrona | uniki / slip; zejścia / roll; bloki; kontry |

> Tabele powyżej to **zalążek seeda**. Pełny zestaw rozbudowujemy iteracyjnie;
> AI dynamicznie zgłasza brakujące techniki jako kandydatów.

## 4. Model nazewnictwa i aliasy (przykład)

Przykład rekordu kanonicznego i jego aliasów dla techniki z Twojego scenariusza:

```jsonc
// techniques
{
  "slug": "rear-naked-choke",
  "discipline": "BJJ",
  "name_pl": "duszenie zza pleców",
  "name_en": "rear naked choke",
  "category": "duszenie",
  "position": "plecy",
  "gi_context": "both"
}

// technique_aliases (normalized = lower, bez ogonków/interpunkcji)
[
  { "alias": "duszenie zza pleców",  "normalized": "duszenie zza plecow", "lang": "pl" },
  { "alias": "duszenie zza pleca",   "normalized": "duszenie zza pleca",  "lang": "pl" },
  { "alias": "RNC",                  "normalized": "rnc",                 "lang": "en" },
  { "alias": "rear naked choke",     "normalized": "rear naked choke",    "lang": "en" },
  { "alias": "mata leão",            "normalized": "mata leao",           "lang": "other" },
  { "alias": "duszenie z plecow",    "normalized": "duszenie z plecow",   "lang": "pl" }
]
```

### Normalizacja przed dopasowaniem
1. zamiana na małe litery,
2. usunięcie polskich znaków diakrytycznych (ł→l, ą→a, …),
3. usunięcie interpunkcji i nadmiarowych spacji,
4. (opcjonalnie) lematyzacja prostych końcówek.

### Strategia dopasowania (od najpewniejszego)
1. **Dokładny alias** (`normalized` == znormalizowane wejście) → wysoka pewność.
2. **Dopasowanie rozmyte** (`pg_trgm` / odległość edycyjna) powyżej progu →
   średnia pewność, oznaczane do weryfikacji.
3. **Dopasowanie semantyczne przez AI** (Claude wskazuje najbliższy kanon z listy
   kandydatów dyscypliny) → pewność z modelu.
4. **Brak dopasowania** → kandydat nowej techniki/aliasu do zatwierdzenia
   (WF-TEC-03).

Każdy wynik niesie `confidence` (0–1) zapisywane w `session_techniques`, co steruje
oznaczeniem „do weryfikacji”.

## 5. Poziomy opanowania (mastery_level)

Spójna, prosta skala 0–4 (kolumna `technique_progress.mastery_level`):

| Poziom | Nazwa | Znaczenie |
|--------|-------|-----------|
| 0 | Poznana | Widziałem/uczono mnie, jeszcze nie ćwiczyłem samodzielnie |
| 1 | Ćwiczona | Robię w drillu z oporem ułatwionym |
| 2 | Płynna w drillu | Wykonuję poprawnie i płynnie w drillu |
| 3 | Działa pod oporem | Wychodzi przy aktywnym, ale nie pełnym oporze |
| 4 | Działa w sparingu | Skutecznie używam w pełnym sparingu/walce |

Reguły aktualizacji (propozycja domyślna, konfigurowalna):
- `outcome = learned` → ustaw min. poziom 0, `first_seen_at` jeśli pusty.
- `outcome = drilled` → podnieś do max(obecny, 1–2).
- `outcome = worked_in_sparring` → podnieś do max(obecny, 4).
- Każde wystąpienie aktualizuje `last_practiced_at` i `practice_count`.
- Poziom **nie spada automatycznie**, ale technika dawno niećwiczona trafia na
  listę „do odświeżenia” (WF-PRG-08).

## 6. Relacje między technikami

`technique_relations.relation`:
- `variant_of` — wariant (np. *armbar z mountu* ↔ *armbar z gardy*),
- `counter_to` — kontra (np. *sprawl* kontruje *double leg*),
- `transition_to` — naturalne przejście (np. *mount* → *back control* → *RNC*),
- `setup_for` — przygotowanie (np. *kontrola nadgarstka* → *RNC*).

Wykorzystanie: na stronie techniki sekcja „powiązane” i podpowiedzi nauki
(„skoro ćwiczysz X, zobacz też Y”).

## 7. Zarządzanie słownikiem

- **Seed (repo):** wersjonowany w `supabase/seed/`, dwujęzyczny, z aliasami.
- **Kandydaci AI:** gdy AI rozpozna technikę spoza słownika — wpis kandydata
  (status do akceptacji); po akceptacji staje się kanonem lub aliasem istniejącej.
- **Techniki użytkownika:** `is_official=false`, `created_by=user_id`, widoczne
  tylko dla autora (RLS), nie zaśmiecają słownika globalnego.
- **Higiena:** okresowy przegląd duplikatów/aliasów; scalanie z zachowaniem
  referencji w `session_techniques`/`technique_progress`.

## 8. Powiązanie ze słownikiem w pipeline

Mapowanie technik to krok w Edge Function `extract` — szczegóły algorytmu i
formatu wejścia/wyjścia w [07 — Pipeline AI](07-pipeline-ai.md).
