import { useCallback, useState } from 'react';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Linking, View } from 'react-native';
import { MASTERY_LABELS_PL } from '@dsw/core';
import { Banner, Button, Card, H1, H2, Muted, P, Screen, TextField } from '@/components/ui';
import { useTheme } from '@/theme';
import { ENV } from '@/lib/env';
import { useAuth } from '@/features/auth/auth-context';
import {
  getRelations,
  getTechnique,
  syncTechniqueDictionary,
  type Technique,
} from '@/features/techniques/repository';
import { getTechniqueProgress, type TechniqueProgress } from '@/features/progress/derive';
import { fetchMaterials, type MaterialData } from '@/features/ai/repository';
import {
  addNote,
  deleteNote,
  getFeedback,
  isWatched,
  listNotes,
  setFeedback,
  toggleWatch,
  type NoteRow,
} from '@/features/techniques/user-content';

const REL_LABELS: Record<string, string> = {
  variant_of: 'Wariant',
  counter_to: 'Kontra na',
  transition_to: 'Przejście do',
  setup_for: 'Setup pod',
};

export default function TechniqueDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [technique, setTechnique] = useState<Technique | undefined>();
  const [relations, setRelations] = useState<{ relation: string; technique: Technique }[]>([]);
  const [progress, setProgress] = useState<TechniqueProgress | null>(null);
  const [material, setMaterial] = useState<MaterialData | null>(null);
  const [loadingMat, setLoadingMat] = useState(false);
  const [matError, setMatError] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [watched, setWatched] = useState(false);
  const [feedback, setFeedbackState] = useState<Record<string, boolean | null>>({});

  async function onToggleWatch() {
    if (!userId || !id) return;
    setWatched(await toggleWatch(userId, id));
  }
  async function onAddNote() {
    if (!userId || !id || !noteInput.trim()) return;
    await addNote(userId, id, noteInput.trim());
    setNoteInput('');
    setNotes(await listNotes(id));
  }
  async function rate(sourceId: string, helpful: boolean) {
    if (!userId) return;
    await setFeedback(userId, sourceId, helpful);
    setFeedbackState((prev) => ({ ...prev, [sourceId]: helpful }));
  }

  async function loadMaterials(force = false) {
    if (!id) return;
    setMatError(null);
    setLoadingMat(true);
    try {
      const data = await fetchMaterials(id, force);
      setMaterial(data);
      const fb: Record<string, boolean | null> = {};
      for (const s of data.sources) fb[s.id] = await getFeedback(s.id);
      setFeedbackState(fb);
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
          setNotes(await listNotes(id));
          setWatched(await isWatched(id));
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

          <Button
            title={watched ? '★ W nauce — usuń' : '☆ Dodaj do nauki'}
            variant="ghost"
            onPress={onToggleWatch}
          />

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
                  onPress={() => loadMaterials(false)}
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
                    {material.sources.map((s) => (
                      <View key={s.id} style={{ gap: 4, marginBottom: 6 }}>
                        <P
                          onPress={() => Linking.openURL(s.url)}
                          style={{ color: t.primary, fontWeight: '600' }}
                        >
                          ▶ {s.title ?? s.url}
                          {s.channel ? ` — ${s.channel}` : ''}
                        </P>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                          <P
                            onPress={() => rate(s.id, true)}
                            style={{ color: feedback[s.id] === true ? t.success : t.muted, fontSize: 13 }}
                          >
                            👍 pomocne
                          </P>
                          <P
                            onPress={() => rate(s.id, false)}
                            style={{ color: feedback[s.id] === false ? t.danger : t.muted, fontSize: 13 }}
                          >
                            👎 słabe
                          </P>
                        </View>
                      </View>
                    ))}
                  </>
                )}
                <Button
                  title="Odśwież materiały"
                  variant="ghost"
                  onPress={() => loadMaterials(true)}
                  loading={loadingMat}
                />
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

          <Card>
            <H2>Twoje notatki</H2>
            {notes.length === 0 ? (
              <Muted>Brak notatek.</Muted>
            ) : (
              notes.map((n) => (
                <View
                  key={n.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <P style={{ flex: 1, paddingRight: 8 }}>{n.body}</P>
                  <P
                    onPress={async () => {
                      await deleteNote(n.id);
                      if (id) setNotes(await listNotes(id));
                    }}
                    style={{ color: t.muted, fontSize: 13 }}
                  >
                    usuń
                  </P>
                </View>
              ))
            )}
            <TextField
              label="Nowa notatka"
              value={noteInput}
              onChangeText={setNoteInput}
              multiline
              placeholder="np. pamiętać o kontroli nadgarstka"
            />
            <Button title="Dodaj notatkę" onPress={onAddNote} />
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
