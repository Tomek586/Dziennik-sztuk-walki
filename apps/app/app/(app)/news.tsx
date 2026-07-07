import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, View } from 'react-native';
import { Banner, Button, Card, Chip, H1, Muted, P, Screen } from '@/components/ui';
import { PressableScale, Rise } from '@/components/animated';
import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_LABELS_PL,
  listNews,
  refreshNews,
  type NewsItem,
} from '@/features/news/repository';
import { ENV } from '@/lib/env';
import { useTheme, fonts, radius } from '@/theme';

export default function News() {
  const t = useTheme();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load(refresh: boolean) {
    setError(null);
    if (refresh) setLoading(true);
    try {
      const local = await listNews();
      if (local.length > 0) setItems(local);
      if (refresh && ENV.isConfigured) setItems(await refreshNews());
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

  const filtered = useMemo(
    () => (category ? items.filter((x) => x.category === category) : items),
    [items, category],
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <H1>Newsy</H1>
        <Muted>{filtered.length > 0 ? `${filtered.length} wpisów` : ''}</Muted>
      </View>
      <Muted>Świat sztuk walki — po polsku, odświeżane automatycznie</Muted>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="Wszystkie" selected={category === null} onPress={() => setCategory(null)} />
        {NEWS_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={NEWS_CATEGORY_LABELS_PL[c]}
            selected={category === c}
            onPress={() => setCategory((cur) => (cur === c ? null : c))}
          />
        ))}
      </View>

      {error && (
        <Banner tone="warn">
          Nie udało się odświeżyć newsów ({error}). Jeśli to pierwsze uruchomienie — wgraj
          migrację 0008 i funkcję news-refresh w Supabase.
        </Banner>
      )}

      {loaded && filtered.length === 0 && !error && (
        <Card>
          <P>Brak newsów. Kliknij „Odśwież" — pierwsze pobranie może chwilę potrwać.</P>
        </Card>
      )}

      {filtered.map((n, i) => (
        <Rise key={n.id} delay={Math.min(i, 8) * 50}>
          <PressableScale onPress={() => void Linking.openURL(n.url)}>
            <Card>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Muted>
                    {[NEWS_CATEGORY_LABELS_PL[n.category] ?? n.category, n.source, dateLabel(n)]
                      .filter(Boolean)
                      .join(' · ')}
                  </Muted>
                  <P style={{ fontFamily: fonts.bodySemi, fontSize: 15.5 }}>{n.title}</P>
                  {n.summary ? (
                    <P style={{ color: t.muted, fontSize: 13.5, lineHeight: 19 }}>{n.summary}</P>
                  ) : null}
                  <P style={{ color: t.primary, fontSize: 12.5, fontFamily: fonts.bodyMedium }}>
                    czytaj u źródła →
                  </P>
                </View>
                {n.image_url ? (
                  <Image
                    source={{ uri: n.image_url }}
                    style={{ width: 84, height: 84, borderRadius: radius.md, backgroundColor: t.bgAlt }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
            </Card>
          </PressableScale>
        </Rise>
      ))}

      <Button title="Odśwież" variant="ghost" onPress={() => void load(true)} loading={loading} />
    </Screen>
  );
}

function dateLabel(n: NewsItem): string | null {
  const iso = n.published_at ?? n.fetched_at;
  if (!iso) return null;
  const d = new Date(iso);
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days < 1) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
}
