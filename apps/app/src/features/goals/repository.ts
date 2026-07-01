import type { Tables, TablesInsert } from '@dsw/api-types';
import { newId, nowIso } from '@/lib/id';
import * as collection from '@/offline/collection';
import { enqueue } from '@/offline/outbox';

export type GoalRow = Tables<'goals'>;
const T = 'goals';

export type GoalKind = 'frequency' | 'technique_mastery' | 'custom';

export async function listGoals(): Promise<GoalRow[]> {
  const rows = await collection.getAll<GoalRow>(T);
  return rows
    .filter((r) => r.deleted_at == null)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function addGoal(
  userId: string,
  kind: GoalKind,
  title: string,
  target: Record<string, unknown>,
): Promise<void> {
  const id = newId();
  const ts = nowIso();
  const row: GoalRow = {
    id,
    user_id: userId,
    kind,
    target: target as GoalRow['target'],
    title,
    due_at: null,
    status: 'active',
    created_at: ts,
    updated_at: ts,
    version: 1,
    deleted_at: null,
  };
  await collection.upsertOne(T, row);
  const payload: TablesInsert<'goals'> = {
    id,
    user_id: userId,
    kind,
    title,
    target: target as TablesInsert<'goals'>['target'],
  };
  await enqueue(T, 'insert', id, payload as Record<string, unknown>);
}

export async function setGoalStatus(id: string, status: string): Promise<void> {
  const existing = await collection.getById<GoalRow>(T, id);
  if (!existing) return;
  const ts = nowIso();
  await collection.upsertOne(T, { ...existing, status, updated_at: ts });
  await enqueue(T, 'update', id, { status });
}

export async function deleteGoal(id: string): Promise<void> {
  const existing = await collection.getById<GoalRow>(T, id);
  if (!existing) return;
  const ts = nowIso();
  await collection.upsertOne(T, { ...existing, deleted_at: ts, updated_at: ts });
  await enqueue(T, 'update', id, { deleted_at: ts });
}
