import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MASTERY_LEVELS, type MasteryLevel } from '@dsw/core';
import { Button, Card, Chip, H1, H2, Muted, P, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  addGoal,
  deleteGoal,
  listGoals,
  setGoalStatus,
  type GoalRow,
} from '@/features/goals/repository';
import { listSessions } from '@/features/sessions/repository';
import { deriveProgress, type TechniqueProgress } from '@/features/progress/derive';
import { searchTechniques, type Technique } from '@/features/techniques/repository';
import { synchronize } from '@/offline/sync';
import { ENV } from '@/lib/env';

export default function Goals() {
  const { userId } = useAuth();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [weekCount, setWeekCount] = useState(0);
  const [progress, setProgress] = useState<Map<string, TechniqueProgress>>(new Map());

  const [perWeek, setPerWeek] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [techQuery, setTechQuery] = useState('');
  const [techResults, setTechResults] = useState<Technique[]>([]);
  const [selTech, setSelTech] = useState<Technique | null>(null);
  const [selLevel, setSelLevel] = useState<MasteryLevel>(4);

  const refresh = useCallback(async () => {
    const [gs, sessions, prog] = await Promise.all([listGoals(), listSessions(), deriveProgress()]);
    setGoals(gs);
    const now = Date.now();
    setWeekCount(
      sessions.filter((s) => now - new Date(s.occurred_at).getTime() <= 7 * 86_400_000).length,
    );
    setProgress(prog);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const doSync = useCallback(async () => {
    if (ENV.isConfigured) {
      try {
        await synchronize();
      } catch {
        // offline
      }
    }
    await refresh();
  }, [refresh]);

  async function addFrequency() {
    if (!userId) return;
    const n = Number(perWeek);
    if (!n || n <= 0) return;
    await addGoal(userId, 'frequency', `${n} treningów / tydzień`, { per_week: n });
    setPerWeek('');
    await doSync();
  }
  async function addCustom() {
    if (!userId || !customTitle.trim()) return;
    await addGoal(userId, 'custom', customTitle.trim(), {});
    setCustomTitle('');
    await doSync();
  }
  async function addTech() {
    if (!userId || !selTech) return;
    await addGoal(userId, 'technique_mastery', `${selTech.name_pl} → poziom ${selLevel}`, {
      technique_id: selTech.id,
      level: selLevel,
    });
    setSelTech(null);
    setTechQuery('');
    setTechResults([]);
    await doSync();
  }
  const onTechSearch = async (q: string) => {
    setTechQuery(q);
    setSelTech(null);
    if (q.trim() === '') {
      setTechResults([]);
      return;
    }
    setTechResults((await searchTechniques(q)).slice(0, 6));
  };

  const target = (g: GoalRow) => (g.target ?? {}) as Record<string, unknown>;
  function goalProgress(g: GoalRow): string {
    const tg = target(g);
    if (g.kind === 'frequency') return `${weekCount}/${Number(tg.per_week ?? 0)} w tym tygodniu`;
    if (g.kind === 'technique_mastery') {
      const cur = progress.get(String(tg.technique_id ?? ''))?.level ?? 0;
      return `poziom ${cur}/${Number(tg.level ?? 0)}`;
    }
    return g.status === 'done' ? 'ukończony' : 'w toku';
  }
  function isDone(g: GoalRow): boolean {
    const tg = target(g);
    if (g.kind === 'frequency') return weekCount >= Number(tg.per_week ?? 0);
    if (g.kind === 'technique_mastery')
      return (progress.get(String(tg.technique_id ?? ''))?.level ?? 0) >= Number(tg.level ?? 0);
    return g.status === 'done';
  }

  return (
    <Screen>
      <H1>Cele</H1>
      {goals.length === 0 ? (
        <Muted>Brak celów. Dodaj pierwszy poniżej.</Muted>
      ) : (
        goals.map((g) => (
          <Card key={g.id}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <P>{g.title ?? g.kind}</P>
                <Muted>
                  {isDone(g) ? '✓ ' : ''}
                  {goalProgress(g)}
                </Muted>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {g.kind === 'custom' && g.status !== 'done' && (
                <Button
                  title="Ukończ"
                  variant="ghost"
                  onPress={async () => {
                    await setGoalStatus(g.id, 'done');
                    await doSync();
                  }}
                />
              )}
              <Button
                title="Usuń"
                variant="ghost"
                onPress={async () => {
                  await deleteGoal(g.id);
                  await doSync();
                }}
              />
            </View>
          </Card>
        ))
      )}

      <H2>Nowy cel</H2>
      <Card>
        <Muted>Częstotliwość</Muted>
        <TextField
          label="Treningi / tydzień"
          value={perWeek}
          onChangeText={setPerWeek}
          keyboardType="number-pad"
          placeholder="np. 3"
        />
        <Button title="Dodaj cel częstotliwości" onPress={addFrequency} />
      </Card>

      <Card>
        <Muted>Opanowanie techniki</Muted>
        <TextField
          label="Szukaj techniki"
          value={techQuery}
          onChangeText={onTechSearch}
          autoCapitalize="none"
          placeholder="np. trójkąt"
        />
        {selTech ? (
          <P>Wybrano: {selTech.name_pl}</P>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {techResults.map((r) => (
              <Chip key={r.id} label={r.name_pl} selected={false} onPress={() => setSelTech(r)} />
            ))}
          </View>
        )}
        <Muted>Docelowy poziom (0–4)</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {MASTERY_LEVELS.map((l) => (
            <Chip
              key={l}
              label={`${l}`}
              selected={selLevel === l}
              onPress={() => setSelLevel(l)}
            />
          ))}
        </View>
        <Button title="Dodaj cel techniki" onPress={addTech} disabled={!selTech} />
      </Card>

      <Card>
        <Muted>Własny cel</Muted>
        <TextField
          label="Opis celu"
          value={customTitle}
          onChangeText={setCustomTitle}
          placeholder="np. Przygotować się do zawodów"
        />
        <Button title="Dodaj własny cel" onPress={addCustom} />
      </Card>
    </Screen>
  );
}
