/**
 * Normalizacja i dopasowanie technik na podstawie aliasów.
 * Funkcja `normalizeTechnique` jest lustrem `public.dsw_normalize` w bazie
 * (migracja 0003), aby normalizacja po stronie klienta i serwera dawała ten
 * sam wynik. Patrz docs/06-slownik-technik.md §4.
 */

// Mapa znaków diakrytycznych → ASCII (PL + typowe łacińskie). Spójna z translate w SQL.
const ACCENTS: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ż: 'z', ź: 'z',
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
};

export function normalizeTechnique(input: string): string {
  const lowered = (input ?? '').toLowerCase();
  // Zakres Latin-1 Supplement + Latin Extended-A — tu żyją polskie i typowe
  // łacińskie znaki diakrytyczne. Nieznane znaki przechodzą bez zmian i
  // zostaną usunięte w kolejnym kroku.
  const deaccented = lowered.replace(/[À-ɏ]/g, (char) => ACCENTS[char] ?? char);
  return deaccented
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export type MatchKind = 'exact' | 'fuzzy' | 'none';

/** Odwzorowanie aliasu na technikę (np. z `technique_aliases`). */
export interface TechniqueAliasRef {
  techniqueId: string;
  /** wartość znormalizowana (kolumna `normalized` z bazy) */
  normalized: string;
}

export interface TechniqueMatch {
  techniqueId: string | null;
  kind: MatchKind;
  /** 0..1 — pewność dopasowania (1 = dokładne) */
  confidence: number;
}

const NO_MATCH: TechniqueMatch = { techniqueId: null, kind: 'none', confidence: 0 };

/**
 * Dopasowuje surowy tekst (np. fragment notatki) do techniki:
 * 1) dokładne dopasowanie znormalizowanego aliasu (pewność 1),
 * 2) proste dopasowanie rozmyte: alias zawiera wejście lub odwrotnie (pewność 0.6).
 * Bardziej zaawansowane dopasowanie (trigram/AI) realizujemy po stronie serwera.
 */
export function matchTechnique(
  input: string,
  aliases: readonly TechniqueAliasRef[],
): TechniqueMatch {
  const normalized = normalizeTechnique(input);
  if (normalized === '') return NO_MATCH;

  for (const alias of aliases) {
    if (alias.normalized === normalized) {
      return { techniqueId: alias.techniqueId, kind: 'exact', confidence: 1 };
    }
  }

  for (const alias of aliases) {
    if (
      alias.normalized !== '' &&
      (alias.normalized.includes(normalized) || normalized.includes(alias.normalized))
    ) {
      return { techniqueId: alias.techniqueId, kind: 'fuzzy', confidence: 0.6 };
    }
  }

  return NO_MATCH;
}
