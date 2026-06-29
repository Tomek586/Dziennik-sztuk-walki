import { useCallback, useState } from 'react';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MASTERY_LABELS_PL } from '@dsw/core';
import { Banner, Card, H1, H2, Muted, P, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { ENV } from '@/lib/env';
import {
  getRelations,
  getTechnique,
  syncTechniqueDictionary,
  type Technique,
} from '@/features/techniques/repository';
import { getTechniqueProgress, type TechniqueProgress } from '@/features/progress/derive';

const REL_LABELS: Record<string, string> = {
  variant_of: 'Wariant',
  counter_to: 'Kontra na',
  transition_to: 'Przejście do',
  setup_for: 'Setup pod',
};

export default function TechniqueDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [technique, setTechnique] = useState<Technique | undefined>();
  const [relations, setRelations] = useState<{ relation: string; technique: Technique }[]>([]);
  const [progress, setProgress] = useState<TechniqueProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (ENV.isConfigured) {
          try {
            await syncTechniqueDictionary();
          } catch {
            // offline — lokalny cache
          }
        }
        if (id) {
          setTechnique(await getTechnique(id));
          setRelations(await getRelations(id));
          setProgress(await getTechniqueProgress(id));
        }
      })();
    }, [id]),
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: technique?.name_pl ?? 'Technika' }} />
      {!technique ? (
        <Banner tone="info">Ładowanie techniki…</Banner>
      ) : (
        <>
          <H1>{technique.name_pl}</H1>
          <Muted>{technique.name_en}</Muted>
          <Muted>
            {[technique.category, technique.position, technique.gi_context]
              .filter(Boolean)
              .join(' · ')}
          </Muted>
          {technique.description ? <P>{technique.description}</P> : null}

          <Card>
            <H2>Materiały do nauki</H2>
            <Muted>
              AI dobierze i streści materiały (filmy, punkty kluczowe, typowe błędy) — pojawią
              się po włączeniu pipeline'u AI.
            </Muted>
          </Card>

          <Card>
            <H2>Twój postęp</H2>
            {progress ? (
              <>
                <P>
                  Poziom: {MASTERY_LABELS_PL[progress.level]} ({progress.level}/4)
                </P>
                <Muted>
                  Oznaczona {progress.practiceCount}× · ostatnio{' '}
                  {progress.lastPracticedAt ? formatDate(progress.lastPracticedAt) : '—'}
                </Muted>
              </>
            ) : (
              <Muted>Postęp pojawi się, gdy oznaczysz tę technikę na treningu.</Muted>
            )}
          </Card>

          {relations.length > 0 && (
            <Card>
              <H2>Powiązane techniki</H2>
              {relations.map((r) => (
                <Link
                  key={`${r.relation}:${r.technique.id}`}
                  href={`/techniques/${r.technique.id}`}
                  style={{ color: t.primary, fontWeight: '600', paddingVertical: 4 }}
                >
                  {(REL_LABELS[r.relation] ?? r.relation)}: {r.technique.name_pl}
                </Link>
              ))}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
