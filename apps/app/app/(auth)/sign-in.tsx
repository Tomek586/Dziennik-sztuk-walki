import { useState } from 'react';
import { View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Banner, Button, H1, Muted, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { ENV } from '@/lib/env';
import { useTheme } from '@/theme';

export default function SignIn() {
  const { signIn } = useAuth();
  const router = useRouter();
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) setError(res.error);
    else router.replace('/');
  }

  return (
    <Screen>
      <H1>Zaloguj się</H1>
      <Muted>Dziennik Sztuk Walki</Muted>

      {!ENV.isConfigured && (
        <Banner tone="warn">
          Brak konfiguracji Supabase. Uzupełnij EXPO_PUBLIC_SUPABASE_URL oraz
          EXPO_PUBLIC_SUPABASE_ANON_KEY w pliku apps/app/.env, aby logowanie działało.
        </Banner>
      )}

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
        label="Hasło"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      {error && <Banner tone="error">{error}</Banner>}

      <Button title="Zaloguj" onPress={onSubmit} loading={loading} />

      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 4 }}>
        <Muted>Nie masz konta?</Muted>
        <Link href="/sign-up" style={{ color: t.primary, fontWeight: '600', fontSize: 13 }}>
          Załóż konto
        </Link>
      </View>
    </Screen>
  );
}
