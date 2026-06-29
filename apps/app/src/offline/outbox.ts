import type { MutationOp, OutboxEntry } from '@dsw/core';
import { newId, nowIso } from '@/lib/id';
import { keys, readJson, writeJson } from './local-db';

/** Kolejka zmian oczekujących na wysłanie do serwera (offline-first). */

export async function listOutbox(): Promise<OutboxEntry[]> {
  return readJson<OutboxEntry[]>(keys.outbox(), []);
}

export async function enqueue(
  table: string,
  op: MutationOp,
  recordId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const entry: OutboxEntry = {
    id: newId(),
    table,
    op,
    recordId,
    payload,
    idempotencyKey: newId(),
    createdAt: nowIso(),
    attempts: 0,
  };
  const all = await listOutbox();
  all.push(entry);
  await writeJson(keys.outbox(), all);
}

export async function removeEntries(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const remove = new Set(ids);
  const all = await listOutbox();
  await writeJson(
    keys.outbox(),
    all.filter((entry) => !remove.has(entry.id)),
  );
}

export async function markError(id: string, error: string): Promise<void> {
  const all = await listOutbox();
  const next = all.map((entry) =>
    entry.id === id ? { ...entry, attempts: entry.attempts + 1, lastError: error } : entry,
  );
  await writeJson(keys.outbox(), next);
}

export async function pendingCount(): Promise<number> {
  return (await listOutbox()).length;
}
