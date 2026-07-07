import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, fonts, radius } from '@/theme';

/** Wjazd elementu z dołu z opóźnieniem — do kaskadowych list paneli. */
export function Rise({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(420).springify().damping(18)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Wjazd z góry — nagłówki. */
export function Drop({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(380)}>{children}</Animated.View>
  );
}

/** Mikrointerakcja: skala przy naciśnięciu (sprężynka). */
export function PressableScale({
  children,
  onPress,
  disabled,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.965, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 220 });
      }}
    >
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Animowane odliczanie liczby (RAF — działa identycznie na web i natywnie). */
export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  suffix = '',
  size = 34,
  color,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  size?: number;
  color?: string;
}) {
  const t = useTheme();
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <Text
      style={{
        color: color ?? t.text,
        fontSize: size,
        fontFamily: fonts.displayBlack,
        fontVariant: ['tabular-nums'],
        letterSpacing: 0.5,
      }}
    >
      {display.toFixed(decimals)}
      {suffix}
    </Text>
  );
}

/** Animowany pasek postępu (0..1). */
export function ProgressBar({
  progress,
  color,
  height = 8,
  delay = 150,
}: {
  progress: number;
  color?: string;
  height?: number;
  delay?: number;
}) {
  const t = useTheme();
  const width = useSharedValue(0);
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    width.value = withTiming(clamped, { duration: 700 });
  }, [clamped, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      style={{
        height,
        borderRadius: radius.full,
        backgroundColor: t.overlay,
        overflow: 'hidden',
        marginTop: 6,
      }}
    >
      <Animated.View
        style={[
          { height: '100%', borderRadius: radius.full, backgroundColor: color ?? t.primary },
          fill,
        ]}
      />
    </View>
  );
}
