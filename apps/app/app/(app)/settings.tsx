import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { Banner, Button, Card, Chip, H1, H2, Muted, P, Screen, TextField } from '@/components/ui';
import { useTheme } from '@/theme';
import { ENV } from '@/lib/env';
import { useAuth } from '@/features/auth/auth-context';
import { getProfile, updateProfile, type Profile } from '@/features/profile/repository';
import {
  listDisciplines,
  syncDisciplines,
  type Discipline,
} from '@/features/disciplines/repository';
import { addGrade, deleteGrade, listGrades, type GradeRow } from '@/features/metrics/repository';
import { synchronize } from '@/offline/sync';

export default function Settings() {
  const { userId, signOut } = useAuth();
  const t = useTheme();

  const [, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [storeAudio, setStoreAudio] = useState(true);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [gradeDisc, setGradeDisc] = useState<string | null>(null);
  const [gradeLabel, setGradeLabel] = useState('');

  useEffect(() => {
    (async () => {
      if (!userId) return;
      if (ENV.isConfigured) {
        try {
          await syncDisciplines();
        } catch {
          // offline
        }
      }
      const [p, ds, gs] = await Promise.all([getProfile(userId), listDisciplines(), listGrades()]);
      if (p) {
        setProfile(p);
        setDisplayName(p.display_name ?? '');
        setUnits(p.units === 'imperial' ? 'imperial' : 'metric');
        setStoreAudio(p.store_audio);
      }
      setDisciplines(ds);
      setGradeDisc((c) => c ?? ds[0]?.id ?? null);
      setGrades(gs);
    })();
  }, [userId]);

  async function saveProfile() {
    if (!userId) return;
    setSavedMsg(null);
    try {
      await updateProfile(userId, {
        display_name: displayName.trim() || null,
        units,
        store_audio: storeAudio,
      });
      setSavedMsg('Zapisano.');
    } catch (e) {
      setSavedMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function addGradeEntry() {
    if (!userId || !gradeDisc || !gradeLabel.trim()) return;
    await addGrade(userId, gradeDisc, gradeLabel.trim(), new Date().toISOString().slice(0, 10));
    setGradeLabel('');
    setGrades(await listGrades());
    if (ENV.isConfigured) {
      try {
        await synchronize();
      } catch {
        // offline
      }
    }
  }

  const discName = (id: string) => disciplines.find((d) => d.id === id)?.name_pl ?? '—';

  return (
    <Screen>
      <H1>Ustawienia</H1>

      <Card>
        <H2>Profil</H2>
        <TextField label="Nick" value={displayName} onChangeText={setDisplayName} />
        <Muted>Jednostki</Muted>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Metryczne (kg)" selected={units === 'metric'} onPress={() => setUnits('metric')} />
          <Chip
            label="Imperialne (lb)"
            selected={units === 'imperial'}
            onPress={() => setUnits('imperial')}
          />
        </View>
        <Muted>Przechowywać nagrania po transkrypcji?</Muted>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Tak" selected={storeAudio} onPress={() => setStoreAudio(true)} />
          <Chip label="Nie" selected={!storeAudio} onPress={() => setStoreAudio(false)} />
        </View>
        {savedMsg && <Banner tone="info">{savedMsg}</Banner>}
        <Button title="Zapisz profil" onPress={saveProfile} disabled={!ENV.isConfigured} />
      </Card>

      <Card>
        <H2>Stopnie / pasy</H2>
        {grades.length === 0 ? (
          <Muted>Brak wpisów.</Muted>
        ) : (
          grades.map((g) => (
            <View
              key={g.id}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <P>
                {discName(g.discipline_id)}: {g.grade_label}
              </P>
              <Button
                title="Usuń"
                variant="ghost"
                onPress={async () => {
                  await deleteGrade(g.id);
                  setGrades(await listGrades());
                }}
              />
            </View>
          ))
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {disciplines.map((d) => (
            <Chip
              key={d.id}
              label={d.name_pl}
              selected={d.id === gradeDisc}
              onPress={() => setGradeDisc(d.id)}
            />
          ))}
        </View>
        <TextField
          label="Stopień / pas"
          value={gradeLabel}
          onChangeText={setGradeLabel}
          placeholder="np. niebieski pas, 2 stopnie"
        />
        <Button title="Dodaj stopień" onPress={addGradeEntry} />
      </Card>

      <Card>
        <H2>Więcej</H2>
        <Link href="/metrics" style={{ color: t.primary, fontWeight: '600', paddingVertical: 4 }}>
          Waga i forma →
        </Link>
        <Link href="/sync" style={{ color: t.primary, fontWeight: '600', paddingVertical: 4 }}>
          Synchronizacja i diagnostyka →
        </Link>
      </Card>

      <Button title="Wyloguj" variant="danger" onPress={signOut} />
    </Screen>
  );
}
