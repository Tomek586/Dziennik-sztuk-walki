// Edge Function: news-refresh — agregacja newsów ze świata sztuk walki.
// RSS/Atom (polskie + światowe portale) -> Groq streszcza po polsku -> news_items.
// Samowystarczalna. Sekret: GROQ_API_KEY (bez niego wpisy bez tłumaczenia/streszczeń AI).
// Rate-limit: odświeża najwyżej raz na 30 minut (news_meta.last_refresh).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Feed = { url: string; source: string; lang: 'pl' | 'en'; category: 'mma' | 'bjj' | 'boks' | 'inne' };

// kategoria to punkt wyjścia — AI może ją doprecyzować per artykuł
const FEEDS: Feed[] = [
  { url: 'https://inthecage.pl/feed/', source: 'InTheCage', lang: 'pl', category: 'mma' },
  { url: 'https://mmarocks.pl/feed/', source: 'MMA Rocks', lang: 'pl', category: 'mma' },
  { url: 'https://lowking.pl/feed/', source: 'Lowking', lang: 'pl', category: 'mma' },
  { url: 'https://www.mmafighting.com/rss/index.xml', source: 'MMA Fighting', lang: 'en', category: 'mma' },
  { url: 'https://www.bjjee.com/feed/', source: 'BJJ Eastern Europe', lang: 'en', category: 'bjj' },
  { url: 'https://www.badlefthook.com/rss/index.xml', source: 'Bad Left Hook', lang: 'en', category: 'boks' },
];

const MAX_PER_FEED = 8;
const REFRESH_MINUTES = 30;
const KEEP_DAYS = 21;

type Item = {
  url: string;
  title: string;
  snippet: string;
  image_url: string | null;
  published_at: string | null;
  source: string;
  lang: string;
  category: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .trim();
}
function stripTags(s: string): string {
  return decodeEntities(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function pick(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1] : null;
}

/** Parsuje RSS 2.0 (<item>) oraz Atom (<entry>) bez zależności. */
function parseFeed(xml: string, feed: Feed): Item[] {
  const out: Item[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  for (const b of blocks.slice(0, MAX_PER_FEED)) {
    const title = stripTags(pick(b, 'title') ?? '');
    // RSS: <link>url</link>; Atom: <link href="url"/>
    let url = decodeEntities(pick(b, 'link') ?? '');
    if (!url) url = decodeEntities(b.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? '');
    const desc = stripTags(pick(b, 'description') ?? pick(b, 'summary') ?? pick(b, 'content') ?? '');
    const dateRaw =
      pick(b, 'pubDate') ?? pick(b, 'published') ?? pick(b, 'updated') ?? pick(b, 'dc:date');
    let published: string | null = null;
    if (dateRaw) {
      const d = new Date(decodeEntities(dateRaw));
      if (!Number.isNaN(d.getTime())) published = d.toISOString();
    }
    const img =
      b.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i)?.[1] ??
      b.match(/<enclosure[^>]*url="([^"]+\.(?:jpe?g|png|webp)[^"]*)"/i)?.[1] ??
      b.match(/<img[^>]*src="([^"]+)"/i)?.[1] ??
      null;
    if (!title || !url) continue;
    out.push({
      url,
      title,
      snippet: desc.slice(0, 400),
      image_url: img ? decodeEntities(img) : null,
      published_at: published,
      source: feed.source,
      lang: feed.lang,
      category: feed.category,
    });
  }
  return out;
}

