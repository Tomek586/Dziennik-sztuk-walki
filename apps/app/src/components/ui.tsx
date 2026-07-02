import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, gradients, radius, spacing } from '@/theme';
import { PressableScale } from './animated';

/** Ekran z przewijaniem; na szerokim web treść jest wyśrodkowana (max 1080). */
export function Screen({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: 1080, alignSelf: 'center', gap: spacing.lg }}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function H1({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 }}>
      {children}
    </Text>
  );
}

export function H2({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 }}>
      {children}
    </Text>
  );
}

export function P({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<TextStyle>;
}) {
  const t = useTheme();
  return (
    <Text onPress={onPress} style={[{ color: t.text, fontSize: 15, lineHeight: 22 }, style]}>
      {children}
    </Text>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <Text
      style={{
        color: t.muted,
        fontSize: 12.5,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        fontWeight: '600',
      }}
    >
      {children}
    </Text>
  );
}

/** Panel — podstawowy budulec układu. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Panel z gradientowym tłem — sekcje hero / wyróżnione. */
export function HeroPanel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: t.border,
          padding: spacing.xl,
          gap: spacing.md,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}) {
  const t = useTheme();
  const isOff = disabled || loading;

  const inner = (
    <View style={{ paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' }}>
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? t.text : '#FFFFFF'} />
      ) : (
        <Text
          style={{
            color: variant === 'ghost' ? t.text : '#FFFFFF',
            fontWeight: '700',
            fontSize: 15.5,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Text>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <PressableScale onPress={onPress} disabled={isOff} style={{ opacity: isOff ? 0.5 : 1 }}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: radius.md,
            shadowColor: t.primary,
            shadowOpacity: 0.45,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 5 },
            elevation: 6,
          }}
        >
          {inner}
        </LinearGradient>
      </PressableScale>
    );
  }

  const bg = variant === 'danger' ? t.danger : 'transparent';
  return (
    <PressableScale onPress={onPress} disabled={isOff} style={{ opacity: isOff ? 0.5 : 1 }}>
      <View
        style={{
          backgroundColor: bg,
          borderColor: variant === 'ghost' ? t.borderActive : bg,
          borderWidth: 1,
          borderRadius: radius.md,
        }}
      >
        {inner}
      </View>
    </PressableScale>
  );
}

export function TextField({ label, ...props }: { label: string } & TextInputProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Muted>{label}</Muted>
      <TextInput
        placeholderTextColor={t.faint}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: t.bgAlt,
          color: t.text,
          borderColor: focused ? t.primary : t.border,
          borderWidth: 1.5,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 13,
          fontSize: 16,
        }}
        {...props}
      />
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  if (selected) {
    return (
      <PressableScale onPress={onPress}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 15, paddingVertical: 9, borderRadius: radius.full }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 }}>{label}</Text>
        </LinearGradient>
      </PressableScale>
    );
  }
  return (
    <PressableScale onPress={onPress}>
      <View
        style={{
          paddingHorizontal: 15,
          paddingVertical: 9,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: t.borderActive,
          backgroundColor: t.card,
        }}
      >
        <Text style={{ color: t.text, fontWeight: '600', fontSize: 13.5 }}>{label}</Text>
      </View>
    </PressableScale>
  );
}

export function Banner({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'warn' | 'error';
}) {
  const t = useTheme();
  const color = tone === 'error' ? t.danger : tone === 'warn' ? t.warn : t.muted;
  return (
    <View
      style={{
        borderLeftWidth: 3,
        borderLeftColor: color,
        backgroundColor: t.cardAlt,
        borderRadius: radius.sm,
        padding: spacing.md,
      }}
    >
      <Text style={{ color: t.text, fontSize: 13.5, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

/** Karta statystyki: etykieta + duża liczba. */
export function StatCard({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          flex: 1,
          minWidth: 130,
          backgroundColor: t.card,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: 4,
        },
        style,
      ]}
    >
      <Muted>{label}</Muted>
      {children}
    </View>
  );
}

/** Klikalny wiersz-link ze strzałką. */
export function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: t.primary, fontSize: 16, fontWeight: '800' }}>→</Text>
    </Pressable>
  );
}

export function Splash() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={t.primary} size="large" />
    </View>
  );
}
