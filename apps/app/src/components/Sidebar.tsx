import { Pressable, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, fonts, gradients, radius, spacing } from '@/theme';

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
  { href: '/news', label: 'Newsy', icon: 'newspaper' },
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
          fontFamily: active ? fonts.bodySemi : fonts.bodyMedium,
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
      {/* brand — pieczęć hanko + TATAMI (jak na landingu) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 14,
          paddingBottom: spacing.xl,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            backgroundColor: t.primary,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: '-3deg' }],
            shadowColor: t.primary,
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <Text style={{ color: '#F2E9DA', fontSize: 22, fontFamily: fonts.display }}>畳</Text>
        </View>
        <View style={{ gap: 1 }}>
          <Text style={{ color: t.text, fontSize: 17, fontFamily: fonts.display, letterSpacing: 4 }}>
            TATAMI
          </Text>
          <Text style={{ color: t.faint, fontSize: 9.5, letterSpacing: 2, fontFamily: fonts.mono }}>
            DZIENNIK SZTUK WALKI
          </Text>
        </View>
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
          <Ionicons name="mic" size={17} color="#F2E9DA" />
          <Text
            style={{
              color: '#F2E9DA',
              fontFamily: fonts.bodySemi,
              fontSize: 13,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Nagraj trening
          </Text>
        </LinearGradient>
      </Pressable>

      <View style={{ height: 1, backgroundColor: t.border, marginVertical: spacing.sm }} />

      {SECONDARY.map((item) => (
        <Item key={item.href} item={item} active={isActive(item)} onPress={() => router.push(item.href as never)} />
      ))}
    </View>
  );
}
