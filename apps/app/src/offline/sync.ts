import type { SyncState } from '@dsw/core';
import { INITIAL_SYNC_STATE } from '@dsw/core';
import { supabase } from '@/lib/supabase';
import { nowIso } from '@/lib/id';
import * as collection from './collection';
import { listOutbox, markError, pendingCount, removeEntries } from './outbox';
import { keys, readJson, writeJson } from './local-db';

/**
 * Silnik synchronizacji offline-first.
 * - push: wysyła kolejkę zmian (outbox) do Supabase (idempotentnie: upsert po id),
 * - pull: pobiera zmiany serwera od ostatniego `updated_at` i scala lokalnie.
 * Strategia konfliktów: Last-Write-Wins po `updated_at` (docs/10-offline-sync.md).
 */
const SYNCED_TABLES = [
  'training_sessions',
  'session_techniques',
  'sparring_rounds',
  'body_metrics',
  'grades',
  'voice_notes',
  'ai_extractions',
  'goals',
  'user_technique_notes',
  'watchlist',
  'material_feedback',
] as const;

// supabase-js słabo wspiera dynamiczne nazwy tabel — w silniku sync świadomie
// rezygnujemy z typowania zapytań (kontrakty pilnują typowane repozytoria).
const db = supabase as unknown as {
  from: (table: string) => {
    upsert: (v: unknown, o?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>;
    update: (v: unknown) => { eq: (c: string, val: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (c: string, val: string) => Promise<{ error: { message: string } | null }> };
    select: (s: string) => {
      gt: (c: string, val: string) => unknown;
      order: (c: string, o: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
    };
  };
};

export type SyncResult = { pushed: number; failed: number; pulled: number };

async function pushOutbox(): Promise<{ pushed: number; failed: number }> {
  const entries = await listOutbox();
  const done: string[] = [];
  let pushed = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      if (entry.op === 'insert') {
        const { error } = await db.from(entry.table).upsert(entry.payload, { onConflict: 'id' });
        if (error) throw new Error(error.message);
      } else if (entry.op === 'update') {
        const { error } = await db.from(entry.table).update(entry.payload).eq('id', entry.recordId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await db.from(entry.table).delete().eq('id', entry.recordId);
        if (error) throw new Error(error.message);
      }
      done.push(entry.id);
      pushed += 1;
    } catch (err) {
      failed += 1;
      await markError(entry.id, err instanceof Error ? err.message : String(err));
    }
  }

  await removeEntries(done);
  return { pushed, failed };
}

type SyncedRow = { id: string; updated_at: string };

async function pullChanges(): Promise<number> {
  let pulled = 0;
  for (const table of SYNCED_TABLES) {
    const since = await readJson<string | null>(keys.meta(`lastPulled:${table}`), null);
    const base = db.from(table).select('*');
    const filtered = since ? (base.gt('updated_at', since) as typeof base) : base;
    const { data, error } = await filtered.order('updated_at', { ascending: true });
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as SyncedRow[];
    if (rows.length > 0) {
      await collection.upsertMany(table, rows);
      const last = rows[rows.length - 1];
      if (last) await writeJson(keys.meta(`lastPulled:${table}`), last.updated_at);
      pulled += rows.length;
    }
  }
  return pulled;
}

export async function synchronize(): Promise<SyncResult> {
  const push = await pushOutbox();
  const pulled = await pullChanges();
  await writeJson(keys.meta('lastSyncedAt'), nowIso());
  return { ...push, pulled };
}

export async function getSyncState(): Promise<SyncState> {
  const pending = await pendingCount();
  const lastSyncedAt = await readJson<string | null>(keys.meta('lastSyncedAt'), null);
  const lastPulledAt = await readJson<string | null>(
    keys.meta('lastPulled:training_sessions'),
    null,
  );
  return { ...INITIAL_SYNC_STATE, pending, lastSyncedAt, lastPulledAt };
}
