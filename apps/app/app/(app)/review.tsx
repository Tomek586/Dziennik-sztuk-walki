import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  OUTCOME_LABELS_PL,
  TECHNIQUE_OUTCOMES,
  trainingSessionInputSchema,
  type TechniqueOutcome,
  type TrainingSessionInput,
} from '@dsw/core';
import { Banner, Button, Card, Chip, H1, H2, Muted, P, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  applyExtraction,
  getExtraction,
  getExtractionTranscript,
  type ExtractedTechnique,
  type ExtractionRaw,
} from '@/features/ai/repository';
import {
  listDisciplines,
  syncDisciplines,
  type Discipline,
} from '@/features/disciplines/repository';
import type { SessionTechniqueDraft, SparringDraft } from '@/features/sessions/repository';
import { ENV } from '@/lib/env';
import { nowIso } from '@/lib/id';
import { useTheme } from '@/theme';

type TechState = ExtractedTechnique & { include: boolean };

export default function Review() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const t = useTheme();

  const [raw, setRaw] = useState<ExtractionRaw | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [disciplineId, setDisciplineId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('');
  const [feeling, setFeeling] = useState('');
  const [techs, setTechs] = useState<TechState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (ENV.isConfigured) {
        try {
          await syncDisciplines();
        } catch {
          // offline
        }
      }
      const ds = await listDisciplines();
      setDisciplines(ds);
      setDisciplineId((c) => c ?? ds[0]?.id ?? null);
      if (id) {
        setTranscript(await getExtractionTranscript(id));
        const ex = await getExtraction(id);
        if (ex) {
          setRaw(ex);
          setSessionType(ex.session.session_type ?? '');
          setDuration(ex.session.duration_min != null ? String(ex.session.duration_min) : '');
          setIntensity(ex.session.intensity != null ? String(ex.session.intensity) : '');
          setFeeling(ex.session.feeling != null ? String(ex.session.feeling) : '');
          setTechs(ex.techniques.map((x) => ({ ...x, include: x.technique_id != null })));
        }
      }
    })();
  }, [id]);

  const setOutcome = (i: number, o: TechniqueOutcome) =>
    setTechs((prev) =>
      prev.map((x, idx) => (idx === i ? { ...x, outcome: x.outcome === o ? null : o } : x)),
    );
  const toggle = (i: number) =>
    setTechs((prev) => prev.map((x, idx) => (idx === i ? { ...x, include: !x.include } : x)));

  async function onSave() {
    setError(null);
    if (!userId) {
      setError('Brak zalogowanego użytkownika.');
      return;
    }
    if (!disciplineId) {
      setError('Wybierz dyscyplinę.');
      return;
    }
    const input: TrainingSessionInput = {
      disciplineId,
      occurredAt: nowIso(),
      sessionType: sessionType.trim() || null,
      durationMin: numOrNull(duration),
      intensity: numOrNull(intensity),
      feeling: numOrNull(feeling),
      notes: raw?.session.summary ?? null,
      wentWell: null,
      wentBad: null,
    };
    const parsed = trainingSessionInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Błędne dane formularza.');
      return;
    }

    const techDrafts: SessionTechniqueDraft[] = techs
      .filter((x) => x.include && x.technique_id)
      .map((x) => ({
        techniqueId: x.technique_id as string,
        outcome: x.outcome,
        confidence: x.confidence,
        source: 'ai',
      }));
    const sparDrafts: SparringDraft[] = (raw?.sparring ?? []).map((s) => ({
      rounds: s.rounds ?? null,
      result: s.result ?? null,
      tapsFor: s.taps_for ?? 0,
      tapsAgainst: s.taps_against ?? 0,
      notes: s.notes ?? null,
    }));

    setSaving(true);
    try {
      await applyExtraction(userId, id ?? '', parsed.data, techDrafts, sparDrafts);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <H1>Przegląd analizy</H1>
      {!raw ? (
        <Banner tone="info">Ładowanie analizy…</Banner>
      ) : (
        <>
          {raw.session.summary ? (
            <Card>
              <Muted>Podsumowanie</Muted>
              <P>{raw.session.summary}</P>
            </Card>
          ) : null}

          {transcript ? (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Muted>Twoja notatka</Muted>
                <P
                  onPress={() => setShowTranscript((v) => !v)}
                  style={{ color: t.primary, fontWeight: '700', fontSize: 13 }}
                >
                  {showTranscript ? 'zwiń' : 'pokaż'}
                </P>
              </View>
              {showTranscript && <P>{transcript}</P>}
            </Card>
          ) : null}

          <View style={{ gap: 8 }}>
            <Muted>Dyscyplina</Muted>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {disciplines.map((d) => (
                <Chip
                  key={d.id}
                  label={d.name_pl}
                  selected={d.id === disciplineId}
                  onPress={() => setDisciplineId(d.id)}
                />
              ))}
            </View>
          </View>
          <TextField label="Typ treningu" value={sessionType} onChangeText={setSessionType} />
          <TextField
            label="Czas (min)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
          />
          <TextField
            label="Intensywność (1–10)"
            value={intensity}
            onChangeText={setIntensity}
            keyboardType="number-pad"
          />
          <TextField
            label="Samopoczucie (1–5)"
            value={feeling}
            onChangeText={setFeeling}
            keyboardType="number-pad"
          />

          <H2>Techniki ({techs.filter((x) => x.include && x.technique_id).length})</H2>
          {techs.length === 0 && (
            <Muted>AI nie rozpoznało technik — możesz dodać je ręcznie po zapisie.</Muted>
          )}
          {techs.map((x, i) => (
            <Card key={`${x.raw_text}-${i}`}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <P>
                    {x.name_pl}
                    {x.name_en ? ` (${x.name_en})` : ''}
                  </P>
                  <Muted>
                    {x.technique_id
                      ? x.confidence >= 0.9
                        ? 'dopasowano'
                        : `pewność ${Math.round(x.confidence * 100)}%`
                      : `nierozpoznana: „${x.raw_text}"`}
                  </Muted>
                </View>
                {x.technique_id ? (
                  <Chip
                    label={x.include ? '✓ w treningu' : 'pomiń'}
                    selected={x.include}
                    onPress={() => toggle(i)}
                  />
                ) : (
                  <Muted>pominięta</Muted>
                )}
              </View>
              {x.include && x.technique_id && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {TECHNIQUE_OUTCOMES.map((o) => (
                    <Chip
                      key={o}
                      label={OUTCOME_LABELS_PL[o]}
                      selected={x.outcome === o}
                      onPress={() => setOutcome(i, o)}
                    />
                  ))}
                </View>
              )}
            </Card>
          ))}

          {(raw.sparring?.length ?? 0) > 0 && (
            <Card>
              <Muted>Sparingi (zostaną zapisane)</Muted>
              {raw.sparring.map((s, i) => (
                <P key={i}>
                  {[
                    s.rounds ? `${s.rounds} rund` : null,
                    s.result,
                    s.taps_for != null ? `tapy za: ${s.taps_for}` : null,
                    s.taps_against != null ? `tapy przeciw: ${s.taps_against}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'sparing'}
                </P>
              ))}
            </Card>
          )}

          {error && <Banner tone="error">{error}</Banner>}
          <Button title="Zapisz trening" onPress={onSave} loading={saving} />
        </>
      )}
    </Screen>
  );
}

function numOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}
