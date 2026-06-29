import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { trainingSessionInputSchema, type TrainingSessionInput } from '@dsw/core';
import { Banner, Button, Chip, H1, Muted, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { createSession } from '@/features/sessions/repository';
import {
  listDisciplines,
  syncDisciplines,
  type Discipline,
} from '@/features/disciplines/repository';
import { synchronize } from '@/offline/sync';
import { ENV } from '@/lib/env';
import { nowIso } from '@/lib/id';

export default function NewSession() {
  const router = useRouter();
  const { userId } = useAuth();

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [disciplineId, setDisciplineId] = useState<string | null>(null);
  const [date, setDate] = useState(today());
  const [sessionType, setSessionType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('');
  const [feeling, setFeeling] = useState('');
  const [notes, setNotes] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [wentBad, setWentBad] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (ENV.isConfigured) {
        try {
          await syncDisciplines();
        } catch {
          // offline — użyjemy lokalnego cache, jeśli istnieje
        }
      }
      const ds = await listDisciplines();
      if (!active) return;
      setDisciplines(ds);
      setDisciplineId((current) => current ?? ds[0]?.id ?? null);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit() {
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
      occurredAt: toIso(date),
      sessionType: emptyToNull(sessionType),
      durationMin: numOrNull(duration),
      intensity: numOrNull(intensity),
      feeling: numOrNull(feeling),
      notes: emptyToNull(notes),
      wentWell: emptyToNull(wentWell),
      wentBad: emptyToNull(wentBad),
    };

    const parsed = trainingSessionInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Niepoprawne dane formularza.');
      return;
    }

    setSaving(true);
    try {
      await createSession(userId, parsed.data);
      if (ENV.isConfigured) {
        try {
          await synchronize();
        } catch {
          // zostanie zsynchronizowane przy następnej okazji
        }
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <H1>Nowy trening</H1>

      {disciplines.length === 0 ? (
        <Banner tone="warn">
          Brak pobranej listy dyscyplin. Połącz się raz z internetem (po zalogowaniu),
          aby pobrać słownik dyscyplin.
        </Banner>
      ) : (
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
      )}

      <TextField
        label="Data (RRRR-MM-DD)"
        value={date}
        onChangeText={setDate}
        placeholder="2026-06-29"
        autoCapitalize="none"
      />
      <TextField
        label="Typ treningu"
        value={sessionType}
        onChangeText={setSessionType}
        placeholder="np. no-gi, sparingi, tarcze"
      />
      <TextField
        label="Czas trwania (min)"
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        placeholder="60"
      />
      <TextField
        label="Intensywność (1–10)"
        value={intensity}
        onChangeText={setIntensity}
        keyboardType="number-pad"
        placeholder="7"
      />
      <TextField
        label="Samopoczucie (1–5)"
        value={feeling}
        onChangeText={setFeeling}
        keyboardType="number-pad"
        placeholder="4"
      />
      <TextField
        label="Notatki"
        value={notes}
        onChangeText={setNotes}
        placeholder="Co robiliście na treningu?"
        multiline
      />
      <TextField
        label="Co poszło dobrze"
        value={wentWell}
        onChangeText={setWentWell}
        multiline
      />
      <TextField label="Co poszło źle" value={wentBad} onChangeText={setWentBad} multiline />

      {error && <Banner tone="error">{error}</Banner>}

      <Button
        title="Zapisz trening"
        onPress={onSubmit}
        loading={saving}
        disabled={disciplines.length === 0}
      />
    </Screen>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIso(date: string): string {
  // łączymy wybraną datę z bieżącą godziną; przy niepoprawnej dacie => teraz
  const d = new Date(`${date}T${new Date().toISOString().slice(11)}`);
  return Number.isNaN(d.getTime()) ? nowIso() : d.toISOString();
}

function numOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
