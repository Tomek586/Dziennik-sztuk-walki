import { computeMastery, type MasteryLevel, type TechniqueOutcome } from '@dsw/core';
import { listAllSessionTechniques } from '@/features/sessions/repository';

/**
 * Postęp wyliczany z rekordów `session_techniques` (źródło prawdy).
 * Funkcja jest deterministyczna względem zbioru wystąpień — spójna na wielu
 * urządzeniach po synchronizacji (patrz docs/06 §5 i docs/10 §6).
 */
export interface TechniqueProgress {
  techniqueId: string;
  level: MasteryLevel;
  practiceCount: number;
  lastPracticedAt: string | null;
}

export async function deriveProgress(): Promise<Map<string, TechniqueProgress>> {
  const records = await listAllSessionTechniques();

  const grouped = new Map<
    string,
    { outcomes: TechniqueOutcome[]; count: number; last: string | null }
  >();

  for (const record of records) {
    const entry = grouped.get(record.technique_id) ?? { outcomes: [], count: 0, last: null };
    if (record.outcome) entry.outcomes.push(record.outcome as TechniqueOutcome);
    entry.count += 1;
    if (entry.last == null || record.created_at > entry.last) entry.last = record.created_at;
    grouped.set(record.technique_id, entry);
  }

  const progress = new Map<string, TechniqueProgress>();
  for (const [techniqueId, entry] of grouped) {
    progress.set(techniqueId, {
      techniqueId,
      level: computeMastery(entry.outcomes),
      practiceCount: entry.count,
      lastPracticedAt: entry.last,
    });
  }
  return progress;
}

export async function getTechniqueProgress(techniqueId: string): Promise<TechniqueProgress | null> {
  return (await deriveProgress()).get(techniqueId) ?? null;
}
