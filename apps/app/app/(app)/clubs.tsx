import { createElement, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { Banner, Button, Card, Chip, H1, Muted, P, Screen, TextField } from '@/components/ui';
import { PressableScale, Rise } from '@/components/animated';
import {
  CLUB_CATEGORIES,
  CLUB_CATEGORY_LABELS_PL,
  listClubs,
  refreshClubs,
  type Club,
} from '@/features/clubs/repository';
import { ENV } from '@/lib/env';
import { useTheme, fonts } from '@/theme';

/** Natywny <iframe> przez react-native-web (tylko web). */
function MapFrame({ html }: { html: string }) {
  return createElement('iframe', {
    srcDoc: html,
    style: { width: '100%', height: 460, border: '0', borderRadius: 14, display: 'block' },
    title: 'Mapa klubów',
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Samowystarczalny HTML z Leaflet + ciemne kafelki (CARTO) + markery. */
function buildMapHtml(clubs: Club[]): string {
  const data = clubs.map((c) => ({
    n: escapeHtml(c.name),
    la: c.lat,
    lo: c.lon,
    ci: c.city ? escapeHtml(c.city) : null,
    w: c.website ? escapeHtml(c.website) : null,
  }));
  const payload = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#m{margin:0;height:100%;background:#0c0a08}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{background:#171310;color:#f2e9da;font-family:system-ui}
.leaflet-popup-content a{color:#d6402f}</style></head>
<body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map = L.map('m').setView([52.1, 19.3], 6);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19,
}).addTo(map);
const clubs = ${payload};
for (const c of clubs) {
  const m = L.circleMarker([c.la, c.lo], {
    radius: 7, color: '#d6402f', weight: 2, fillColor: '#d6402f', fillOpacity: 0.55,
  }).addTo(map);
  let html = '<b>' + c.n + '</b>';
  if (c.ci) html += '<br>' + c.ci;
  if (c.w) html += '<br><a href="' + c.w + '" target="_blank" rel="noopener">strona klubu</a>';
  html += '<br><a href="https://www.openstreetmap.org/?mlat=' + c.la + '&mlon=' + c.lo + '#map=17/' + c.la + '/' + c.lo + '" target="_blank" rel="noopener">pokaż w OSM</a>';
  m.bindPopup(html);
}
</script></body></html>`;
}

export default function Clubs() {
  const t = useTheme();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load(refresh: boolean) {
    setError(null);
    if (refresh) setLoading(true);
    try {
      const local = await listClubs();
      if (local.length > 0) setClubs(local);
      if (refresh && ENV.isConfigured) setClubs(await refreshClubs());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  useEffect(() => {
    void load(true);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clubs.filter(
      (c) =>
        (!category || c.categories.split(',').includes(category)) &&
        (!q || c.name.toLowerCase().includes(q) || (c.city ?? '').toLowerCase().includes(q)),
    );
  }, [clubs, category, query]);

  const mapHtml = useMemo(
    () => (Platform.OS === 'web' ? buildMapHtml(filtered) : ''),
    [filtered],
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <H1>Gdzie trenować</H1>
        <Muted>{filtered.length > 0 ? `${filtered.length} klubów` : ''}</Muted>
      </View>
      <Muted>Kluby sztuk walki w Polsce — dane OpenStreetMap</Muted>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="Wszystkie" selected={category === null} onPress={() => setCategory(null)} />
        {CLUB_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={CLUB_CATEGORY_LABELS_PL[c]}
            selected={category === c}
            onPress={() => setCategory((cur) => (cur === c ? null : c))}
          />
        ))}
      </View>
      <TextField
        label="Szukaj (miasto lub nazwa)"
        value={query}
        onChangeText={setQuery}
        placeholder="np. Kraków"
      />

      {error && (
        <Banner tone="warn">
          Nie udało się odświeżyć klubów ({error}). Jeśli to pierwsze uruchomienie — wgraj
          migrację 0009 i funkcję clubs-refresh w Supabase.
        </Banner>
      )}

      {Platform.OS === 'web' && filtered.length > 0 && (
        <Card style={{ padding: 6 }}>
          <MapFrame html={mapHtml} />
        </Card>
      )}

      {loaded && filtered.length === 0 && !error && (
        <Card>
          <P>
            Brak klubów dla tych filtrów. Pokrycie OpenStreetMap bywa nierówne — spróbuj innej
            kategorii lub „Odśwież".
          </P>
        </Card>
      )}

      {filtered.slice(0, 40).map((c, i) => (
        <Rise key={c.id} delay={Math.min(i, 8) * 40}>
          <PressableScale
            onPress={() =>
              void Linking.openURL(
                c.website ??
                  `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=17/${c.lat}/${c.lon}`,
              )
            }
          >
            <Card>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <P style={{ fontFamily: fonts.bodySemi }}>{c.name}</P>
                  <Muted>
                    {[
                      c.city,
                      c.categories
                        .split(',')
                        .map((x) => CLUB_CATEGORY_LABELS_PL[x] ?? x)
                        .join(', '),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Muted>
                </View>
                <P style={{ color: t.primary, fontSize: 16, fontFamily: fonts.monoBold }}>→</P>
              </View>
            </Card>
          </PressableScale>
        </Rise>
      ))}
      {filtered.length > 40 && (
        <Muted>…i {filtered.length - 40} więcej — zawęź filtrem lub wyszukiwaniem</Muted>
      )}

      <Button title="Odśwież" variant="ghost" onPress={() => void load(true)} loading={loading} />
    </Screen>
  );
}
