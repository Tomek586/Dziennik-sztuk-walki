import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MASTERY_LABELS_PL, type MasteryLevel } from '@dsw/core';
import { Card, H1, H2, LinkRow, Muted, P, Screen, StatCard } from '@/components/ui';
import { CountUp, PressableScale, ProgressBar, Rise } from '@/components/animated';
import { useTheme, fonts, spacing } from '@/theme';
import { deriveProgress, type TechniqueProgress } from '@/features/progress/derive';
import { listTechniques, type Technique } from '@/features/techniques/repository';
import { listAllSparringRounds, listSessions } from '@/features/sessions/repository';
import { listBodyMetrics } from '@/features/metrics/repository';
import { listGoals } from '@/features/goals/repository';

export default function Progress() {
  const t = useTheme();
  const router = useRouter();
  const [byLevel, setByLevel] = useState<number[]>([0, 0, 0, 0, 0]);
  const [top, setTop] = useState<{ technique: Technique; progress: TechniqueProgress }[]>([]);
  const [totals, setTotals] = useState({ sessions: 0, hours: 0 });
  const [spar, setSpar] = useState({ tapsFor: 0, tapsAgainst: 0 });
  const [weight, setWeight] = useState<number | null>(null);
  const [activeGoals, setActiveGoals] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [progress, techs, sessions, spars, metrics, goals] = await Promise.all([
          deriveProgress(),
          listTechniques(),
          listSessions(),
          listAllSparringRounds(),
          listBodyMetrics(),
          listGoals(),
        ]);

        const levels = [0, 0, 0, 0, 0];
        for (const p of progress.values()) levels[p.level] += 1;
        setByLevel(levels);

        const byId = new Map(techs.map((x) => [x.id, x]));
        const ranked = [...progress.values()]
          .sort((a, b) => b.level - a.level || b.practiceCount - a.practiceCount)
          .slice(0, 6)
          .flatMap((p) => {
            const technique = byId.get(p.techniqueId);
            return technique ? [{ technique, progress: p }] : [];
          });
        setTop(ranked);

        const mins = sessions.reduce((acc, s) => acc + (s.duration_min ?? 0), 0);
        setTotals({ sessions: sessions.length, hours: Math.round((mins / 60) * 10) / 10 });

        let tf = 0,
          ta = 0;
        for (const s of spars) {
          tf += s.taps_for;
          ta += s.taps_against;
        }
        setSpar({ tapsFor: tf, tapsAgainst: ta });

        setWeight(metrics[0]?.weight_kg ?? null);
        setActiveGoals(goals.filter((g) => g.status === 'active').length);
      })();
    }, []),
  );

  const totalTracked = byLevel.reduce((a, b) => a + b, 0);
  const levelColors = [t.faint, t.warn, t.orange, t.primarySoft, t.success];

  return (
    <Screen>
      <Rise>
        <H1>Progres</H1>
      </Rise>

      <Rise delay={60}>
        <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
          <StatCard label="Treningi">
            <CountUp value={totals.sessions} />
          </StatCard>
          <StatCard label="Godziny">
            <CountUp value={totals.hours} decimals={1} />
          </StatCard>
          <StatCard label="Techniki">
            <CountUp value={totalTracked} />
          </StatCard>
        </View>
      </Rise>

      <Rise delay={120}>
        <Card>
          <H2>Mapa opanowania</H2>
          {totalTracked === 0 ? (
            <Muted>Oznacz techniki na treningach, aby zobaczyć rozkład.</Muted>
          ) : (
            ([4, 3, 2, 1, 0] as MasteryLevel[]).map((level) => (
              <View key={level} style={{ gap: 2, marginTop: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>
                    {MASTERY_LABELS_PL[level]}
                  </Text>
                  <Text style={{ color: t.muted, fontSize: 13 }}>{byLevel[level]}</Text>
                </View>
                <ProgressBar
                  progress={totalTracked ? (byLevel[level] ?? 0) / totalTracked : 0}
                  color={levelColors[level]}
                  height={6}
                  delay={level * 80}
                />
              </View>
            ))
          )}
        </Card>
      </Rise>

      {top.length > 0 && (
        <Rise delay={180}>
          <Card>
            <H2>Twoje najlepsze techniki</H2>
            {top.map(({ technique, progress }, i) => (
              <PressableScale key={technique.id} onPress={() => router.push(`/techniques/${technique.id}`)}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: t.border,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <P style={{ fontFamily: fonts.bodyMedium }}>{technique.name_pl}</P>
                    <Muted>{`${progress.practiceCount}× ćwiczona`}</Muted>
                  </View>
                  <Text style={{ color: levelColors[progress.level], fontFamily: fonts.monoBold, fontSize: 15 }}>
                    {progress.level}/4
                  </Text>
                </View>
              </PressableScale>
            ))}
          </Card>
        </Rise>
      )}

      <Rise delay={240}>
        <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
          <StatCard label="Tapy za / przeciw">
            <Text style={{ fontSize: 28, fontFamily: fonts.displayBlack }}>
              <Text style={{ color: t.success }}>{spar.tapsFor}</Text>
              <Text style={{ color: t.faint }}>:</Text>
              <Text style={{ color: t.danger }}>{spar.tapsAgainst}</Text>
            </Text>
          </StatCard>
          <StatCard label="Waga">
            {weight != null ? (
              <CountUp value={weight} decimals={1} suffix=" kg" size={28} />
            ) : (
              <P style={{ color: t.faint }}>brak</P>
            )}
          </StatCard>
        </View>
      </Rise>

      <Rise delay={300}>
        <Card>
          <LinkRow label={`Cele (${activeGoals} aktywnych)`} onPress={() => router.push('/goals')} />
          <View style={{ height: 1, backgroundColor: t.border }} />
          <LinkRow label="Techniki do nauki" onPress={() => router.push('/watchlist')} />
          <View style={{ height: 1, backgroundColor: t.border }} />
          <LinkRow label="Waga i forma" onPress={() => router.push('/metrics')} />
        </Card>
      </Rise>
    </Screen>
  );
}
