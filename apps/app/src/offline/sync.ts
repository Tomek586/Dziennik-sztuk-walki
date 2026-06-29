import type { SyncState } from '@dsw/core';
import { INITIAL_SYNC_STATE } from '@dsw/core';
import type { Tables, TablesInsert, TablesUpdate } from '@dsw/api-types';
import { supabase } from '@/lib/supabase';
import { nowIso } from '@/lib/id';
import * as collection from './collection';
import { listOutbox, markError, pendingCount, removeEntries } from './outbox';
import { keys, readJson, writeJson } from './local-db';

/**
 * Silnik synchronizacji offline-first dla Etapu 0.
 * - push: wysyła kolejkę zmian (outbox) do Supabase (idempotentnie: upsert po id),
 * - pull: pobiera zmiany serwera od ostatniego `updated_at` i scala lokalnie.
 * Strategia konfliktów: Last-Write-Wins po `updated_at` (patrz docs/10-offline-sync.md).
 * W Etapie 0 synchronizujemy jedną encję — `training_sessions`.
 */
type SyncedTable = 'training_sessions';
const SYNCED_TABLES: readonly SyncedTable[] = ['training_sessions'];

export type SyncResult = { pushed: number; failed: number; pulled: number };

async function pushOutbox(): Promise<{ pushed: number; failed: number }> {
  const entries = await listOutbox();
  const done: string[] = [];
  let pushed = 0;
  let failed = 0;

  for (const entry of entries) {
    const table = entry.table as SyncedTable;
    try {
      if (entry.op === 'insert') {
        const { error } = await supabase
          .from(table)
          .upsert(entry.payload as TablesInsert<'training_sessions'>, { onConflict: 'id' });
        if (error) throw new Error(error.message);
      } else if (entry.op === 'update') {
        const { error } = await supabase
          .from(table)
          .update(entry.payload as TablesUpdate<'training_sessions'>)
          .eq('id', entry.recordId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from(table).delete().eq('id', entry.recordId);
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

async function pullChanges(): Promise<number> {
  let pulled = 0;
  for (const table of SYNCED_TABLES) {
    const since = await readJson<string | null>(keys.meta(`lastPulled:${table}`), null);
    let query = supabase.from(table).select('*');
    if (since) query = query.gt('updated_at', since);
    const { data, error } = await query.order('updated_at', { ascending: true });
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Tables<'training_sessions'>[];
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
