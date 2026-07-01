import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { OUTCOME_LABELS_PL, type TechniqueOutcome } from '@dsw/core';
import { Banner, Card, H1, H2, Muted, P, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import {
  listSessions,
  listSessionTechniques,
  listSparringRounds,
  type SessionRow,
  type SessionTechniqueRow,
  type SparringRow,
} from '@/features/sessions/repository';
import { listTechniques, type Technique } from '@/features/techniques/repository';
import { listDisciplines, type Discipline } from '@/features/disciplines/repository';

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [techs, setTechs] = useState<SessionTechniqueRow[]>([]);
  const [spars, setSpars] = useState<SparringRow[]>([]);
  const [techById, setTechById] = useState<Record<string, Technique>>({});
  const [discById, setDiscById] = useState<Record<string, Discipline>>({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!id) return;
        const [sessions, st, sp, allT, ds] = await Promise.all([
          listSessions(),
          listSessionTechniques(id),
          listSparringRounds(id),
          listTechniques(),
          listDisciplines(),
        ]);
        setSession(sessions.find((s) => s.id === id) ?? null);
        setTechs(st);
        setSpars(sp);
        setTechById(Object.fromEntries(allT.map((x) => [x.id, x])));
        setDiscById(Object.fromEntries(ds.map((d) => [d.id, d])));
      })();
    }, [id]),
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Trening' }} />
      {!session ? (
        <Banner tone="info">Ładowanie treningu…</Banner>
      ) : (
        <>
          <H1>{discById[session.discipline_id]?.name_pl ?? '—'}</H1>
          <Muted>{new Date(session.occurred_at).toLocaleString('pl-PL')}</Muted>
          <Muted>
            {[
              session.session_type,
              session.duration_min ? `${session.duration_min} min` : null,
              session.intensity ? `int. ${session.intensity}/10` : null,
              session.feeling ? `sam. ${session.feeling}/5` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'bez szczegółów'}
          </Muted>

          {session.notes ? (
            <Card>
              <Muted>Notatki</Muted>
              <P>{session.notes}</P>
            </Card>
          ) : null}
          {session.went_well ? (
            <Card>
              <Muted>Poszło dobrze</Muted>
              <P>{session.went_well}</P>
            </Card>
          ) : null}
          {session.went_bad ? (
            <Card>
              <Muted>Do poprawy</Muted>
              <P>{session.went_bad}</P>
            </Card>
          ) : null}

          <H2>Techniki ({techs.length})</H2>
          {techs.length === 0 ? (
            <Muted>Brak technik.</Muted>
          ) : (
            techs.map((st) => (
              <Card key={st.id}>
                <Link
                  href={`/techniques/${st.technique_id}`}
                  style={{ color: t.primary, fontWeight: '600' }}
                >
                  {techById[st.technique_id]?.name_pl ?? 'technika'}
                </Link>
                <Muted>
                  {st.outcome ? OUTCOME_LABELS_PL[st.outcome as TechniqueOutcome] : 'bez oceny'}
                  {st.source === 'ai' ? ' · z AI' : ''}
                </Muted>
              </Card>
            ))
          )}

          {spars.length > 0 && (
            <>
              <H2>Sparingi</H2>
              {spars.map((s) => (
                <Card key={s.id}>
                  <P>
                    {[
                      s.round_no ? `${s.round_no} rund` : null,
                      s.result,
                      `tapy ${s.taps_for}:${s.taps_against}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </P>
                  {s.notes ? <Muted>{s.notes}</Muted> : null}
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
