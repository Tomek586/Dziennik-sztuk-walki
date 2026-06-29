import type { Tables } from '@dsw/api-types';
import { supabase } from '@/lib/supabase';
import * as collection from '@/offline/collection';

export type Discipline = Tables<'disciplines'>;
const TABLE = 'disciplines';

/** Pobiera globalny słownik dyscyplin z serwera i zapisuje do lokalnego cache. */
export async function syncDisciplines(): Promise<void> {
  const { data, error } = await supabase.from('disciplines').select('*');
  if (error) throw new Error(error.message);
  if (data) await collection.upsertMany<Discipline>(TABLE, data);
}

/** Lista dyscyplin z lokalnego cache (działa offline). */
export async function listDisciplines(): Promise<Discipline[]> {
  const rows = await collection.getAll<Discipline>(TABLE);
  return rows.sort((a, b) => a.name_pl.localeCompare(b.name_pl, 'pl'));
}
