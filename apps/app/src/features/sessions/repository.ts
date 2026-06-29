import type { Tables, TablesInsert } from '@dsw/api-types';
import type { TechniqueOutcome, TrainingSessionInput } from '@dsw/core';
import { newId, nowIso } from '@/lib/id';
import * as collection from '@/offline/collection';
import { enqueue } from '@/offline/outbox';

/**
 * Repozytorium treningów — offline-first.
 * Zapis: najpierw lokalnie (optymistycznie) + wpis do outboxu; wysyłka przez sync.
 * Odczyt: zawsze z lokalnego magazynu (natychmiastowy, bez sieci).
 */
const TABLE = 'training_sessions';
const T_ST = 'session_techniques';

export type SessionRow = Tables<'training_sessions'>;
export type SessionTechniqueRow = Tables<'session_techniques'>;

/** Technika wybrana do dodania na treningu. */
export interface SessionTechniqueDraft {
  techniqueId: string;
  outcome: TechniqueOutcome | null;
}

export async function listSessions(): Promise<SessionRow[]> {
  const rows = await collection.getAll<SessionRow>(TABLE);
  return rows
    .filter((row) => row.deleted_at == null)
    .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
}

export async function listSessionTechniques(sessionId: string): Promise<SessionTechniqueRow[]> {
  const rows = await collection.getAll<SessionTechniqueRow>(T_ST);
  return rows.filter((r) => r.session_id === sessionId && r.deleted_at == null);
}

export async function listAllSessionTechniques(): Promise<SessionTechniqueRow[]> {
  const rows = await collection.getAll<SessionTechniqueRow>(T_ST);
  return rows.filter((r) => r.deleted_at == null);
}

export async function createSession(
  userId: string,
  input: TrainingSessionInput,
  techniques: readonly SessionTechniqueDraft[] = [],
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

  for (const draft of techniques) {
    await addSessionTechnique(userId, id, draft, ts);
  }

  return row;
}

async function addSessionTechnique(
  userId: string,
  sessionId: string,
  draft: SessionTechniqueDraft,
  ts: string,
): Promise<void> {
  const id = newId();
  const row: SessionTechniqueRow = {
    id,
    session_id: sessionId,
    technique_id: draft.techniqueId,
    user_id: userId,
    outcome: draft.outcome,
    reps: null,
    went_well: null,
    went_bad: null,
    confidence: null,
    source: 'manual',
    created_at: ts,
    updated_at: ts,
    version: 1,
    deleted_at: null,
  };
  await collection.upsertOne(T_ST, row);

  const payload: TablesInsert<'session_techniques'> = {
    id,
    session_id: sessionId,
    technique_id: draft.techniqueId,
    user_id: userId,
    outcome: draft.outcome,
    source: 'manual',
  };
  await enqueue(T_ST, 'insert', id, payload as Record<string, unknown>);
}

/** Miękkie usunięcie sesji (techniki znikną kaskadowo po stronie serwera). */
export async function softDeleteSession(id: string): Promise<void> {
  const existing = await collection.getById<SessionRow>(TABLE, id);
  if (!existing) return;
  const ts = nowIso();
  const updated: SessionRow = { ...existing, deleted_at: ts, updated_at: ts };
  await collection.upsertOne(TABLE, updated);
  await enqueue(TABLE, 'update', id, { deleted_at: ts });

  // miękko usuń też technika sesji lokalnie + w kolejce
  const sts = await listSessionTechniques(id);
  for (const st of sts) {
    const stUpdated: SessionTechniqueRow = { ...st, deleted_at: ts, updated_at: ts };
    await collection.upsertOne(T_ST, stUpdated);
    await enqueue(T_ST, 'update', st.id, { deleted_at: ts });
  }
}
