/**
 * Konfiguracja środowiska klienta. Wyłącznie wartości publiczne (prefiks
 * EXPO_PUBLIC_). Sekrety serwerowe NIE trafiają do aplikacji — patrz
 * docs/11-bezpieczenstwo-prywatnosc.md.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const ENV = {
  supabaseUrl: supabaseUrl ?? '',
  supabaseAnonKey: supabaseAnonKey ?? '',
  /** czy podano dane projektu Supabase (jeśli nie — pokazujemy instrukcję) */
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
} as const;
