/**
 * Design system — „dark premium sport" (stały ciemny motyw).
 * Paleta: głęboka czerń z niebieskim podtonem, czerwień bojowa + złoto/pomarańcz
 * do gradientów i wyróżnień. Duża typografia statystyk, subtelne obramowania.
 */

export const colors = {
  // tła
  bg: '#0A0B0F',
  bgAlt: '#0E1118',
  card: '#12151D',
  cardAlt: '#171B25',
  overlay: '#1C2130',

  // tekst
  text: '#F2F4F8',
  muted: '#8B95A7',
  faint: '#5B6473',

  // akcenty
  primary: '#E8253C',
  primarySoft: '#FF4D5E',
  accent: '#F5A524',
  orange: '#FF6B35',

  // semantyczne
  success: '#2FD575',
  danger: '#FF5C5C',
  warn: '#F5A524',

  // obramowania
  border: '#20263323',
  borderSolid: '#222938',
  borderActive: '#3A4356',
} as const;

/** Pary gradientów (LinearGradient). */
export const gradients = {
  primary: ['#E8253C', '#FF6B35'] as const,
  gold: ['#F5A524', '#FF6B35'] as const,
  panel: ['#161A24', '#10131B'] as const,
  hero: ['#1A0E12', '#12151D'] as const,
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, full: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export type Theme = {
  bg: string;
  bgAlt: string;
  card: string;
  cardAlt: string;
  overlay: string;
  text: string;
  muted: string;
  faint: string;
  primary: string;
  primarySoft: string;
  accent: string;
  orange: string;
  success: string;
  danger: string;
  warn: string;
  border: string;
  borderActive: string;
};

const theme: Theme = {
  bg: colors.bg,
  bgAlt: colors.bgAlt,
  card: colors.card,
  cardAlt: colors.cardAlt,
  overlay: colors.overlay,
  text: colors.text,
  muted: colors.muted,
  faint: colors.faint,
  primary: colors.primary,
  primarySoft: colors.primarySoft,
  accent: colors.accent,
  orange: colors.orange,
  success: colors.success,
  danger: colors.danger,
  warn: colors.warn,
  border: colors.borderSolid,
  borderActive: colors.borderActive,
};

/** Stały ciemny motyw — decyzja designu „dark premium sport". */
export function useTheme(): Theme {
  return theme;
}
