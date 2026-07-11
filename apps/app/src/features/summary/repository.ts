import { supabase } from '@/lib/supabase';
import * as collection from '@/offline/collection';

/**
 * Tygodniowe podsumowanie AI — generuje Edge Function weekly-summary
 * (cache per użytkownik+tydzień po stronie serwera). Lokalna kopia do
 * pokazania offline.
 */
export interface WeeklySummary {
  summary: string;
  highlights: string[];
  focus: string[];
}

const T = 'weekly_summary_local';
const KEY = 'current';

export async function getCachedWeeklySummary(): Promise<WeeklySummary | null> {
  const row = await collection.getById<{ id: string; content: WeeklySummary }>(T, KEY);
  return row?.content ?? null;
}

export async function generateWeeklySummary(force = false): Promise<WeeklySummary> {
  const { data, error } = await supabase.functions.invoke('weekly-summary', { body: { force } });
  if (error) throw new Error(error.message);
  const payload = data as { content?: WeeklySummary; error?: string };
  if (payload?.error || !payload?.content) throw new Error(payload?.error ?? 'brak podsumowania');
  await collection.upsertOne(T, { id: KEY, content: payload.content });
  return payload.content;
}
