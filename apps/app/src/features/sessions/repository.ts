import type { Tables, TablesInsert } from '@dsw/api-types';
import type { TrainingSessionInput } from '@dsw/core';
import { newId, nowIso } from '@/lib/id';
import * as collection from '@/offline/collection';
import { enqueue } from '@/offline/outbox';

/**
 * Repozytorium treningów — offline-first.
 * Zapis: najpierw lokalnie (optymistycznie) + wpis do outboxu; wysyłka przez sync.
 * Odczyt: zawsze z lokalnego magazynu (natychmiastowy, bez sieci).
 */
const TABLE = 'training_sessions';
export type SessionRow = Tables<'training_sessions'>;

export async function listSessions(): Promise<SessionRow[]> {
  const rows = await collection.getAll<SessionRow>(TABLE);
  return rows
    .filter((row) => row.deleted_at == null)
    .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
}

export async function createSession(
  userId: string,
  input: TrainingSessionInput,
): Promise<SessionRow> {
  const id = newId();
  const ts = nowIso();
  const row: SessionRow = {
    id,
    user_id: userId,
    discipline_id: input.disciplineId,
    occurred_at: input.occurredAt,
    duration_min: input.durationMin ?? null,
    session_type: input.sessionType ?? null,
    location: input.location ?? null,
    intensity: input.intensity ?? null,
    feeling: input.feeling ?? null,
    notes: input.notes ?? null,
    went_well: input.wentWell ?? null,
    went_bad: input.wentBad ?? null,
    created_at: ts,
    updated_at: ts,
    version: 1,
    deleted_at: null,
  };
  await collection.upsertOne(TABLE, row);

  const payload: TablesInsert<'training_sessions'> = {
    id: row.id,
    user_id: row.user_id,
    discipline_id: row.discipline_id,
    occurred_at: row.occurred_at,
    duration_min: row.duration_min,
    session_type: row.session_type,
    location: row.location,
    intensity: row.intensity,
    feeling: row.feeling,
    notes: row.notes,
    went_well: row.went_well,
    went_bad: row.went_bad,
  };
  await enqueue(TABLE, 'insert', id, payload as Record<string, unknown>);
  return row;
}

/** Miękkie usunięcie (zgodne ze strategią sync — patrz docs/10). */
export async function softDeleteSession(id: string): Promise<void> {
  const existing = await collection.getById<SessionRow>(TABLE, id);
  if (!existing) return;
  const ts = nowIso();
  const updated: SessionRow = { ...existing, deleted_at: ts, updated_at: ts };
  await collection.upsertOne(TABLE, updated);
  await enqueue(TABLE, 'update', id, { deleted_at: ts });
}
