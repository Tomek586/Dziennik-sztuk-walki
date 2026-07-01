import { useCallback, useState } from 'react';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import { MASTERY_LABELS_PL } from '@dsw/core';
import { Banner, Button, Card, H1, H2, Muted, P, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { ENV } from '@/lib/env';
import {
  getRelations,
  getTechnique,
  syncTechniqueDictionary,
  type Technique,
} from '@/features/techniques/repository';
import { getTechniqueProgress, type TechniqueProgress } from '@/features/progress/derive';
import { fetchMaterials, type MaterialData } from '@/features/ai/repository';

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
  const [material, setMaterial] = useState<MaterialData | null>(null);
  const [loadingMat, setLoadingMat] = useState(false);
  const [matError, setMatError] = useState<string | null>(null);

  async function loadMaterials() {
    if (!id) return;
    setMatError(null);
    setLoadingMat(true);
    try {
      setMaterial(await fetchMaterials(id));
    } catch (e) {
      setMatError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingMat(false);
    }
  }

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
            {!material ? (
              <>
                <Muted>
                  AI dobierze streszczenie, punkty kluczowe, typowe błędy i filmy dla tej techniki.
                </Muted>
                {matError && <Banner tone="error">{matError}</Banner>}
                <Button
                  title="Pobierz materiały (AI)"
                  onPress={loadMaterials}
                  loading={loadingMat}
                  disabled={!ENV.isConfigured}
                />
              </>
            ) : (
              <>
                {material.material?.summary ? <P>{material.material.summary}</P> : null}
                {(material.material?.key_points?.length ?? 0) > 0 && (
                  <>
                    <Muted>Punkty kluczowe</Muted>
                    {material.material?.key_points.map((k, i) => <P key={i}>• {k}</P>)}
                  </>
                )}
                {(material.material?.common_errors?.length ?? 0) > 0 && (
                  <>
                    <Muted>Typowe błędy</Muted>
                    {material.material?.common_errors.map((k, i) => <P key={i}>• {k}</P>)}
                  </>
                )}
                {material.sources.length > 0 && (
                  <>
                    <Muted>Filmy</Muted>
                    {material.sources.map((s, i) => (
                      <P
                        key={i}
                        onPress={() => Linking.openURL(s.url)}
                        style={{ color: t.primary, fontWeight: '600' }}
                      >
                        ▶ {s.title ?? s.url}
                        {s.channel ? ` — ${s.channel}` : ''}
                      </P>
                    ))}
                  </>
                )}
                <Button title="Odśwież materiały" variant="ghost" onPress={loadMaterials} loading={loadingMat} />
              </>
            )}
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
