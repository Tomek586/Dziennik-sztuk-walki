import { useCallback, useRef, useState } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Card, H1, H2, Muted, P, TextField } from '@/components/ui';
import { useTheme } from '@/theme';
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
            // offline — użyjemy lokalnego cache
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
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 8 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <H1>Biblioteka technik</H1>
            <TextField
              label="Szukaj techniki"
              value={query}
              onChangeText={onSearch}
              placeholder="np. duszenie, RNC, trójkąt"
              autoCapitalize="none"
            />
            {loaded && techniques.length === 0 && (
              <Banner tone="warn">
                Brak technik w bazie. Wgraj słownik: w panelu Supabase uruchom migrację
                0003_techniques.sql i seed_techniques.sql (patrz supabase/README.md).
              </Banner>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={{ paddingTop: 12, paddingBottom: 2 }}>
            <H2>{section.title}</H2>
          </View>
        )}
        renderItem={({ item }) => (
          <Link href={`/techniques/${item.id}`} asChild>
            <Pressable>
              <Card>
                <P>{item.name_pl}</P>
                <Muted>
                  {item.name_en} · {item.category}
                </Muted>
              </Card>
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}
