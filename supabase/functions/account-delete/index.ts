// Edge Function: account-delete — usuwa konto użytkownika i wszystkie dane (RODO).
// Samowystarczalna. Kaskady FK (profiles -> dane) usuwają rekordy powiązane.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return json({ error: 'unauthorized' }, 401);

    const svc = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // best-effort: usuń nagrania ze Storage (folder = user id)
    try {
      const { data: files } = await svc.storage.from('voice-notes').list(auth.user.id);
      if (files && files.length) {
        await svc.storage
          .from('voice-notes')
          .remove(files.map((f) => `${auth.user.id}/${f.name}`));
      }
    } catch (_e) {
      // ignore
    }

    // usunięcie użytkownika auth kaskadowo usuwa profil i wszystkie dane
    const { error } = await svc.auth.admin.deleteUser(auth.user.id);
    if (error) return json({ error: error.message }, 500);

    return json({ status: 'deleted' });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
