import { Redirect, Stack } from 'expo-router';
import { Splash } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/theme';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const t = useTheme();
  if (loading) return <Splash />;
  if (!session) return <Redirect href="/sign-in" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Dziennik' }} />
      <Stack.Screen name="new" options={{ title: 'Nowy trening', presentation: 'modal' }} />
      <Stack.Screen name="record" options={{ title: 'Notatka głosowa', presentation: 'modal' }} />
      <Stack.Screen name="analyze" options={{ title: 'Opisz trening', presentation: 'modal' }} />
      <Stack.Screen name="review" options={{ title: 'Przegląd analizy' }} />
      <Stack.Screen name="sync" options={{ title: 'Synchronizacja' }} />
      <Stack.Screen name="metrics" options={{ title: 'Waga i forma' }} />
      <Stack.Screen name="settings" options={{ title: 'Ustawienia' }} />
      <Stack.Screen name="goals" options={{ title: 'Cele' }} />
      <Stack.Screen name="watchlist" options={{ title: 'Do nauki' }} />
      <Stack.Screen name="techniques/index" options={{ title: 'Biblioteka technik' }} />
      <Stack.Screen
        name="techniques/new"
        options={{ title: 'Własna technika', presentation: 'modal' }}
      />
      <Stack.Screen name="techniques/[id]" options={{ title: 'Technika' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Trening' }} />
    </Stack>
  );
}
