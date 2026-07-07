import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Sidebar } from '@/components/Sidebar';
import { useTheme, gradients } from '@/theme';

/** Środkowy przycisk nagrywania — wyniesiony ponad pasek. */
function RecordButton() {
  const router = useRouter();
  const t = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/record')}
      style={{ top: -18, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel="Nagraj trening"
    >
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: t.primary,
          shadowOpacity: 0.55,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
          borderWidth: 3,
          borderColor: t.bgAlt,
        }}
      >
        <Ionicons name="mic" size={26} color="#F2E9DA" />
      </LinearGradient>
    </Pressable>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 900;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: t.bg }}>
      {isWide && <Sidebar />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: t.primary,
            tabBarInactiveTintColor: t.faint,
            tabBarStyle: isWide
              ? { display: 'none' }
              : {
                  backgroundColor: t.bgAlt,
                  borderTopColor: t.border,
                  borderTopWidth: 1,
                  height: 62,
                  paddingTop: 6,
                },
            tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Pulpit',
              tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="journal"
            options={{
              title: 'Dziennik',
              tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="record-tab"
            options={{
              title: '',
              tabBarButton: () => <RecordButton />,
            }}
          />
          <Tabs.Screen
            name="progress"
            options={{
              title: 'Progres',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="stats-chart" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="techniques"
            options={{
              title: 'Techniki',
              tabBarIcon: ({ color, size }) => <Ionicons name="school" size={size} color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
