/**
 * Design system — „dojo noir" (spójny z landingiem TATAMI).
 * Paleta: tusz (czerń z ciepłym, brązowym podtonem), papier ryżowy jako tekst,
 * cynober pieczęci hanko + przygaszone złoto do wyróżnień. Typografia:
 * Shippori Mincho (nagłówki), IBM Plex Sans (tekst), IBM Plex Mono (etykiety).
 */

export const colors = {
  // tła — tusz
  bg: '#0C0A08',
  bgAlt: '#13100C',
  card: '#171310',
  cardAlt: '#1D1813',
  overlay: '#251F18',

  // tekst — papier ryżowy
  text: '#F2E9DA',
  muted: '#8A8175',
  faint: '#5D564B',

  // akcenty — cynober i złoto
  primary: '#D6402F',
  primarySoft: '#E25A44',
  accent: '#C0972F',
  orange: '#A92E21',

  // semantyczne
  success: '#8FA968',
  danger: '#D6402F',
  warn: '#C0972F',

  // obramowania — nić papieru na tuszu
  border: '#F2E9DA21',
  borderSolid: '#2A241E',
  borderActive: '#3D352B',
} as const;

/** Pary gradientów (LinearGradient). */
export const gradients = {
  primary: ['#D6402F', '#A92E21'] as const,
  gold: ['#C0972F', '#D6402F'] as const,
  panel: ['#171310', '#100D0A'] as const,
  hero: ['#1E140E', '#12100C'] as const,
};

/**
 * Rodziny fontów (ładowane w app/_layout.tsx przez expo-font).
 * Custom fonty w RN nie syntetyzują gruboścí — każda waga to osobna rodzina,
 * dlatego przy fontFamily NIE ustawiamy fontWeight.
 */
export const fonts = {
  /** Shippori Mincho — nagłówki, brand, kanji */
  display: 'ShipporiMincho_700Bold',
  displayBlack: 'ShipporiMincho_800ExtraBold',
  /** IBM Plex Sans — tekst */
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodySemi: 'IBMPlexSans_600SemiBold',
  bodyBold: 'IBMPlexSans_700Bold',
  /** IBM Plex Mono — etykiety, liczby, sygnatury */
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_700Bold',
} as const;

export const radius = { sm: 8, md: 10, lg: 14, xl: 20, full: 999 } as const;

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

/** Stały ciemny motyw — decyzja designu „dojo noir". */
export function useTheme(): Theme {
  return theme;
}
