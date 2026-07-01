import type { Tables, TablesUpdate } from '@dsw/api-types';
import { supabase } from '@/lib/supabase';

export type Profile = Tables<'profiles'>;

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data ?? null;
}

export async function updateProfile(
  userId: string,
  patch: TablesUpdate<'profiles'>,
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(error.message);
}

/** Usuwa konto i wszystkie dane (RODO) — przez Edge Function account-delete. */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('account-delete', { body: {} });
  if (error) throw new Error(error.message);
}
