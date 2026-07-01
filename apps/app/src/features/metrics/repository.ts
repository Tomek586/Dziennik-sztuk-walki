import type { Tables, TablesInsert } from '@dsw/api-types';
import { newId, nowIso } from '@/lib/id';
import * as collection from '@/offline/collection';
import { enqueue } from '@/offline/outbox';

export type BodyMetricRow = Tables<'body_metrics'>;
export type GradeRow = Tables<'grades'>;

const T_BODY = 'body_metrics';
const T_GRADE = 'grades';

// ---- waga / forma ----

export async function listBodyMetrics(): Promise<BodyMetricRow[]> {
  const rows = await collection.getAll<BodyMetricRow>(T_BODY);
  return rows
    .filter((r) => r.deleted_at == null)
    .sort((a, b) => (a.measured_at < b.measured_at ? 1 : -1));
}

export async function addBodyMetric(
  userId: string,
  weightKg: number | null,
  note: string | null,
): Promise<void> {
  const id = newId();
  const ts = nowIso();
  const row: BodyMetricRow = {
    id,
    user_id: userId,
    measured_at: ts,
    weight_kg: weightKg,
    resting_hr: null,
    sleep_h: null,
    fatigue: null,
    note,
    created_at: ts,
    updated_at: ts,
    version: 1,
    deleted_at: null,
  };
  await collection.upsertOne(T_BODY, row);
  const payload: TablesInsert<'body_metrics'> = {
    id,
    user_id: userId,
    measured_at: ts,
    weight_kg: weightKg,
    note,
  };
  await enqueue(T_BODY, 'insert', id, payload as Record<string, unknown>);
}

export async function deleteBodyMetric(id: string): Promise<void> {
  const existing = await collection.getById<BodyMetricRow>(T_BODY, id);
  if (!existing) return;
  const ts = nowIso();
  await collection.upsertOne(T_BODY, { ...existing, deleted_at: ts, updated_at: ts });
  await enqueue(T_BODY, 'update', id, { deleted_at: ts });
}

// ---- stopnie / pasy ----

export async function listGrades(): Promise<GradeRow[]> {
  const rows = await collection.getAll<GradeRow>(T_GRADE);
  return rows
    .filter((r) => r.deleted_at == null)
    .sort((a, b) => ((a.awarded_at ?? '') < (b.awarded_at ?? '') ? 1 : -1));
}

export async function addGrade(
  userId: string,
  disciplineId: string,
  label: string,
  awardedAt: string | null,
): Promise<void> {
  const id = newId();
  const ts = nowIso();
  const row: GradeRow = {
    id,
    user_id: userId,
    discipline_id: disciplineId,
    grade_label: label,
    awarded_at: awardedAt,
    awarded_by: null,
    note: null,
    created_at: ts,
    updated_at: ts,
    version: 1,
    deleted_at: null,
  };
  await collection.upsertOne(T_GRADE, row);
  const payload: TablesInsert<'grades'> = {
    id,
    user_id: userId,
    discipline_id: disciplineId,
    grade_label: label,
    awarded_at: awardedAt,
  };
  await enqueue(T_GRADE, 'insert', id, payload as Record<string, unknown>);
}

export async function deleteGrade(id: string): Promise<void> {
  const existing = await collection.getById<GradeRow>(T_GRADE, id);
  if (!existing) return;
  const ts = nowIso();
  await collection.upsertOne(T_GRADE, { ...existing, deleted_at: ts, updated_at: ts });
  await enqueue(T_GRADE, 'update', id, { deleted_at: ts });
}
