import { z } from 'zod';

/**
 * Walidacja danych wejściowych sesji treningowej (formularz / ekstrakcja AI).
 * Pola opcjonalne mogą być null (brak danych) — spójnie z kolumnami w bazie.
 */
export const trainingSessionInputSchema = z.object({
  disciplineId: z.string().uuid(),
  occurredAt: z.string().datetime({ offset: true }),
  durationMin: z.number().int().positive().max(600).nullable().optional(),
  sessionType: z.string().min(1).max(60).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  intensity: z.number().int().min(1).max(10).nullable().optional(),
  feeling: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(10_000).nullable().optional(),
  wentWell: z.string().max(4_000).nullable().optional(),
  wentBad: z.string().max(4_000).nullable().optional(),
});

export type TrainingSessionInput = z.infer<typeof trainingSessionInputSchema>;