/** Groq: tytuł+streszczenie po polsku i doprecyzowana kategoria (batch). */
async function groqSummarize(key: string, items: Item[]) {
  const input = items.map((x, i) => ({
    i,
    lang: x.lang,
    category: x.category,
    title: x.title,
    snippet: x.snippet,
  }));
  const sys = `Dostaniesz listę newsów ze świata sztuk walki (JSON). Dla każdego zwróć polski tytuł i streszczenie.
Zwróć WYŁĄCZNIE poprawny JSON: {"items":[{"i":number,"title_pl":string,"summary_pl":string,"category":"mma"|"bjj"|"boks"|"inne"}]}
Zasady: title_pl = naturalny polski tytuł (tłumacz angielskie, polskie popraw stylistycznie tylko gdy trzeba);
summary_pl = 1-2 zdania po polsku, konkret bez clickbaitu; category doprecyzuj na podstawie treści
(zapasy/judo/karate/kickboxing -> najbliższa z listy albo "inne"). Zachowaj wszystkie elementy listy.`;
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }),
  });
  if (!resp.ok) throw new Error('groq news ' + resp.status + ': ' + (await resp.text()));
  const data = await resp.json();
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    return (parsed.items ?? []) as { i: number; title_pl: string; summary_pl: string; category: string }[];
  } catch {
    return [];
  }
}

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

    // rate-limit: nie częściej niż co REFRESH_MINUTES
    const { data: meta } = await svc.from('news_meta').select('last_refresh').eq('id', 1).single();
    const last = meta?.last_refresh ? new Date(meta.last_refresh).getTime() : 0;
    if (Date.now() - last < REFRESH_MINUTES * 60 * 1000) {
      return json({ refreshed: false, reason: 'fresh' });
    }
    await svc.from('news_meta').update({ last_refresh: new Date().toISOString() }).eq('id', 1);

    // pobierz feedy (tolerancja na padnięte źródła)
    const results = await Promise.allSettled(
      FEEDS.map(async (f) => {
        const resp = await fetch(f.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (TATAMI news bot)' },
          signal: AbortSignal.timeout(10_000),
        });
        if (!resp.ok) throw new Error(`${f.source} ${resp.status}`);
        return parseFeed(await resp.text(), f);
      }),
    );
    const items: Item[] = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    if (items.length === 0) return json({ refreshed: true, inserted: 0, errors: results.length });

    // tylko nowe adresy (nie płacimy AI za znane wpisy)
    const { data: existing } = await svc
      .from('news_items')
      .select('url')
      .in('url', items.map((x) => x.url));
    const known = new Set((existing ?? []).map((r: { url: string }) => r.url));
    const fresh = items.filter((x) => !known.has(x.url));
    if (fresh.length === 0) return json({ refreshed: true, inserted: 0 });

    // AI: polskie tytuły i streszczenia (bez klucza — wpisy surowe)
    const groqKey = Deno.env.get('GROQ_API_KEY');
    let enriched = fresh.map((x) => ({
      ...x,
      title_out: x.title,
      summary_out: x.lang === 'pl' ? x.snippet.slice(0, 240) : null as string | null,
    }));
    if (groqKey) {
      try {
        const ai = await groqSummarize(groqKey, fresh);
        const byI = new Map(ai.map((a) => [a.i, a]));
        enriched = fresh.map((x, i) => {
          const a = byI.get(i);
          return {
            ...x,
            category: a?.category && ['mma', 'bjj', 'boks', 'inne'].includes(a.category) ? a.category : x.category,
            title_out: a?.title_pl?.trim() || x.title,
            summary_out: a?.summary_pl?.trim() || null,
          };
        });
      } catch {
        // AI padło — zapisz surowe, lepsze to niż nic
      }
    }

    const rows = enriched.map((x) => ({
      url: x.url,
      title: x.title_out,
      summary: x.summary_out,
      source: x.source,
      category: x.category,
      image_url: x.image_url,
      published_at: x.published_at,
    }));
    const { error: upErr } = await svc.from('news_items').upsert(rows, { onConflict: 'url' });
    if (upErr) throw new Error(upErr.message);

    // porządek: usuń wpisy starsze niż KEEP_DAYS
    await svc
      .from('news_items')
      .delete()
      .lt('fetched_at', new Date(Date.now() - KEEP_DAYS * 24 * 3600 * 1000).toISOString());

    return json({ refreshed: true, inserted: rows.length, model: groqKey ? 'groq' : 'raw' });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
