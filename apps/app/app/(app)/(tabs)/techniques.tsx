import { useCallback, useRef, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Button, Card, H1, H2, Muted, P, TextField } from '@/components/ui';
import { PressableScale, Rise } from '@/components/animated';
import { useTheme, spacing } from '@/theme';
import { ENV } from '@/lib/env';
import {
  listDisciplines,
  syncDisciplines,
  type Discipline,
} from '@/features/disciplines/repository';
import {
  listTechniques,
  searchTechniques,
  syncTechniqueDictionary,
  type Technique,
} from '@/features/techniques/repository';

export default function TechniqueLibrary() {
  const t = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const queryRef = useRef('');
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async (q: string) => {
    const [list, ds] = await Promise.all([
      q.trim() ? searchTechniques(q) : listTechniques(),
      listDisciplines(),
    ]);
    setTechniques(list);
    setDisciplines(ds);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (ENV.isConfigured) {
          try {
            await Promise.all([syncDisciplines(), syncTechniqueDictionary()]);
          } catch {
            // offline — lokalny cache
          }
        }
        await load(queryRef.current);
      })();
    }, [load]),
  );

  const onSearch = (text: string) => {
    setQuery(text);
    queryRef.current = text;
    void load(text);
  };

  const sections = disciplines
    .map((d) => ({ title: d.name_pl, data: techniques.filter((x) => x.discipline_id === d.id) }))
    .filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
        style={{ width: '100%', maxWidth: 1080, alignSelf: 'center' }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
            <Rise>
              <H1>Techniki</H1>
            </Rise>
            <Rise delay={50}>
              <TextField
                label="Szukaj"
                value={query}
                onChangeText={onSearch}
                placeholder="np. duszenie, RNC, trójkąt…"
                autoCapitalize="none"
              />
            </Rise>
            <Rise delay={100}>
              <Button
                title="+ Dodaj własną technikę"
                variant="ghost"
                onPress={() => router.push('/techniques/new')}
              />
            </Rise>
            {loaded && techniques.length === 0 && (
              <Banner tone="warn">
                Brak technik — sprawdź wyszukiwanie albo połącz się z internetem, by pobrać słownik.
              </Banner>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={{ paddingTop: spacing.lg, paddingBottom: 4 }}>
            <H2>{section.title}</H2>
          </View>
        )}
        renderItem={({ item }) => (
          <PressableScale onPress={() => router.push(`/techniques/${item.id}`)}>
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <P style={{ fontWeight: '600' }}>{item.name_pl}</P>
                {!item.is_official && (
                  <Text style={{ color: t.accent, fontSize: 11, fontWeight: '700' }}>WŁASNA</Text>
                )}
              </View>
              <Text style={{ color: t.muted, fontSize: 12.5 }}>
                {item.name_en} · {item.category}
              </Text>
            </Card>
          </PressableScale>
        )}
      />
    </SafeAreaView>
  );
}
