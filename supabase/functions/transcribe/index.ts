// Edge Function: transcribe — nagranie (Storage) -> tekst (Groq Whisper).
// Samowystarczalna (wklej jako jeden plik w Supabase → Edge Functions).
// Sekrety: GROQ_API_KEY (opcjonalny — bez niego zwraca tryb demo).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY są dostępne automatycznie.
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
    const { voice_note_id } = await req.json();
    if (!voice_note_id) return json({ error: 'voice_note_id required' }, 400);

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return json({ error: 'unauthorized' }, 401);

    const { data: note, error } = await sb
      .from('voice_notes')
      .select('*')
      .eq('id', voice_note_id)
      .single();
    if (error || !note) return json({ error: 'voice_note not found' }, 404);

    const groqKey = Deno.env.get('GROQ_API_KEY');
    let transcript: string;
    let status = 'transcribed';

    if (groqKey && note.storage_path) {
      const svc = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { data: file, error: dlErr } = await svc.storage
        .from('voice-notes')
        .download(note.storage_path);
      if (dlErr || !file) throw new Error('download failed: ' + (dlErr?.message ?? 'no file'));

      const form = new FormData();
      form.append('file', file, 'audio.m4a');
      form.append('model', 'whisper-large-v3');
      form.append('language', 'pl');
      form.append('response_format', 'json');

      const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}` },
        body: form,
      });
      if (!resp.ok) throw new Error('groq stt ' + resp.status + ': ' + (await resp.text()));
      const data = await resp.json();
      transcript = (data.text ?? '').trim();
    } else {
      transcript =
        '(Tryb demo — brak GROQ_API_KEY. Wpisz treść notatki ręcznie w polu transkrypcji, a następnie uruchom analizę.)';
      status = 'transcribed';
    }

    await sb.from('voice_notes').update({ transcript, status }).eq('id', voice_note_id);
    return json({ transcript, status });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
