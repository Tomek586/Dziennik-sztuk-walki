import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Banner, Button, HeroPanel, Muted, Screen, TextField } from '@/components/ui';
import { Rise } from '@/components/animated';
import { useAuth } from '@/features/auth/auth-context';
import { ENV } from '@/lib/env';
import { useTheme, fonts } from '@/theme';

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
          <View style={{ alignItems: 'center', gap: 10, paddingBottom: 8 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: t.primary,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: '-3deg' }],
                shadowColor: t.primary,
                shadowOpacity: 0.35,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 5 },
                elevation: 8,
              }}
            >
              <Text style={{ color: '#F2E9DA', fontSize: 30, fontFamily: fonts.display }}>畳</Text>
            </View>
            <Text style={{ color: t.text, fontSize: 26, fontFamily: fonts.display, letterSpacing: 7 }}>
              TATAMI
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
