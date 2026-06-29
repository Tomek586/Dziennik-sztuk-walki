import { z } from 'zod';

/** Kody dyscyplin wspierane na starcie (zgodne z seedem bazy). */
export const DISCIPLINE_CODES = ['BJJ', 'MMA', 'BOX', 'MT', 'KB'] as const;
export type DisciplineCode = (typeof DISCIPLINE_CODES)[number];

export const disciplineCodeSchema = z.enum(DISCIPLINE_CODES);

/** Etykiety PL do prezentacji bez zapytania do bazy. */
export const DISCIPLINE_LABELS_PL: Record<DisciplineCode, string> = {
  BJJ: 'BJJ / Grappling',
  MMA: 'MMA',
  BOX: 'Boks',
  MT: 'Muay thai',
  KB: 'Kickboxing',
};

/** Czy dyscyplina jest grapplingowa (wpływa m.in. na statystyki sparingów). */
export const GRAPPLING_DISCIPLINES: ReadonlySet<DisciplineCode> = new Set<DisciplineCode>([
  'BJJ',
  'MMA',
]);

export function isGrappling(code: DisciplineCode): boolean {
  return GRAPPLING_DISCIPLINES.has(code);
}
