import type { Tables } from '@dsw/api-types';
import { supabase } from '@/lib/supabase';
import * as collection from '@/offline/collection';

/**
 * Newsy ze świata sztuk walki — treść wspólna (agreguje Edge Function
 * news-refresh). Klient: cache lokalny do czytania offline + best-effort
 * odświeżenie (rate-limit po stronie serwera).
 */
export type NewsItem = Tables<'news_items'>;

const T = 'news_items_local';
export const NEWS_CATEGORIES = ['mma', 'bjj', 'boks', 'inne'] as const;
export const NEWS_CATEGORY_LABELS_PL: Record<string, string> = {
  mma: 'MMA',
  bjj: 'BJJ / grappling',
  boks: 'Boks i striking',
  inne: 'Inne',
};

function sortKey(n: NewsItem): string {
  return n.published_at ?? n.fetched_at;
}

export async function listNews(): Promise<NewsItem[]> {
  const rows = await collection.getAll<NewsItem>(T);
  return rows.sort((a, b) => (sortKey(a) < sortKey(b) ? 1 : -1));
}

/** Poproś serwer o odświeżenie źródeł i pobierz aktualną listę. */
export async function refreshNews(): Promise<NewsItem[]> {
  try {
    await supabase.functions.invoke('news-refresh', { body: {} });
  } catch {
    // funkcja niewdrożona / offline — czytamy to, co już jest w tabeli
  }
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(120);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as NewsItem[];
  if (rows.length > 0) await collection.upsertMany<NewsItem>(T, rows);
  return listNews();
}
