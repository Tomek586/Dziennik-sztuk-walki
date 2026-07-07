import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  OUTCOME_LABELS_PL,
  TECHNIQUE_OUTCOMES,
  normalizeTechnique,
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
import { addGoal } from '@/features/goals/repository';
import { createCustomTechnique } from '@/features/techniques/repository';
import type { SessionTechniqueDraft, SparringDraft } from '@/features/sessions/repository';
import { ENV } from '@/lib/env';
import { nowIso } from '@/lib/id';
import { useTheme, fonts } from '@/theme';

type TechState = ExtractedTechnique & {
  include: boolean;
  /** technika spoza słownika zaznaczona do utworzenia jako prywatna */
  createNew: boolean;
};

/** Dopasowanie zgadniętej przez AI dyscypliny do słownika użytkownika. */
const DISCIPLINE_HINTS: Record<string, string[]> = {
  bjj: ['jiu', 'grappling', 'bjj'],
  grappling: ['grappling', 'jiu'],
  mma: ['mma'],
  boks: ['boks'],
  'muay thai': ['muay', 'uderzan'],
  kickboxing: ['kick', 'uderzan'],
};

function guessDiscipline(guess: string | null | undefined, ds: Discipline[]): string | null {
  if (!guess) return null;
  const hints = DISCIPLINE_HINTS[guess.toLowerCase()] ?? [guess.toLowerCase()];
  for (const d of ds) {
    const n = normalizeTechnique(d.name_pl);
    if (hints.some((h) => n.includes(h))) return d.id;
  }
  return null;
}

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
  const [goalPicks, setGoalPicks] = useState<Record<number, boolean>>({});
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
      if (id) {
        setTranscript(await getExtractionTranscript(id));
        const ex = await getExtraction(id);
        if (ex) {
          setRaw(ex);
          setSessionType(ex.session.session_type ?? '');
          setDuration(ex.session.duration_min != null ? String(ex.session.duration_min) : '');
          setIntensity(ex.session.intensity != null ? String(ex.session.intensity) : '');
          setFeeling(ex.session.feeling != null ? String(ex.session.feeling) : '');
          setTechs(
            ex.techniques.map((x) => ({
              ...x,
              include: true,
              createNew: x.technique_id == null,
            })),
          );
          setDisciplineId(
            (c) => c ?? guessDiscipline(ex.session.discipline_guess, ds) ?? ds[0]?.id ?? null,
          );
          return;
        }
      }
      setDisciplineId((c) => c ?? ds[0]?.id ?? null);
    })();
  }, [id]);

  const setOutcome = (i: number, o: TechniqueOutcome) =>
    setTechs((prev) =>
      prev.map((x, idx) => (idx === i ? { ...x, outcome: x.outcome === o ? null : o } : x)),
    );
  const toggle = (i: number) =>
    setTechs((prev) => prev.map((x, idx) => (idx === i ? { ...x, include: !x.include } : x)));

  const sections = raw?.session.sections ?? [];
  const insights = raw?.insights ?? [];
  const goalSuggestions = raw?.goal_suggestions ?? [];

  /** Pełne notatki treningu: sekcje + wnioski (nic z notatki nie ginie). */
  function composeNotes(): string | null {
    const parts: string[] = [];
    if (sections.length > 0) {
      parts.push(sections.map((s) => `${s.title}:\n${s.content}`).join('\n\n'));
    } else if (raw?.session.summary) {
      parts.push(raw.session.summary);
    }
    if (insights.length > 0) {
      parts.push('Wnioski:\n' + insights.map((x) => `• ${x}`).join('\n'));
    }
    return parts.length > 0 ? parts.join('\n\n') : null;
  }

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
      notes: composeNotes(),
      wentWell: null,
      wentBad: null,
    };
    const parsed = trainingSessionInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Błędne dane formularza.');
      return;
    }

    setSaving(true);
    try {
      // techniki spoza słownika → utwórz jako prywatne (wymaga sieci; best-effort)
      const resolved = new Map<number, string>();
      for (let i = 0; i < techs.length; i++) {
        const x = techs[i];
        if (x.include && !x.technique_id && x.createNew) {
          try {
            const created = await createCustomTechnique(userId, {
              disciplineId,
              namePl: capitalize(x.raw_text),
              nameEn: x.name_en ?? capitalize(x.raw_text),
              category: x.category ?? 'inne',
            });
            resolved.set(i, created.id);
          } catch {
            // offline / brak polityki — technika zostanie tylko w notatce
          }
        }
      }

      const techDrafts: SessionTechniqueDraft[] = techs
        .map((x, i) => ({ x, id: x.technique_id ?? resolved.get(i) ?? null }))
        .filter(({ x, id: tid }) => x.include && tid)
        .map(({ x, id: tid }) => ({
          techniqueId: tid as string,
          outcome: x.outcome,
          confidence: x.confidence,
          source: 'ai' as const,
        }));

      const sparDrafts: SparringDraft[] = (raw?.sparring ?? []).map((s) => ({
        rounds: s.round_no ?? s.rounds ?? null,
        result: s.result ?? null,
        tapsFor: s.taps_for ?? 0,
        tapsAgainst: s.taps_against ?? 0,
        partnerLabel: s.partner ?? null,
        notes:
          [
            s.what_worked ? `Wchodziło: ${s.what_worked}` : null,
            s.what_failed ? `Nie działało: ${s.what_failed}` : null,
            s.notes,
          ]
            .filter(Boolean)
            .join(' · ') || null,
      }));

      await applyExtraction(userId, id ?? '', parsed.data, techDrafts, sparDrafts);

      // zaznaczone propozycje celów → cele treningowe
      for (let i = 0; i < goalSuggestions.length; i++) {
        if (goalPicks[i]) {
          try {
            await addGoal(userId, 'custom', goalSuggestions[i], {});
          } catch {
            // best-effort
          }
        }
      }

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
              <Muted>W skrócie</Muted>
              <P>{raw.session.summary}</P>
            </Card>
          ) : null}

          {sections.length > 0 && (
            <Card>
              <Muted>Pełne podsumowanie — trafi do notatek treningu</Muted>
              {sections.map((s, i) => (
                <View key={i} style={{ gap: 2, marginTop: i === 0 ? 4 : 10 }}>
                  <P style={{ fontFamily: fonts.bodySemi, color: t.accent }}>{s.title}</P>
                  <P style={{ color: t.text }}>{s.content}</P>
                </View>
              ))}
            </Card>
          )}

          {transcript ? (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Muted>Twoja notatka</Muted>
                <P
                  onPress={() => setShowTranscript((v) => !v)}
                  style={{ color: t.primary, fontFamily: fonts.bodySemi, fontSize: 13 }}
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

          <H2>Techniki ({techs.filter((x) => x.include).length})</H2>
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
                    {x.name_en && x.name_en !== x.name_pl ? ` (${x.name_en})` : ''}
                  </P>
                  <Muted>
                    {x.technique_id
                      ? x.confidence >= 0.9
                        ? 'dopasowano'
                        : `pewność ${Math.round(x.confidence * 100)}%`
                      : x.createNew
                        ? 'nowa — trafi do Twojego słownika'
                        : `nierozpoznana: „${x.raw_text}"`}
                  </Muted>
                </View>
                <Chip
                  label={x.include ? '✓ w treningu' : 'pomiń'}
                  selected={x.include}
                  onPress={() => toggle(i)}
                />
              </View>
              {(x.went_well || x.went_bad) && (
                <P style={{ color: t.muted, fontSize: 13 }}>
                  {[x.went_well ? `+ ${x.went_well}` : null, x.went_bad ? `− ${x.went_bad}` : null]
                    .filter(Boolean)
                    .join('   ')}
                </P>
              )}
              {x.include && !x.technique_id && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  <Chip
                    label={x.createNew ? '✓ dodaj do słownika' : 'nie dodawaj do słownika'}
                    selected={x.createNew}
                    onPress={() =>
                      setTechs((prev) =>
                        prev.map((y, idx) => (idx === i ? { ...y, createNew: !y.createNew } : y)),
                      )
                    }
                  />
                </View>
              )}
              {x.include && (
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
                <View key={i} style={{ gap: 2, marginTop: i === 0 ? 2 : 8 }}>
                  <P>
                    {[
                      s.round_no != null ? `runda ${s.round_no}` : s.rounds ? `${s.rounds} rund` : null,
                      s.partner ? `z: ${s.partner}` : null,
                      s.result,
                      s.taps_for != null ? `tapy za: ${s.taps_for}` : null,
                      s.taps_against != null ? `tapy przeciw: ${s.taps_against}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'sparing'}
                  </P>
                  {(s.what_worked || s.what_failed) && (
                    <P style={{ color: t.muted, fontSize: 13 }}>
                      {[
                        s.what_worked ? `+ ${s.what_worked}` : null,
                        s.what_failed ? `− ${s.what_failed}` : null,
                      ]
                        .filter(Boolean)
                        .join('   ')}
                    </P>
                  )}
                </View>
              ))}
            </Card>
          )}

          {insights.length > 0 && (
            <Card>
              <Muted>Wnioski — trafią do notatek treningu</Muted>
              {insights.map((x, i) => (
                <P key={i}>• {x}</P>
              ))}
            </Card>
          )}

          {goalSuggestions.length > 0 && (
            <Card>
              <Muted>Propozycje celów — zaznacz, które utworzyć</Muted>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {goalSuggestions.map((g, i) => (
                  <Chip
                    key={i}
                    label={goalPicks[i] ? `✓ ${g}` : g}
                    selected={!!goalPicks[i]}
                    onPress={() => setGoalPicks((prev) => ({ ...prev, [i]: !prev[i] }))}
                  />
                ))}
              </View>
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

function capitalize(s: string): string {
  const t = s.trim();
  return t.length > 0 ? t[0].toUpperCase() + t.slice(1) : t;
}
