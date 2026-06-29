import { keys, readJson, writeJson } from './local-db';

/** Minimalny kontrakt rekordu przechowywanego lokalnie. */
export type Row = { id: string };

/** Wszystkie rekordy danej tabeli (kolekcji). */
export async function getAll<T extends Row>(table: string): Promise<T[]> {
  const map = await readJson<Record<string, T>>(keys.collection(table), {});
  return Object.values(map);
}

export async function getById<T extends Row>(table: string, id: string): Promise<T | undefined> {
  const map = await readJson<Record<string, T>>(keys.collection(table), {});
  return map[id];
}

export async function upsertMany<T extends Row>(table: string, rows: T[]): Promise<void> {
  if (rows.length === 0) return;
  const map = await readJson<Record<string, T>>(keys.collection(table), {});
  for (const row of rows) {
    map[row.id] = row;
  }
  await writeJson(keys.collection(table), map);
}

export async function upsertOne<T extends Row>(table: string, row: T): Promise<void> {
  await upsertMany(table, [row]);
}

export async function removeOne(table: string, id: string): Promise<void> {
  const map = await readJson<Record<string, Row>>(keys.collection(table), {});
  if (id in map) {
    delete map[id];
    await writeJson(keys.collection(table), map);
  }
}
