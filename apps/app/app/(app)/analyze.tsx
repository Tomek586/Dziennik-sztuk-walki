import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Banner, Button, H1, Muted, Screen, TextField } from '@/components/ui';
import { runExtract } from '@/features/ai/repository';
import { useAuth } from '@/features/auth/auth-context';
import { ENV } from '@/lib/env';

export default function Analyze() {
  const router = useRouter();
  const { userId } = useAuth();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onAnalyze() {
    setError(null);
    if (text.trim().length < 3) {
      setError('Wpisz krótki opis treningu.');
      return;
    }
    setLoading(true);
    try {
      const { extractionId } = await runExtract({ text, userId: userId ?? undefined });
      router.replace({ pathname: '/review', params: { id: extractionId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <H1>Opisz trening</H1>
      <Muted>
        Wpisz lub wklej relację z treningu — AI wyciągnie techniki i przygotuje trening do zapisu.
        Działa też bez kluczy (dopasowanie po słowach kluczowych ze słownika).
      </Muted>
      {!ENV.isConfigured && (
        <Banner tone="warn">Supabase nieskonfigurowany — ta funkcja wymaga połączenia.</Banner>
      )}
      <TextField
        label="Relacja z treningu"
        value={text}
        onChangeText={setText}
        multiline
        placeholder="np. Dziś no-gi. Drillowałem duszenie zza pleców i trójkąt. W sparingu złapałem gilotynę, ale słabo szło przejście gardy."
      />
      {error && <Banner tone="error">{error}</Banner>}
      <Button title="Analizuj" onPress={onAnalyze} loading={loading} disabled={!ENV.isConfigured} />
    </Screen>
  );
}
