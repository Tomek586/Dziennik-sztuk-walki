import type { Tables } from '@dsw/api-types';
import { supabase } from '@/lib/supabase';
import * as collection from '@/offline/collection';

/**
 * Kluby sztuk walki w Polsce (dane OpenStreetMap agregowane przez Edge
 * Function clubs-refresh). Cache lokalny + best-effort odświeżenie
 * (rate-limit 7 dni po stronie serwera).
 */
export type Club = Tables<'clubs'>;

const T = 'clubs_local';

export const CLUB_CATEGORIES = ['bjj', 'mma', 'boks', 'kick', 'zapasy', 'inne'] as const;
export const CLUB_CATEGORY_LABELS_PL: Record<string, string> = {
  bjj: 'BJJ / grappling',
  mma: 'MMA',
  boks: 'Boks',
  kick: 'Muay Thai / Kick',
  zapasy: 'Zapasy / judo',
  inne: 'Inne',
};

export async function listClubs(): Promise<Club[]> {
  const rows = await collection.getAll<Club>(T);
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

export async function refreshClubs(): Promise<Club[]> {
  try {
    await supabase.functions.invoke('clubs-refresh', { body: {} });
  } catch {
    // funkcja niewdrożona / offline — czytamy stan tabeli
  }
  // klubów jest kilkaset — dociągamy wszystkie stronami po 1000
  const all: Club[] = [];
  for (let from = 0; from < 5000; from += 1000) {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    all.push(...((data ?? []) as Club[]));
    if (!data || data.length < 1000) break;
  }
  if (all.length > 0) await collection.upsertMany<Club>(T, all);
  return listClubs();
}
