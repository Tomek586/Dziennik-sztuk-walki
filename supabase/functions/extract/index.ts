// Edge Function: extract — transkrypcja/tekst -> ustrukturyzowane dane + mapowanie technik.
// Samowystarczalna. Sekret: GROQ_API_KEY (bez niego dopasowanie po słowach kluczowych).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// normalizacja spójna z packages/core i funkcją SQL dsw_normalize
const ACCENTS: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ż: 'z', ź: 'z',
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a', é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u', ç: 'c', ñ: 'n',
};
function normalize(input: string): string {
  return (input ?? '')
    .toLowerCase()
    .replace(/[À-ɏ]/g, (c) => ACCENTS[c] ?? c)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

type Alias = { technique_id: string; normalized: string };
type Tech = { id: string; name_pl: string; name_en: string; category: string };

function mapTechniques(items: any[], aliases: Alias[], techById: Map<string, Tech>) {
  return items.map((it) => {
    const src: string = it.raw_text ?? it.guessed_name_pl ?? it.guessed_name_en ?? '';
    const n = normalize(src);
    let techId: string | null = null;
    let confidence: number = typeof it.confidence === 'number' ? it.confidence : 0;
    if (n) {
      const exact = aliases.find((a) => a.normalized === n);
      if (exact) {
        techId = exact.technique_id;
        confidence = Math.max(confidence, 0.9);
      } else {
        const fuzzy = aliases.find(
          (a) => a.normalized && (a.normalized.includes(n) || n.includes(a.normalized)),
        );
        if (fuzzy) {
          techId = fuzzy.technique_id;
          confidence = Math.max(confidence, 0.5);
        }
      }
    }
    const t = techId ? techById.get(techId) : null;
    return {
      technique_id: techId,
      name_pl: t?.name_pl ?? src,
      name_en: t?.name_en ?? null,
      raw_text: src,
      category: it.category ?? null,
      outcome: it.outcome ?? null,
      went_well: it.went_well ?? null,
      went_bad: it.went_bad ?? null,
      confidence,
      needs_review: !techId || confidence < 0.7,
    };
  });
}

function scanTranscript(transcript: string, aliases: Alias[]) {
  const n = normalize(transcript);
  const found = new Map<string, { raw_text: string }>();
  for (const a of aliases) {
    if (a.normalized && a.normalized.length >= 3 && n.includes(a.normalized)) {
      if (!found.has(a.technique_id)) found.set(a.technique_id, { raw_text: a.normalized });
    }
  }
  return [...found.values()];
}

async function groqExtract(key: string, transcript: string) {
  const sys = `Jesteś asystentem, który z notatki po treningu sztuk walki wyciąga KOMPLETNE, ustrukturyzowane dane.
NAJWAŻNIEJSZA ZASADA: niczego nie pomijaj — każda informacja z notatki musi trafić do któregoś pola. Użytkownik opowiada o całym treningu i wszystko ma zostać zapisane.
Zwróć WYŁĄCZNIE poprawny JSON o kształcie:
{"session":{"session_type":string|null,"discipline_guess":"bjj"|"grappling"|"mma"|"boks"|"muay thai"|"kickboxing"|null,"duration_min":number|null,"intensity":number|null,"feeling":number|null,"summary":string,
 "sections":[{"title":string,"content":string}]},
"techniques":[{"raw_text":string,"category":"duszenie"|"dźwignia"|"obalenie"|"przejście"|"pozycja"|"uderzenie"|"kopnięcie"|"obrona"|"inne"|null,"outcome":"learned"|"drilled"|"worked_in_sparring"|"failed"|null,"went_well":string|null,"went_bad":string|null,"confidence":number}],
"sparring":[{"rounds":number|null,"round_no":number|null,"partner":string|null,"result":"win"|"loss"|"draw"|null,"taps_for":number|null,"taps_against":number|null,"what_worked":string|null,"what_failed":string|null,"notes":string|null}],
"insights":[string],
"goal_suggestions":[string]}
Zasady:
- sections: rozbij CAŁĄ treść notatki na sekcje tematyczne (np. "Rozgrzewka", "Technika", "Sparingi", "Kondycja", "Samopoczucie", "Uwagi"). Zachowaj WSZYSTKIE szczegóły i konkrety — parafrazuj porządkując, ale NIE skracaj. Twórz tylko sekcje, o których faktycznie coś powiedziano. summary = 1-2 zdania esencji.
- techniques: wypisz KAŻDĄ wspomnianą technikę/kombinację, także slangowe i nietypowe nazwy, których nie znasz. raw_text = nazwa dokładnie jak w notatce. went_well/went_bad = co konkretnie działało / nie działało przy tej technice.
- sparring: jeśli rundy opisano osobno — osobny obiekt na każdą rundę (ustaw round_no i partner, jeśli podano). Jeśli zbiorczo — jeden obiekt z łączną liczbą rund w polu rounds. what_worked/what_failed = co wchodziło, co nie działało.
- insights: wnioski i obserwacje użytkownika o własnym rozwoju (np. "muszę popracować nad obroną gilotyny", "lepiej oddycham w 3. rundzie").
- goal_suggestions: 0-3 krótkie, konkretne propozycje celów treningowych wynikające WPROST z notatki.
- nie zgaduj liczb, których nie ma w tekście; intensity 1-10, feeling 1-5; jeśli czegoś brak, użyj null.
- wszystkie pola tekstowe po polsku.`;
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: transcript },
      ],
    }),
  });
  if (!resp.ok) throw new Error('groq extract ' + resp.status + ': ' + (await resp.text()));
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(content);
  } catch {
    return {
      session: {
        summary: transcript.slice(0, 240),
        sections: [{ title: 'Notatka', content: transcript }],
      },
      techniques: [],
      sparring: [],
      insights: [],
      goal_suggestions: [],
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return json({ error: 'unauthorized' }, 401);

    let transcript: string | undefined = body.text;
    const voiceNoteId: string | undefined = body.voice_note_id;
    if (!transcript && voiceNoteId) {
      const { data: note } = await sb
        .from('voice_notes')
        .select('transcript')
        .eq('id', voiceNoteId)
        .single();
      transcript = note?.transcript ?? '';
    }
    if (!transcript || transcript.trim() === '') return json({ error: 'brak treści do analizy' }, 400);

    const { data: aliasRows } = await sb.from('technique_aliases').select('technique_id, normalized');
    const { data: techRows } = await sb.from('techniques').select('id, name_pl, name_en, category');
    const aliases = (aliasRows ?? []) as Alias[];
    const techById = new Map<string, Tech>((techRows ?? []).map((t: any) => [t.id, t]));

    const groqKey = Deno.env.get('GROQ_API_KEY');
    let structured: any;
    if (groqKey) {
      structured = await groqExtract(groqKey, transcript);
    } else {
      structured = {
        session: {
          summary: transcript.slice(0, 240),
          sections: [{ title: 'Notatka', content: transcript }],
        },
        techniques: scanTranscript(transcript, aliases),
        sparring: [],
        insights: [],
        goal_suggestions: [],
      };
    }

    const mapped = mapTechniques(structured.techniques ?? [], aliases, techById);
    const raw = {
      session: structured.session ?? {},
      techniques: mapped,
      sparring: structured.sparring ?? [],
      insights: structured.insights ?? [],
      goal_suggestions: structured.goal_suggestions ?? [],
    };

    const svc = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: ext, error: insErr } = await svc
      .from('ai_extractions')
      .insert({
        voice_note_id: voiceNoteId ?? null,
        user_id: auth.user.id,
        raw,
        model: groqKey ? 'groq:llama-3.3-70b-versatile' : 'mock:keyword',
        status: 'needs_review',
      })
      .select('id')
      .single();
    if (insErr) throw new Error(insErr.message);

    if (voiceNoteId) await sb.from('voice_notes').update({ status: 'extracted' }).eq('id', voiceNoteId);

    return json({ extraction_id: ext.id, raw });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
