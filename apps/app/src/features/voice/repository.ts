import { newId, nowIso } from '@/lib/id';
import * as collection from '@/offline/collection';

/**
 * Notatki głosowe — Etap 1 (bez AI): przechowywane wyłącznie lokalnie.
 * W kroku AI dołączymy upload do Storage, transkrypcję i ekstrakcję, a wpis
 * zacznie być synchronizowany (tabela voice_notes po stronie serwera).
 */
const TABLE = 'voice_notes_local';

export interface LocalVoiceNote {
  id: string;
  uri: string;
  durationMs: number;
  createdAt: string;
}

export async function listVoiceNotes(): Promise<LocalVoiceNote[]> {
  const rows = await collection.getAll<LocalVoiceNote>(TABLE);
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addVoiceNote(uri: string, durationMs: number): Promise<LocalVoiceNote> {
  const note: LocalVoiceNote = { id: newId(), uri, durationMs, createdAt: nowIso() };
  await collection.upsertOne(TABLE, note);
  return note;
}

export async function deleteVoiceNote(id: string): Promise<void> {
  await collection.removeOne(TABLE, id);
}
