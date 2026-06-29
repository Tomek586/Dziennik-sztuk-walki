import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@dsw/api-types';
import { ENV } from './env';

// Gdy projekt nie jest jeszcze skonfigurowany, używamy nieszkodliwych wartości
// zastępczych, aby createClient nie rzucił błędu przy starcie. Realne wywołania
// sieciowe i tak nie zadziałają, a UI pokaże instrukcję konfiguracji (ENV.isConfigured).
const url = ENV.supabaseUrl || 'http://localhost:54321';
const anonKey = ENV.supabaseAnonKey || 'public-anon-key-placeholder';

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Logowanie e-mail/hasło nie wymaga wykrywania sesji w URL (istotne na web).
    detectSessionInUrl: false,
  },
});
