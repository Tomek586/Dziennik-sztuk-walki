import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Banner, Button, HeroPanel, Muted, Screen, TextField } from '@/components/ui';
import { Rise } from '@/components/animated';
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
      <View style={{ maxWidth: 440, width: '100%', alignSelf: 'center', gap: 16, paddingTop: 40 }}>
        <Rise>
          <View style={{ alignItems: 'center', gap: 4, paddingBottom: 8 }}>
            <Text style={{ fontSize: 44 }}>🥋</Text>
            <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
              DZIENNIK<Text style={{ color: t.primary }}> SW</Text>
            </Text>
            <Muted>Twój progres w sztukach walki</Muted>
          </View>
        </Rise>

        <Rise delay={80}>
          <HeroPanel>
            {!ENV.isConfigured && (
              <Banner tone="warn">
                Brak konfiguracji Supabase — uzupełnij apps/app/.env, aby logowanie działało.
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
            <Button title="Zaloguj się" onPress={onSubmit} loading={loading} />
          </HeroPanel>
        </Rise>

        <Rise delay={160}>
          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
            <Text style={{ color: t.muted, fontSize: 13 }}>Nie masz konta?</Text>
            <Link href="/sign-up" style={{ color: t.primary, fontWeight: '700', fontSize: 13 }}>
              Załóż konto
            </Link>
          </View>
        </Rise>
      </View>
    </Screen>
  );
}
