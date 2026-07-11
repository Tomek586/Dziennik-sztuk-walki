// Edge Function: weekly-summary — tygodniowe podsumowanie treningowe AI.
// Czyta dane użytkownika z ostatnich 7 dni (RLS), Groq pisze podsumowanie
// po polsku, wynik cache'owany per użytkownik+tydzień (weekly_summaries).
// Samowystarczalna. Sekret: GROQ_API_KEY (bez niego proste podsumowanie liczbowe).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Poniedziałek bieżącego tygodnia (UTC, YYYY-MM-DD). */
function currentWeekStart(): string {
  const d = new Date();
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

type Content = { summary: string; highlights: string[]; focus: string[] };

async function groqSummary(key: string, payload: unknown): Promise<Content | null> {
  const sys = `Jesteś trenerem sztuk walki. Dostaniesz dane treningowe użytkownika z ostatnich 7 dni (JSON).
Napisz motywujące, KONKRETNE podsumowanie tygodnia po polsku (per "ty").
Zwróć WYŁĄCZNIE poprawny JSON: {"summary":string,"highlights":[string],"focus":[string]}
Zasady: summary = 2-4 zdania o tym, co trenował i jak wygląda tydzień na tle danych;
highlights = 2-4 najważniejsze osiągnięcia/obserwacje (konkretne techniki, sparingi, frekwencja);
focus = 2-3 rekomendacje na kolejny tydzień wynikające WPROST z danych (słabe punkty, przerwy, techniki na poziomie "nie wyszła").
Nie wymyślaj danych, których nie ma. Jeśli danych mało — zachęć krótko, bez lania wody.`;
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    }),
  });
  if (!resp.ok) throw new Error('groq summary ' + resp.status + ': ' + (await resp.text()));
  const data = await resp.json();
  try {
    const c = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    if (typeof c.summary !== 'string') return null;
    return {
      summary: c.summary,
      highlights: Array.isArray(c.highlights) ? c.highlights : [],
      focus: Array.isArray(c.focus) ? c.focus : [],
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return json({ error: 'unauthorized' }, 401);
    const userId = auth.user.id;

    const weekStart = currentWeekStart();

    // cache per tydzień
    if (!force) {
      const { data: cached } = await sb
        .from('weekly_summaries')
        .select('content, model, created_at')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle();
      if (cached) return json({ content: cached.content, cached: true });
    }

    // dane z ostatnich 7 dni (RLS ogranicza do usera)
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const [sessions, sessionTechs, techniques, spars, metrics] = await Promise.all([
      sb.from('training_sessions').select('id, occurred_at, session_type, duration_min, intensity, feeling, notes').gte('occurred_at', since).is('deleted_at', null),
      sb.from('session_techniques').select('session_id, technique_id, outcome').is('deleted_at', null),
      sb.from('techniques').select('id, name_pl'),
      sb.from('sparring_rounds').select('session_id, result, taps_for, taps_against, notes, created_at').gte('created_at', since).is('deleted_at', null),
      sb.from('body_metrics').select('measured_at, weight_kg').gte('measured_at', since).is('deleted_at', null),
    ]);

    const sessionIds = new Set((sessions.data ?? []).map((s: { id: string }) => s.id));
    const techName = new Map((techniques.data ?? []).map((t: { id: string; name_pl: string }) => [t.id, t.name_pl]));
    const weekTechs = (sessionTechs.data ?? [])
      .filter((st: { session_id: string }) => sessionIds.has(st.session_id))
      .map((st: { technique_id: string; outcome: string | null }) => ({
        technika: techName.get(st.technique_id) ?? '?',
        rezultat: st.outcome,
      }));

    const payload = {
      treningi: (sessions.data ?? []).map((s: Record<string, unknown>) => ({
        data: s.occurred_at,
        typ: s.session_type,
        minuty: s.duration_min,
        intensywnosc: s.intensity,
        samopoczucie: s.feeling,
        notatki: typeof s.notes === 'string' ? (s.notes as string).slice(0, 600) : null,
      })),
      techniki: weekTechs,
      sparingi: spars.data ?? [],
      waga: metrics.data ?? [],
    };

    const groqKey = Deno.env.get('GROQ_API_KEY');
    let content: Content | null = null;
    let model = 'stats';
    if (groqKey && (sessions.data?.length ?? 0) > 0) {
      try {
        content = await groqSummary(groqKey, payload);
        if (content) model = 'groq:llama-3.3-70b-versatile';
      } catch {
        // fallback niżej
      }
    }
    if (!content) {
      const n = sessions.data?.length ?? 0;
      const mins = (sessions.data ?? []).reduce(
        (a: number, s: { duration_min: number | null }) => a + (s.duration_min ?? 0),
        0,
      );
      content = {
        summary:
          n === 0
            ? 'W tym tygodniu nie zapisałeś jeszcze żadnego treningu. Mata czeka!'
            : `W tym tygodniu: ${n} trening(ów), łącznie ${mins} minut, ${weekTechs.length} technik.`,
        highlights: [],
        focus: n === 0 ? ['Zaplanuj pierwszy trening tygodnia'] : [],
      };
    }

    // zapis cache przez service role (klient ma tylko SELECT)
    const svc = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await svc
      .from('weekly_summaries')
      .upsert(
        { user_id: userId, week_start: weekStart, content, model },
        { onConflict: 'user_id,week_start' },
      );

    return json({ content, cached: false, model });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
