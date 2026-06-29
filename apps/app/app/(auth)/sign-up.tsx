import { useState } from 'react';
import { View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Banner, Button, H1, Muted, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { ENV } from '@/lib/env';
import { useTheme } from '@/theme';

export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();
  const t = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    const res = await signUp(email.trim(), password, displayName.trim() || undefined);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    // Jeśli projekt wymaga potwierdzenia e-mail, sesja nie powstaje od razu.
    setInfo('Konto utworzone. Jeśli wymagane jest potwierdzenie e-mail, potwierdź je, a następnie zaloguj się.');
    router.replace('/');
  }

  return (
    <Screen>
      <H1>Załóż konto</H1>
      <Muted>Dziennik Sztuk Walki</Muted>

      {!ENV.isConfigured && (
        <Banner tone="warn">
          Brak konfiguracji Supabase. Uzupełnij dane projektu w apps/app/.env.
        </Banner>
      )}

      <TextField label="Nick (opcjonalnie)" value={displayName} onChangeText={setDisplayName}
        placeholder="np. Tomek" />
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="ty@example.com"
      />
      <TextField
        label="Hasło (min. 6 znaków)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      {error && <Banner tone="error">{error}</Banner>}
      {info && <Banner tone="info">{info}</Banner>}

      <Button title="Utwórz konto" onPress={onSubmit} loading={loading} />

      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 4 }}>
        <Muted>Masz już konto?</Muted>
        <Link href="/sign-in" style={{ color: t.primary, fontWeight: '600', fontSize: 13 }}>
          Zaloguj się
        </Link>
      </View>
    </Screen>
  );
}
