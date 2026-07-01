import type { Tables } from '@dsw/api-types';
import { newId, nowIso } from '@/lib/id';
import * as collection from '@/offline/collection';
import { enqueue } from '@/offline/outbox';

export type NoteRow = Tables<'user_technique_notes'>;
export type WatchRow = Tables<'watchlist'>;
export type FeedbackRow = Tables<'material_feedback'>;

const T_NOTES = 'user_technique_notes';
const T_WATCH = 'watchlist';
const T_FB = 'material_feedback';

// ---- notatki ----

export async function listNotes(techniqueId: string): Promise<NoteRow[]> {
  const rows = await collection.getAll<NoteRow>(T_NOTES);
  return rows
    .filter((r) => r.technique_id === techniqueId && r.deleted_at == null)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function addNote(userId: string, techniqueId: string, body: string): Promise<void> {
  const id = newId();
  const ts = nowIso();
  const row: NoteRow = {
    id,
    user_id: userId,
    technique_id: techniqueId,
    body,
    created_at: ts,
    updated_at: ts,
    version: 1,
    deleted_at: null,
  };
  await collection.upsertOne(T_NOTES, row);
  await enqueue(T_NOTES, 'insert', id, {
    id,
    user_id: userId,
    technique_id: techniqueId,
    body,
  } as Record<string, unknown>);
}

export async function deleteNote(id: string): Promise<void> {
  const existing = await collection.getById<NoteRow>(T_NOTES, id);
  if (!existing) return;
  const ts = nowIso();
  await collection.upsertOne(T_NOTES, { ...existing, deleted_at: ts, updated_at: ts });
  await enqueue(T_NOTES, 'update', id, { deleted_at: ts });
}

// ---- watchlist (do nauki) ----

export async function isWatched(techniqueId: string): Promise<boolean> {
  const rows = await collection.getAll<WatchRow>(T_WATCH);
  return rows.some((r) => r.technique_id === techniqueId && r.deleted_at == null);
}

export async function listWatchlist(): Promise<WatchRow[]> {
  const rows = await collection.getAll<WatchRow>(T_WATCH);
  return rows.filter((r) => r.deleted_at == null);
}

/** Przełącza „do nauki"; zwraca nowy stan. Respektuje unikat (user, technique). */
export async function toggleWatch(userId: string, techniqueId: string): Promise<boolean> {
  const rows = await collection.getAll<WatchRow>(T_WATCH);
  const existing = rows.find((r) => r.technique_id === techniqueId);
  const ts = nowIso();
  if (existing) {
    const willWatch = existing.deleted_at != null; // był usunięty → włączamy
    const updated: WatchRow = {
      ...existing,
      deleted_at: willWatch ? null : ts,
      updated_at: ts,
    };
    await collection.upsertOne(T_WATCH, updated);
    await enqueue(T_WATCH, 'update', existing.id, { deleted_at: updated.deleted_at });
    return willWatch;
  }
  const id = newId();
  const row: WatchRow = {
    id,
    user_id: userId,
    technique_id: techniqueId,
    created_at: ts,
    updated_at: ts,
    version: 1,
    deleted_at: null,
  };
  await collection.upsertOne(T_WATCH, row);
  await enqueue(T_WATCH, 'insert', id, {
    id,
    user_id: userId,
    technique_id: techniqueId,
  } as Record<string, unknown>);
  return true;
}

// ---- feedback materiałów ----

export async function getFeedback(sourceId: string): Promise<boolean | null> {
  const rows = await collection.getAll<FeedbackRow>(T_FB);
  const f = rows.find((r) => r.source_id === sourceId && r.deleted_at == null);
  return f ? f.helpful : null;
}

export async function setFeedback(
  userId: string,
  sourceId: string,
  helpful: boolean,
): Promise<void> {
  const rows = await collection.getAll<FeedbackRow>(T_FB);
  const existing = rows.find((r) => r.source_id === sourceId);
  const ts = nowIso();
  if (existing) {
    await collection.upsertOne(T_FB, {
      ...existing,
      helpful,
      deleted_at: null,
      updated_at: ts,
    });
    await enqueue(T_FB, 'update', existing.id, { helpful, deleted_at: null });
    return;
  }
  const id = newId();
  const row: FeedbackRow = {
    id,
    user_id: userId,
    source_id: sourceId,
    helpful,
    created_at: ts,
    updated_at: ts,
    version: 1,
    deleted_at: null,
  };
  await collection.upsertOne(T_FB, row);
  await enqueue(T_FB, 'insert', id, {
    id,
    user_id: userId,
    source_id: sourceId,
    helpful,
  } as Record<string, unknown>);
}
