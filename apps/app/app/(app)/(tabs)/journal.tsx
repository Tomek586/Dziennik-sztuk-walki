import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, H1, Muted, P } from '@/components/ui';
import { PressableScale, Rise } from '@/components/animated';
import { useTheme, spacing } from '@/theme';
import { ENV } from '@/lib/env';
import {
  listAllSessionTechniques,
  listSessions,
  softDeleteSession,
  type SessionRow,
} from '@/features/sessions/repository';
import {
  listDisciplines,
  type Discipline,
} from '@/features/disciplines/repository';
import { synchronize } from '@/offline/sync';

export default function Journal() {
  const t = useTheme();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [disciplines, setDisciplines] = useState<Record<string, Discipline>>({});
  const [techCount, setTechCount] = useState<Record<string, number>>({});
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const [list, ds, sts] = await Promise.all([
      listSessions(),
      listDisciplines(),
      listAllSessionTechniques(),
    ]);
    setSessions(list);
    setDisciplines(Object.fromEntries(ds.map((d) => [d.id, d])));
    const counts: Record<string, number> = {};
    for (const st of sts) counts[st.session_id] = (counts[st.session_id] ?? 0) + 1;
    setTechCount(counts);
  }, []);

  const doSync = useCallback(async () => {
    if (!ENV.isConfigured) return;
    setSyncing(true);
    try {
      await synchronize();
    } catch {
      // offline
    } finally {
      setSyncing(false);
      await refresh();
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void doSync();
    }, [refresh, doSync]),
  );

  const discName = (id: string) => disciplines[id]?.name_pl ?? '—';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        refreshing={syncing}
        onRefresh={doSync}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
        style={{ width: '100%', maxWidth: 1080, alignSelf: 'center' }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <Rise>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <H1>Dziennik</H1>
                <Muted>{sessions.length} treningów</Muted>
              </View>
            </Rise>
            <Rise delay={60}>
              <Button title="+ Dodaj trening ręcznie" variant="ghost" onPress={() => router.push('/new')} />
            </Rise>
          </View>
        }
        ListEmptyComponent={
          <Rise delay={100}>
            <Card>
              <P>Brak treningów. Nagraj notatkę głosową albo dodaj trening ręcznie.</P>
            </Card>
          </Rise>
        }
        renderItem={({ item, index }) => (
          <Rise delay={Math.min(index, 8) * 50}>
            <PressableScale onPress={() => router.push(`/session/${item.id}`)}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <P style={{ fontWeight: '700', fontSize: 16 }}>{discName(item.discipline_id)}</P>
                  <Muted>{formatDate(item.occurred_at)}</Muted>
                </View>
                <Text style={{ color: t.muted, fontSize: 13 }}>
                  {[
                    item.session_type,
                    item.duration_min ? `${item.duration_min} min` : null,
                    item.intensity ? `int. ${item.intensity}/10` : null,
                    techCount[item.id] ? `${techCount[item.id]} technik` : null,
                  ]
                    .filter(Boolean)
                    .join('  ·  ') || 'bez szczegółów'}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 2,
                  }}
                >
                  <Text style={{ color: t.primary, fontWeight: '700', fontSize: 13 }}>
                    szczegóły →
                  </Text>
                  <Ionicons
                    name="trash-outline"
                    size={17}
                    color={t.faint}
                    onPress={async () => {
                      await softDeleteSession(item.id);
                      await refresh();
                      void doSync();
                    }}
                  />
                </View>
              </Card>
            </PressableScale>
          </Rise>
        )}
      />
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
