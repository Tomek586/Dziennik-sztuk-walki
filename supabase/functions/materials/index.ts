// Edge Function: materials — dobiera i streszcza materiały do techniki (cache współdzielony).
// Samowystarczalna. Sekrety: GROQ_API_KEY, YOUTUBE_API_KEY (oba opcjonalne — bez nich tryb demo).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Tech = { id: string; name_pl: string; name_en: string; category: string; discipline_id: string };

function isFresh(mat: any): boolean {
  return mat?.expires_at ? new Date(mat.expires_at) > new Date() : false;
}

async function groqSummary(key: string, tech: Tech) {
  const sys = `Jesteś trenerem sztuk walki. Dla podanej techniki zwróć WYŁĄCZNIE JSON:
{"summary":string,"key_points":string[],"common_errors":string[]}
summary: 2-3 zdania po polsku; key_points: 3-6 punktów; common_errors: 2-4 typowe błędy. Zwięźle, praktycznie.`;
  const user = `Technika: ${tech.name_pl} (${tech.name_en}), kategoria: ${tech.category}.`;
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!resp.ok) throw new Error('groq summary ' + resp.status + ': ' + (await resp.text()));
  const data = await resp.json();
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    return {
      summary: parsed.summary ?? '',
      key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
      common_errors: Array.isArray(parsed.common_errors) ? parsed.common_errors : [],
    };
  } catch {
    return { summary: '', key_points: [], common_errors: [] };
  }
}

function isoDur(iso: string): number | null {
  const m = /^PT(?:(\d+)M)?(?:(\d+)S)?/.exec(iso ?? '');
  if (!m) return null;
  return (Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) || null;
}

async function youtubeSearch(key: string, tech: Tech) {
  const q = `${tech.name_en} ${tech.category} technique tutorial`;
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=4` +
    `&q=${encodeURIComponent(q)}&relevanceLanguage=en&key=${key}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('youtube search ' + resp.status + ': ' + (await resp.text()));
  const data = await resp.json();
  const items = (data.items ?? []) as any[];
  const ids = items.map((i) => i.id?.videoId).filter(Boolean);
  let durations: Record<string, number | null> = {};
  if (ids.length) {
    const vresp = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids.join(',')}&key=${key}`,
    );
    if (vresp.ok) {
      const vdata = await vresp.json();
      for (const v of vdata.items ?? []) durations[v.id] = isoDur(v.contentDetails?.duration);
    }
  }
  return items.map((i) => ({
    provider: 'youtube',
    external_id: i.id.videoId,
    url: `https://www.youtube.com/watch?v=${i.id.videoId}`,
    title: i.snippet?.title ?? null,
    channel: i.snippet?.channelTitle ?? null,
    duration_s: durations[i.id.videoId] ?? null,
    thumbnail_url: i.snippet?.thumbnails?.medium?.url ?? null,
    ai_reason: null,
    is_valid: true,
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { technique_id, lang = 'pl', force_refresh = false } = await req.json();
    if (!technique_id) return json({ error: 'technique_id required' }, 400);

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

    if (!force_refresh) {
      const { data: mat } = await svc
        .from('learning_materials')
        .select('*')
        .eq('technique_id', technique_id)
        .eq('lang', lang)
        .maybeSingle();
      if (mat && isFresh(mat)) {
        const { data: sources } = await svc
          .from('material_sources')
          .select('*')
          .eq('material_id', mat.id)
          .order('rank');
        return json({ material: mat, sources: sources ?? [], from_cache: true });
      }
    }

    const { data: tech } = await sb.from('techniques').select('*').eq('id', technique_id).single();
    if (!tech) return json({ error: 'technique not found' }, 404);

    const groqKey = Deno.env.get('GROQ_API_KEY');
    const ytKey = Deno.env.get('YOUTUBE_API_KEY');

    let summary: string;
    let keyPoints: string[] = [];
    let commonErrors: string[] = [];
    if (groqKey) {
      const s = await groqSummary(groqKey, tech as Tech);
      summary = s.summary;
      keyPoints = s.key_points;
      commonErrors = s.common_errors;
    } else {
      summary = `Materiał demo dla techniki „${(tech as Tech).name_pl}" (${(tech as Tech).name_en}). Dodaj GROQ_API_KEY, aby AI wygenerowało streszczenie, punkty kluczowe i typowe błędy.`;
    }

    let sources: any[] = [];
    if (ytKey) {
      try {
        sources = await youtubeSearch(ytKey, tech as Tech);
      } catch (_e) {
        sources = [];
      }
    }

    const { data: mat, error } = await svc
      .from('learning_materials')
      .upsert(
        {
          technique_id,
          summary,
          key_points: keyPoints,
          common_errors: commonErrors,
          lang,
          model: groqKey ? 'groq:llama-3.3-70b-versatile' : 'mock',
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        },
        { onConflict: 'technique_id,lang' },
      )
      .select('*')
      .single();
    if (error) throw new Error(error.message);

    await svc.from('material_sources').delete().eq('material_id', mat.id);
    if (sources.length) {
      await svc
        .from('material_sources')
        .insert(sources.map((s, i) => ({ material_id: mat.id, ...s, rank: i })));
    }
    const { data: savedSources } = await svc
      .from('material_sources')
      .select('*')
      .eq('material_id', mat.id)
      .order('rank');

    return json({ material: mat, sources: savedSources ?? [], from_cache: false });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
