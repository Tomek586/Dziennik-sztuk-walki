/**
 * Typy warstwy synchronizacji offline-first (outbox + sync).
 * Implementacja magazynu jest wymienna (Etap 0: lekki magazyn cross-platform;
 * v1: WatermelonDB) — interfejsy poniżej stanowią stabilny kontrakt.
 */

export type MutationOp = 'insert' | 'update' | 'delete';

/** Pojedyncza zmiana czekająca w kolejce na wysłanie do serwera. */
export interface OutboxEntry<TPayload = Record<string, unknown>> {
  /** id wpisu w kolejce (uuid) */
  id: string;
  /** nazwa tabeli docelowej, np. "training_sessions" */
  table: string;
  op: MutationOp;
  /** id rekordu, którego dotyczy zmiana */
  recordId: string;
  /** dane do zapisania (dla insert/update) */
  payload: TPayload;
  /** klucz idempotencji — ponowienie nie tworzy duplikatu */
  idempotencyKey: string;
  /** ISO 8601 */
  createdAt: string;
  attempts: number;
  lastError?: string;
}

/** Stan synchronizacji prezentowany użytkownikowi (ekran diagnostyczny). */
export interface SyncState {
  /** znacznik ostatniego pobrania zmian serwera (ISO) */
  lastPulledAt: string | null;
  /** liczba zmian oczekujących w kolejce */
  pending: number;
  /** ostatnia udana synchronizacja (ISO) */
  lastSyncedAt: string | null;
  /** czy aktualnie trwa synchronizacja */
  syncing: boolean;
}

export const INITIAL_SYNC_STATE: SyncState = {
  lastPulledAt: null,
  pending: 0,
  lastSyncedAt: null,
  syncing: false,
};
