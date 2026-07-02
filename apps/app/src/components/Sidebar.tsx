import { Pressable, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, gradients, radius, spacing } from '@/theme';

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  match?: (path: string) => boolean;
};

const MAIN: NavItem[] = [
  { href: '/', label: 'Pulpit', icon: 'home', match: (p) => p === '/' },
  { href: '/journal', label: 'Dziennik', icon: 'book' },
  { href: '/progress', label: 'Progres', icon: 'stats-chart' },
  { href: '/techniques', label: 'Techniki', icon: 'school', match: (p) => p === '/techniques' },
];

const SECONDARY: NavItem[] = [
  { href: '/goals', label: 'Cele', icon: 'flag' },
  { href: '/watchlist', label: 'Do nauki', icon: 'bookmark' },
  { href: '/metrics', label: 'Waga i forma', icon: 'fitness' },
  { href: '/settings', label: 'Ustawienia', icon: 'settings' },
];

function Item({ item, active, onPress }: { item: NavItem; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        backgroundColor: active ? t.cardAlt : hovered || pressed ? t.card : 'transparent',
        borderLeftWidth: 3,
        borderLeftColor: active ? t.primary : 'transparent',
      })}
    >
      <Ionicons name={item.icon} size={18} color={active ? t.primary : t.muted} />
      <Text
        style={{
          color: active ? t.text : t.muted,
          fontWeight: active ? '700' : '500',
          fontSize: 14.5,
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

/** Boczny panel nawigacji — tylko szeroki web. */
export function Sidebar() {
  const t = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    item.match ? item.match(pathname) : pathname.startsWith(item.href);

  return (
    <View
      style={{
        width: 248,
        backgroundColor: t.bgAlt,
        borderRightWidth: 1,
        borderRightColor: t.border,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.md,
        gap: 4,
      }}
    >
      {/* logo */}
      <View style={{ paddingHorizontal: 14, paddingBottom: spacing.xl, gap: 2 }}>
        <Text style={{ color: t.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4 }}>
          DZIENNIK<Text style={{ color: t.primary }}> SW</Text>
        </Text>
        <Text style={{ color: t.faint, fontSize: 11, letterSpacing: 1.6, fontWeight: '600' }}>
          SZTUKI WALKI
        </Text>
      </View>

      {MAIN.map((item) => (
        <Item key={item.href} item={item} active={isActive(item)} onPress={() => router.push(item.href as never)} />
      ))}

      {/* CTA nagrywania */}
      <Pressable onPress={() => router.push('/record')} style={{ marginVertical: spacing.md }}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 13,
            borderRadius: radius.md,
          }}
        >
          <Ionicons name="mic" size={17} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>Nagraj trening</Text>
        </LinearGradient>
      </Pressable>

      <View style={{ height: 1, backgroundColor: t.border, marginVertical: spacing.sm }} />

      {SECONDARY.map((item) => (
        <Item key={item.href} item={item} active={isActive(item)} onPress={() => router.push(item.href as never)} />
      ))}
    </View>
  );
}
