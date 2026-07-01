import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Banner, Button, Card, H1, H2, Muted, P, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  addBodyMetric,
  deleteBodyMetric,
  listBodyMetrics,
  type BodyMetricRow,
} from '@/features/metrics/repository';
import { synchronize } from '@/offline/sync';
import { ENV } from '@/lib/env';

export default function Metrics() {
  const { userId } = useAuth();
  const [metrics, setMetrics] = useState<BodyMetricRow[]>([]);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setMetrics(await listBodyMetrics());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function add() {
    setError(null);
    if (!userId) return;
    const w = Number(weight.replace(',', '.'));
    if (Number.isNaN(w) || w <= 0) {
      setError('Podaj poprawną wagę.');
      return;
    }
    setSaving(true);
    try {
      await addBodyMetric(userId, w, null);
      setWeight('');
      await refresh();
      if (ENV.isConfigured) {
        try {
          await synchronize();
        } catch {
          // offline
        }
      }
    } finally {
      setSaving(false);
    }
  }

  const latest = metrics[0];
  const prev = metrics[1];
  const change =
    latest?.weight_kg != null && prev?.weight_kg != null ? latest.weight_kg - prev.weight_kg : null;

  return (
    <Screen>
      <H1>Waga i forma</H1>
      <Card>
        <Muted>Ostatni pomiar</Muted>
        <P>
          {latest?.weight_kg != null ? `${latest.weight_kg} kg` : 'brak'}
          {change != null ? ` (${change > 0 ? '+' : ''}${change.toFixed(1)} kg)` : ''}
        </P>
      </Card>

      <TextField
        label="Waga (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="np. 78.5"
      />
      {error && <Banner tone="error">{error}</Banner>}
      <Button title="Zapisz pomiar" onPress={add} loading={saving} />

      <H2>Historia ({metrics.length})</H2>
      {metrics.length === 0 ? (
        <Muted>Brak pomiarów.</Muted>
      ) : (
        metrics.map((m) => (
          <Card key={m.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <P>{m.weight_kg != null ? `${m.weight_kg} kg` : '—'}</P>
              <Muted>{new Date(m.measured_at).toLocaleDateString('pl-PL')}</Muted>
            </View>
            <View style={{ alignSelf: 'flex-start' }}>
              <Button
                title="Usuń"
                variant="ghost"
                onPress={async () => {
                  await deleteBodyMetric(m.id);
                  await refresh();
                }}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
