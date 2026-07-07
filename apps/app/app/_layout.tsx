import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  ShipporiMincho_500Medium,
  ShipporiMincho_700Bold,
  ShipporiMincho_800ExtraBold,
} from '@expo-google-fonts/shippori-mincho';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_500Medium, IBMPlexMono_700Bold } from '@expo-google-fonts/ibm-plex-mono';
import { AuthProvider } from '@/features/auth/auth-context';
import { Splash } from '@/components/ui';

export default function RootLayout() {
  // fonty dojo noir — te same co na landingu (Shippori Mincho + IBM Plex)
  const [fontsLoaded] = useFonts({
    ShipporiMincho_500Medium,
    ShipporiMincho_700Bold,
    ShipporiMincho_800ExtraBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    IBMPlexMono_500Medium,
    IBMPlexMono_700Bold,
  });

  if (!fontsLoaded) return <Splash />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
