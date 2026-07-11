import { Text, View } from 'react-native';
import { useTheme, fonts } from '@/theme';

/**
 * Lekkie wykresy bez zależności (czyste View) — dojo noir.
 */

const DAY_MS = 86_400_000;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Poniedziałek tygodnia danej daty (00:00 UTC-dnia lokalnego w przybliżeniu). */
function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // pn=0 … nd=6
  x.setDate(x.getDate() - dow);
  return x;
}

/**
 * Heatmapa treningów (jak na GitHubie): kolumny = tygodnie, wiersze = dni.
 * `dates` — occurred_at sesji; intensywność wg liczby treningów w dniu.
 */
export function TrainingHeatmap({ dates, weeks = 15 }: { dates: string[]; weeks?: number }) {
  const t = useTheme();
  const counts = new Map<string, number>();
  for (const iso of dates) {
    const k = dayKey(new Date(iso));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const start = mondayOf(new Date(Date.now() - (weeks - 1) * 7 * DAY_MS));
  const today = new Date();
  const cols: { key: string; count: number; future: boolean }[][] = [];
  const monthMarks: (string | null)[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const col: { key: string; count: number; future: boolean }[] = [];
    const weekStart = new Date(start.getTime() + w * 7 * DAY_MS);
    const m = weekStart.getMonth();
    monthMarks.push(m !== lastMonth ? weekStart.toLocaleDateString('pl-PL', { month: 'short' }) : null);
    lastMonth = m;
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart.getTime() + d * DAY_MS);
      const k = dayKey(day);
      col.push({ key: k, count: counts.get(k) ?? 0, future: day > today });
    }
    cols.push(col);
  }

  const cellColor = (c: number, future: boolean): string => {
    if (future) return 'transparent';
    if (c === 0) return t.bgAlt;
    if (c === 1) return '#8a2d21'; // przygaszony cynober
    return t.primary;
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {cols.map((col, i) => (
          <View key={i} style={{ gap: 3, flex: 1 }}>
            {col.map((cell) => (
              <View
                key={cell.key}
                style={{
                  aspectRatio: 1,
                  borderRadius: 3,
                  backgroundColor: cellColor(cell.count, cell.future),
                  borderWidth: cell.future ? 0 : 1,
                  borderColor: t.border,
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {monthMarks.map((m, i) => (
          <Text
            key={i}
            style={{ flex: 1, color: t.faint, fontSize: 9, fontFamily: fonts.mono }}
            numberOfLines={1}
          >
            {m ?? ''}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' }}>
        <Text style={{ color: t.faint, fontSize: 10, fontFamily: fonts.mono }}>mniej</Text>
        {[t.bgAlt, '#8a2d21', t.primary].map((c, i) => (
          <View key={i} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
        ))}
        <Text style={{ color: t.faint, fontSize: 10, fontFamily: fonts.mono }}>więcej</Text>
      </View>
    </View>
  );
}

/**
 * Trend wartości (np. wagi) jako słupki — min/max skalowane do wysokości.
 * `points` rosnąco po czasie.
 */
export function BarTrend({
  points,
  height = 90,
  suffix = '',
  color,
}: {
  points: { label: string; value: number }[];
  height?: number;
  suffix?: string;
  color?: string;
}) {
  const t = useTheme();
  if (points.length === 0) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const barColor = color ?? t.accent;
  const first = points[0];
  const last = points[points.length - 1];
  const delta = Math.round((last.value - first.value) * 10) / 10;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: t.muted, fontSize: 11, fontFamily: fonts.mono }}>
          {`${min}${suffix} – ${max}${suffix}`}
        </Text>
        <Text
          style={{
            color: delta > 0 ? t.warn : delta < 0 ? t.success : t.faint,
            fontSize: 11,
            fontFamily: fonts.mono,
          }}
        >
          {delta > 0 ? `+${delta}${suffix}` : `${delta}${suffix}`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height }}>
        {points.map((p, i) => {
          const h = 0.18 + 0.82 * ((p.value - min) / span);
          const isLast = i === points.length - 1;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
              <View
                style={{
                  width: '100%',
                  height: `${Math.round(h * 100)}%`,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  backgroundColor: isLast ? t.primary : barColor,
                  opacity: isLast ? 1 : 0.65,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: t.faint, fontSize: 10, fontFamily: fonts.mono }}>{first.label}</Text>
        <Text style={{ color: t.faint, fontSize: 10, fontFamily: fonts.mono }}>{last.label}</Text>
      </View>
    </View>
  );
}
