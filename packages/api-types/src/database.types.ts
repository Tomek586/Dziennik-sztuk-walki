/**
 * Typy bazy danych zgodne z migracjami (Etap 0).
 *
 * UWAGA: ten plik jest tymczasowo pisany ręcznie. Docelowo generujemy go z bazy:
 *   pnpm db:types        (supabase gen types typescript --local)
 * Kształt jest zgodny z konwencją @supabase/supabase-js (Row/Insert/Update).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      disciplines: {
        Row: {
          id: string;
          code: string;
          name_pl: string;
          name_en: string;
          is_grappling: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name_pl: string;
          name_en: string;
          is_grappling?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name_pl?: string;
          name_en?: string;
          is_grappling?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          units: string;
          locale: string;
          store_audio: boolean;
          ai_monthly_limit_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          units?: string;
          locale?: string;
          store_audio?: boolean;
          ai_monthly_limit_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          units?: string;
          locale?: string;
          store_audio?: boolean;
          ai_monthly_limit_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      training_sessions: {
        Row: {
          id: string;
          user_id: string;
          discipline_id: string;
          occurred_at: string;
          duration_min: number | null;
          session_type: string | null;
          location: string | null;
          intensity: number | null;
          feeling: number | null;
          notes: string | null;
          went_well: string | null;
          went_bad: string | null;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          discipline_id: string;
          occurred_at: string;
          duration_min?: number | null;
          session_type?: string | null;
          location?: string | null;
          intensity?: number | null;
          feeling?: number | null;
          notes?: string | null;
          went_well?: string | null;
          went_bad?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          discipline_id?: string;
          occurred_at?: string;
          duration_min?: number | null;
          session_type?: string | null;
          location?: string | null;
          intensity?: number | null;
          feeling?: number | null;
          notes?: string | null;
          went_well?: string | null;
          went_bad?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'training_sessions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_sessions_discipline_id_fkey';
            columns: ['discipline_id'];
            referencedRelation: 'disciplines';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

/** Skróty pomocnicze */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
