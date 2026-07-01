import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Banner, Button, Chip, H1, Muted, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  listDisciplines,
  syncDisciplines,
  type Discipline,
} from '@/features/disciplines/repository';
import { createCustomTechnique } from '@/features/techniques/repository';
import { ENV } from '@/lib/env';

export default function NewTechnique() {
  const router = useRouter();
  const { userId } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [disciplineId, setDisciplineId] = useState<string | null>(null);
  const [namePl, setNamePl] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('');
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
    })();
  }, []);

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
    if (namePl.trim() === '') {
      setError('Podaj nazwę techniki.');
      return;
    }
    setSaving(true);
    try {
      const tech = await createCustomTechnique(userId, {
        disciplineId,
        namePl: namePl.trim(),
        nameEn: nameEn.trim(),
        category: category.trim() || 'inne',
        position: null,
      });
      router.replace(`/techniques/${tech.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <H1>Własna technika</H1>
      <Muted>Dodaj technikę, której nie ma w słowniku. Będzie widoczna tylko dla Ciebie.</Muted>
      {!ENV.isConfigured && <Banner tone="warn">Wymaga połączenia z internetem.</Banner>}

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

      <TextField label="Nazwa (PL)" value={namePl} onChangeText={setNamePl} placeholder="np. berimbolo" />
      <TextField
        label="Nazwa (EN, opcjonalnie)"
        value={nameEn}
        onChangeText={setNameEn}
        autoCapitalize="none"
        placeholder="np. berimbolo"
      />
      <TextField
        label="Kategoria (opcjonalnie)"
        value={category}
        onChangeText={setCategory}
        placeholder="np. przejscie, duszenie, obalenie"
      />
      {error && <Banner tone="error">{error}</Banner>}
      <Button title="Zapisz technikę" onPress={onSave} loading={saving} disabled={!ENV.isConfigured} />
    </Screen>
  );
}
