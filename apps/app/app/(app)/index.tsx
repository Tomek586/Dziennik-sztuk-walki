import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, H2, Muted, P } from '@/components/ui';
import { ENV } from '@/lib/env';
import { useTheme } from '@/theme';
import {
  listSessions,
  softDeleteSession,
  type SessionRow,
} from '@/features/sessions/repository';
import {
  listDisciplines,
  syncDisciplines,
  type Discipline,
} from '@/features/disciplines/repository';
import { getSyncState, synchronize } from '@/offline/sync';

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [disciplines, setDisciplines] = useState<Record<string, Discipline>>({});
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const [list, state, ds] = await Promise.all([
      listSessions(),
      getSyncState(),
      listDisciplines(),
    ]);
    setSessions(list);
    setPending(state.pending);
    setDisciplines(Object.fromEntries(ds.map((d) => [d.id, d])));
  }, []);

  const doSync = useCallback(async () => {
    if (!ENV.isConfigured) return;
    setSyncing(true);
    try {
      await syncDisciplines();
      await synchronize();
    } catch {
      // szczegóły błędów dostępne na ekranie diagnostyki
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
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['bottom']}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        refreshing={syncing}
        onRefresh={doSync}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <H1>Twój dziennik</H1>
            <Card>
              <Muted>Status synchronizacji</Muted>
              <P>
                {ENV.isConfigured
                  ? pending > 0
                    ? `${pending} zmian oczekuje na wysłanie`
                    : 'Wszystko zsynchronizowane'
                  : 'Tryb lokalny — Supabase nieskonfigurowany'}
              </P>
              <Link href="/sync" style={{ color: t.primary, fontWeight: '600' }}>
                Diagnostyka i synchronizacja →
              </Link>
            </Card>
            <Button title="+ Dodaj trening" onPress={() => router.push('/new')} />
            <Link
              href="/techniques"
              style={{ color: t.primary, fontWeight: '600', textAlign: 'center' }}
            >
              Biblioteka technik →
            </Link>
            <H2>Treningi ({sessions.length})</H2>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <P>Brak treningów. Dodaj pierwszy, aby zacząć.</P>
            <Muted>
              W Etapie 0 dodajemy trening formularzem. Zapis głosowy z AI pojawi się w MVP.
            </Muted>
          </Card>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <H2>{discName(item.discipline_id)}</H2>
              <Muted>{formatDate(item.occurred_at)}</Muted>
            </View>
            {item.session_type ? <P>{item.session_type}</P> : null}
            <Muted>
              {[
                item.duration_min ? `${item.duration_min} min` : null,
                item.intensity ? `intensywność ${item.intensity}/10` : null,
                item.feeling ? `samopoczucie ${item.feeling}/5` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'bez szczegółów'}
            </Muted>
            <View style={{ alignSelf: 'flex-start' }}>
              <Button
                title="Usuń"
                variant="ghost"
                onPress={async () => {
                  await softDeleteSession(item.id);
                  await refresh();
                  void doSync();
                }}
              />
            </View>
          </Card>
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
