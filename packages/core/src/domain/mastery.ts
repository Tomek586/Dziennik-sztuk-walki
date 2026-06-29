/**
 * Poziomy opanowania techniki (mastery_level 0..4).
 * Zgodne z docs/06-slownik-technik.md §5.
 */
export const MASTERY_LEVELS = [0, 1, 2, 3, 4] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

export const MASTERY_LABELS_PL: Record<MasteryLevel, string> = {
  0: 'Poznana',
  1: 'Ćwiczona',
  2: 'Płynna w drillu',
  3: 'Działa pod oporem',
  4: 'Działa w sparingu',
};

/** Rezultat ćwiczenia techniki w danej sesji. */
export type TechniqueOutcome = 'learned' | 'drilled' | 'worked_in_sparring' | 'failed';

/**
 * Minimalny poziom, jaki dany rezultat „odblokowuje".
 * `failed` nie obniża ani nie podnosi — patrz nextMasteryLevel.
 */
export function outcomeToMinLevel(outcome: TechniqueOutcome): MasteryLevel {
  switch (outcome) {
    case 'learned':
      return 0;
    case 'drilled':
      return 2;
    case 'worked_in_sparring':
      return 4;
    case 'failed':
      return 0;
  }
}

/**
 * Nowy poziom po pojedynczym wystąpieniu. Poziom nigdy nie spada automatycznie
 * (technika dawno niećwiczona trafia na osobną listę „do odświeżenia").
 */
export function nextMasteryLevel(
  current: MasteryLevel,
  outcome: TechniqueOutcome,
): MasteryLevel {
  const candidate = Math.max(current, outcomeToMinLevel(outcome));
  return candidate as MasteryLevel;
}

/**
 * Poziom opanowania wyliczony ze zbioru wystąpień (funkcja czysta, idempotentna
 * względem zbioru — kluczowe dla spójności progresu przy synchronizacji).
 */
export function computeMastery(
  outcomes: readonly TechniqueOutcome[],
  initial: MasteryLevel = 0,
): MasteryLevel {
  return outcomes.reduce<MasteryLevel>(
    (level, outcome) => nextMasteryLevel(level, outcome),
    initial,
  );
}
