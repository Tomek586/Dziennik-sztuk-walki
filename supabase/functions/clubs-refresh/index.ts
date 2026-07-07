// Edge Function: clubs-refresh — kluby sztuk walki w Polsce z OpenStreetMap.
// Overpass API -> tabela clubs. Samowystarczalna, bez sekretów.
// Rate-limit: odświeża najwyżej raz na 7 dni (clubs_meta.last_refresh).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const REFRESH_DAYS = 7;

const OVERPASS_QUERY = `
[out:json][timeout:60];
area["ISO3166-1"="PL"][admin_level=2]->.pl;
nwr["sport"~"martial_arts|boxing|judo|karate|kickboxing|muay_thai|mma|ju-jitsu|jiu-jitsu|jujitsu|wrestling|taekwondo|aikido|sambo|krav_maga",i](area.pl);
out center tags;
`;

/** Nasze kategorie filtrów z tagów sport OSM (klub może mieć kilka; tagi po średnikach). */
function mapCategories(sport: string): string[] {
  const tokens = sport.toLowerCase().split(';').map((x) => x.trim());
  const out = new Set<string>();
  for (const tk of tokens) {
    if (/jiu|jujitsu|ju-jitsu|bjj|grappling|submission/.test(tk)) out.add('bjj');
    else if (/^mma$|mixed_martial/.test(tk)) out.add('mma');
    else if (/^boxing$/.test(tk)) out.add('boks');
    else if (/kickboxing|muay|k-?1/.test(tk)) out.add('kick');
    else if (/wrestling|sambo|judo/.test(tk)) out.add('zapasy');
    else if (/martial|karate|aikido|taekwondo|krav/.test(tk)) out.add('inne');
  }
  if (out.size === 0) out.add('inne');
  return [...out];
}

type OsmEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

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

    const { data: meta } = await svc.from('clubs_meta').select('last_refresh').eq('id', 1).single();
    const last = meta?.last_refresh ? new Date(meta.last_refresh).getTime() : 0;
    if (Date.now() - last < REFRESH_DAYS * 24 * 3600 * 1000) {
      return json({ refreshed: false, reason: 'fresh' });
    }
    await svc.from('clubs_meta').update({ last_refresh: new Date().toISOString() }).eq('id', 1);

    const resp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Overpass wymaga identyfikacji klienta (bez UA zwraca 406)
        'User-Agent': 'TATAMI-dziennik-sztuk-walki/1.0 (github.com/Tomek586/Dziennik-sztuk-walki)',
      },
      body: 'data=' + encodeURIComponent(OVERPASS_QUERY),
      signal: AbortSignal.timeout(90_000),
    });
    if (!resp.ok) throw new Error('overpass ' + resp.status);
    const data = await resp.json();
    const els = (data.elements ?? []) as OsmEl[];

    const rows = els
      .map((e) => {
        const t = e.tags ?? {};
        const lat = e.lat ?? e.center?.lat;
        const lon = e.lon ?? e.center?.lon;
        if (lat == null || lon == null) return null;
        const sports = t.sport ?? '';
        return {
          osm_key: `${e.type}/${e.id}`,
          name: t.name ?? 'Klub sztuk walki',
          sports,
          categories: mapCategories(sports).join(','),
          lat,
          lon,
          city: t['addr:city'] ?? null,
          street: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ') || null,
          website: t.website ?? t['contact:website'] ?? null,
          phone: t.phone ?? t['contact:phone'] ?? null,
          fetched_at: new Date().toISOString(),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r != null);

    if (rows.length === 0) return json({ refreshed: true, inserted: 0 });

    const { error: upErr } = await svc.from('clubs').upsert(rows, { onConflict: 'osm_key' });
    if (upErr) throw new Error(upErr.message);

    return json({ refreshed: true, inserted: rows.length });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
