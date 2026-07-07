import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Banner,
  Button,
  Card,
  H2,
  HeroPanel,
  Muted,
  P,
  Screen,
  StatCard,
} from '@/components/ui';
import { CountUp, PressableScale, ProgressBar, Rise } from '@/components/animated';
import { useTheme, fonts, spacing } from '@/theme';
import { ENV } from '@/lib/env';
import {
  listAllSessionTechniques,
  listAllSparringRounds,
  listSessions,
  type SessionRow,
} from '@/features/sessions/repository';
import {
  listDisciplines,
  syncDisciplines,
  type Discipline,
} from '@/features/disciplines/repository';
import { syncTechniqueDictionary } from '@/features/techniques/repository';
import { deriveProgress } from '@/features/progress/derive';
import { getSyncState, synchronize } from '@/offline/sync';

export default function Dashboard() {
  const t = useTheme();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [disciplines, setDisciplines] = useState<Record<string, Discipline>>({});
  const [pending, setPending] = useState(0);
  const [techCount, setTechCount] = useState<Record<string, number>>({});
  const [progressStat, setProgressStat] = useState({ practiced: 0, working: 0 });
  const [activity, setActivity] = useState({ week: 0, month: 0, streak: 0 });
  const [spar, setSpar] = useState({ tapsFor: 0, tapsAgainst: 0, wins: 0, losses: 0 });

  const refresh = useCallback(async () => {
    const [list, state, ds, sts, progress, spars] = await Promise.all([
      listSessions(),
      getSyncState(),
      listDisciplines(),
      listAllSessionTechniques(),
      deriveProgress(),
      listAllSparringRounds(),
    ]);
    setSessions(list);
    setPending(state.pending);
    setDisciplines(Object.fromEntries(ds.map((d) => [d.id, d])));

    const counts: Record<string, number> = {};
    for (const st of sts) counts[st.session_id] = (counts[st.session_id] ?? 0) + 1;
    setTechCount(counts);

    let working = 0;
    for (const p of progress.values()) if (p.level >= 2) working += 1;
    setProgressStat({ practiced: progress.size, working });

    const now = Date.now();
    const day = 86_400_000;
    setActivity({
      week: list.filter((s) => now - new Date(s.occurred_at).getTime() <= 7 * day).length,
      month: list.filter((s) => now - new Date(s.occurred_at).getTime() <= 30 * day).length,
      streak: computeStreak(list),
    });

    let tf = 0,
      ta = 0,
      wins = 0,
      losses = 0;
    for (const s of spars) {
      tf += s.taps_for;
      ta += s.taps_against;
      if (s.result === 'win') wins += 1;
      else if (s.result === 'loss') losses += 1;
    }
    setSpar({ tapsFor: tf, tapsAgainst: ta, wins, losses });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      (async () => {
        if (!ENV.isConfigured) return;
        try {
          await Promise.all([syncDisciplines(), syncTechniqueDictionary()]);
          await synchronize();
        } catch {
          // offline — lokalne dane wystarczą
        }
        await refresh();
      })();
    }, [refresh]),
  );

  const recent = sessions.slice(0, 3);
  const discName = (id: string) => disciplines[id]?.name_pl ?? '—';

  return (
    <Screen>
      {/* nagłówek */}
      <Rise>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Muted>{todayLabel()}</Muted>
            <Text style={{ color: t.text, fontSize: 28, fontFamily: fonts.displayBlack, letterSpacing: 0.6 }}>
              Cześć! 🥋
            </Text>
          </View>
          <PressableScale onPress={() => router.push('/settings')}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: t.card,
                borderWidth: 1,
                borderColor: t.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="settings-outline" size={19} color={t.muted} />
            </View>
          </PressableScale>
        </View>
      </Rise>

      {/* hero: nagraj */}
      <Rise delay={60}>
        <HeroPanel>
          <Muted>Po treningu?</Muted>
          <P style={{ fontSize: 17, fontFamily: fonts.bodySemi }}>
            Nagraj 60 sekund — AI zapisze techniki i sparingi za Ciebie.
          </P>
          <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
            <View style={{ flexGrow: 1, minWidth: 180 }}>
              <Button title="●  Nagraj trening" onPress={() => router.push('/record')} />
            </View>
            <View style={{ flexGrow: 1, minWidth: 180 }}>
              <Button title="✍️  Opisz tekstem" variant="ghost" onPress={() => router.push('/analyze')} />
            </View>
          </View>
        </HeroPanel>
      </Rise>

      {/* statystyki */}
      <Rise delay={120}>
        <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
          <StatCard label="Seria dni">
            <CountUp value={activity.streak} suffix=" 🔥" />
          </StatCard>
          <StatCard label="Ten tydzień">
            <CountUp value={activity.week} />
          </StatCard>
          <StatCard label="30 dni">
            <CountUp value={activity.month} />
          </StatCard>
        </View>
      </Rise>

      {/* postęp technik */}
      <Rise delay={180}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <H2>Postęp technik</H2>
            <P onPress={() => router.push('/progress')} style={{ color: t.primary, fontFamily: fonts.bodySemi }}>
              więcej →
            </P>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.xl, alignItems: 'flex-end' }}>
            <View>
              <CountUp value={progressStat.practiced} size={30} />
              <Muted>ćwiczonych</Muted>
            </View>
            <View>
              <CountUp value={progressStat.working} size={30} color={t.success} />
              <Muted>działa (2+)</Muted>
            </View>
          </View>
          <ProgressBar
            progress={progressStat.practiced ? progressStat.working / progressStat.practiced : 0}
            color={t.success}
          />
        </Card>
      </Rise>

      {/* sparingi */}
      {spar.wins + spar.losses + spar.tapsFor + spar.tapsAgainst > 0 && (
        <Rise delay={240}>
          <Card>
            <H2>Sparingi</H2>
            <View style={{ flexDirection: 'row', gap: spacing.xl }}>
              <View>
                <Text style={{ color: t.text, fontSize: 26, fontFamily: fonts.displayBlack }}>
                  {spar.wins}
                  <Text style={{ color: t.faint }}>–</Text>
                  {spar.losses}
                </Text>
                <Muted>bilans</Muted>
              </View>
              <View>
                <Text style={{ fontSize: 26, fontFamily: fonts.displayBlack }}>
                  <Text style={{ color: t.success }}>{spar.tapsFor}</Text>
                  <Text style={{ color: t.faint }}>:</Text>
                  <Text style={{ color: t.danger }}>{spar.tapsAgainst}</Text>
                </Text>
                <Muted>tapy za / przeciw</Muted>
              </View>
            </View>
          </Card>
        </Rise>
      )}

      {/* status sync */}
      {pending > 0 && (
        <Rise delay={280}>
          <Banner tone="warn">
            {pending} zmian czeka na synchronizację —{' '}
            <P onPress={() => router.push('/sync')} style={{ color: t.primary, fontWeight: '700', fontSize: 13.5 }}>
              zobacz
            </P>
          </Banner>
        </Rise>
      )}

      {/* ostatnie treningi */}
      <Rise delay={300}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <H2>Ostatnie treningi</H2>
          <P onPress={() => router.push('/journal')} style={{ color: t.primary, fontWeight: '700' }}>
            wszystkie →
          </P>
        </View>
      </Rise>
      {recent.length === 0 ? (
        <Rise delay={340}>
          <Card>
            <P>Brak treningów. Nagraj pierwszy — zajmie minutę.</P>
          </Card>
        </Rise>
      ) : (
        recent.map((s, i) => (
          <Rise key={s.id} delay={340 + i * 60}>
            <PressableScale onPress={() => router.push(`/session/${s.id}`)}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <P style={{ fontWeight: '700', fontSize: 16 }}>{discName(s.discipline_id)}</P>
                  <Muted>{formatDate(s.occurred_at)}</Muted>
                </View>
                <Text style={{ color: t.muted, fontSize: 13 }}>
                  {[
                    s.session_type,
                    s.duration_min ? `${s.duration_min} min` : null,
                    techCount[s.id] ? `${techCount[s.id]} technik` : null,
                  ]
                    .filter(Boolean)
                    .join('  ·  ') || 'bez szczegółów'}
                </Text>
              </Card>
            </PressableScale>
          </Rise>
        ))
      )}
    </Screen>
  );
}

function todayLabel(): string {
  return new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
}

function computeStreak(sessions: SessionRow[]): number {
  const days = new Set(sessions.map((s) => new Date(s.occurred_at).toISOString().slice(0, 10)));
  const cursor = new Date();
  const key = () => cursor.toISOString().slice(0, 10);
  if (!days.has(key())) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(key())) return 0;
  }
  let streak = 0;
  while (days.has(key())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
