import { Redirect, Stack } from 'expo-router';
import { Splash } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (session) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
