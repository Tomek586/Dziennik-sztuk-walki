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
      techniques: {
        Row: {
          id: string;
          discipline_id: string;
          name_pl: string;
          name_en: string;
          slug: string;
          category: string;
          position: string | null;
          gi_context: string;
          description: string | null;
          is_official: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          discipline_id: string;
          name_pl: string;
          name_en: string;
          slug: string;
          category: string;
          position?: string | null;
          gi_context?: string;
          description?: string | null;
          is_official?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          discipline_id?: string;
          name_pl?: string;
          name_en?: string;
          slug?: string;
          category?: string;
          position?: string | null;
          gi_context?: string;
          description?: string | null;
          is_official?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'techniques_discipline_id_fkey';
            columns: ['discipline_id'];
            referencedRelation: 'disciplines';
            referencedColumns: ['id'];
          },
        ];
      };
      technique_aliases: {
        Row: {
          id: string;
          technique_id: string;
          alias: string;
          lang: string;
          // kolumna generowana w bazie (dsw_normalize) — tylko do odczytu
          normalized: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          technique_id: string;
          alias: string;
          lang?: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          technique_id?: string;
          alias?: string;
          lang?: string;
          source?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'technique_aliases_technique_id_fkey';
            columns: ['technique_id'];
            referencedRelation: 'techniques';
            referencedColumns: ['id'];
          },
        ];
      };
      technique_relations: {
        Row: {
          id: string;
          from_id: string;
          to_id: string;
          relation: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_id: string;
          to_id: string;
          relation: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_id?: string;
          to_id?: string;
          relation?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'technique_relations_from_id_fkey';
            columns: ['from_id'];
            referencedRelation: 'techniques';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'technique_relations_to_id_fkey';
            columns: ['to_id'];
            referencedRelation: 'techniques';
            referencedColumns: ['id'];
          },
        ];
      };
      session_techniques: {
        Row: {
          id: string;
          session_id: string;
          technique_id: string;
          user_id: string;
          outcome: string | null;
          reps: number | null;
          went_well: string | null;
          went_bad: string | null;
          confidence: number | null;
          source: string;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          technique_id: string;
          user_id: string;
          outcome?: string | null;
          reps?: number | null;
          went_well?: string | null;
          went_bad?: string | null;
          confidence?: number | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          technique_id?: string;
          user_id?: string;
          outcome?: string | null;
          reps?: number | null;
          went_well?: string | null;
          went_bad?: string | null;
          confidence?: number | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'session_techniques_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'training_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_techniques_technique_id_fkey';
            columns: ['technique_id'];
            referencedRelation: 'techniques';
            referencedColumns: ['id'];
          },
        ];
      };
      voice_notes: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          storage_path: string | null;
          duration_s: number | null;
          transcript: string | null;
          lang: string | null;
          status: string;
          error: string | null;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          storage_path?: string | null;
          duration_s?: number | null;
          transcript?: string | null;
          lang?: string | null;
          status?: string;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          storage_path?: string | null;
          duration_s?: number | null;
          transcript?: string | null;
          lang?: string | null;
          status?: string;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      ai_extractions: {
        Row: {
          id: string;
          voice_note_id: string | null;
          user_id: string;
          raw: Json;
          model: string | null;
          cost_cents: number | null;
          status: string;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          voice_note_id?: string | null;
          user_id: string;
          raw: Json;
          model?: string | null;
          cost_cents?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          voice_note_id?: string | null;
          user_id?: string;
          raw?: Json;
          model?: string | null;
          cost_cents?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      learning_materials: {
        Row: {
          id: string;
          technique_id: string;
          summary: string;
          key_points: Json;
          common_errors: Json;
          lang: string;
          model: string | null;
          generated_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          technique_id: string;
          summary: string;
          key_points?: Json;
          common_errors?: Json;
          lang?: string;
          model?: string | null;
          generated_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          technique_id?: string;
          summary?: string;
          key_points?: Json;
          common_errors?: Json;
          lang?: string;
          model?: string | null;
          generated_at?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      news_items: {
        Row: {
          id: string;
          url: string;
          title: string;
          summary: string | null;
          source: string;
          category: string;
          image_url: string | null;
          published_at: string | null;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          title: string;
          summary?: string | null;
          source: string;
          category?: string;
          image_url?: string | null;
          published_at?: string | null;
          fetched_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          title?: string;
          summary?: string | null;
          source?: string;
          category?: string;
          image_url?: string | null;
          published_at?: string | null;
          fetched_at?: string;
        };
        Relationships: [];
      };
      material_sources: {
        Row: {
          id: string;
          material_id: string;
          provider: string;
          external_id: string;
          url: string;
          title: string | null;
          channel: string | null;
          duration_s: number | null;
          thumbnail_url: string | null;
          rank: number;
          ai_reason: string | null;
          is_valid: boolean;
          last_checked: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          provider?: string;
          external_id: string;
          url: string;
          title?: string | null;
          channel?: string | null;
          duration_s?: number | null;
          thumbnail_url?: string | null;
          rank?: number;
          ai_reason?: string | null;
          is_valid?: boolean;
          last_checked?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          provider?: string;
          external_id?: string;
          url?: string;
          title?: string | null;
          channel?: string | null;
          duration_s?: number | null;
          thumbnail_url?: string | null;
          rank?: number;
          ai_reason?: string | null;
          is_valid?: boolean;
          last_checked?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sparring_rounds: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          round_no: number | null;
          duration_min: number | null;
          partner_label: string | null;
          partner_level: string | null;
          result: string | null;
          taps_for: number;
          taps_against: number;
          finish_technique_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          round_no?: number | null;
          duration_min?: number | null;
          partner_label?: string | null;
          partner_level?: string | null;
          result?: string | null;
          taps_for?: number;
          taps_against?: number;
          finish_technique_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          round_no?: number | null;
          duration_min?: number | null;
          partner_label?: string | null;
          partner_level?: string | null;
          result?: string | null;
          taps_for?: number;
          taps_against?: number;
          finish_technique_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      body_metrics: {
        Row: {
          id: string;
          user_id: string;
          measured_at: string;
          weight_kg: number | null;
          resting_hr: number | null;
          sleep_h: number | null;
          fatigue: number | null;
          note: string | null;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          measured_at: string;
          weight_kg?: number | null;
          resting_hr?: number | null;
          sleep_h?: number | null;
          fatigue?: number | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          measured_at?: string;
          weight_kg?: number | null;
          resting_hr?: number | null;
          sleep_h?: number | null;
          fatigue?: number | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      grades: {
        Row: {
          id: string;
          user_id: string;
          discipline_id: string;
          grade_label: string;
          awarded_at: string | null;
          awarded_by: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          discipline_id: string;
          grade_label: string;
          awarded_at?: string | null;
          awarded_by?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          discipline_id?: string;
          grade_label?: string;
          awarded_at?: string | null;
          awarded_by?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          target: Json;
          title: string | null;
          due_at: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          target?: Json;
          title?: string | null;
          due_at?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          target?: Json;
          title?: string | null;
          due_at?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      user_technique_notes: {
        Row: {
          id: string;
          user_id: string;
          technique_id: string;
          body: string;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          technique_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          technique_id?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          technique_id: string;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          technique_id: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          technique_id?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      material_feedback: {
        Row: {
          id: string;
          user_id: string;
          source_id: string;
          helpful: boolean;
          created_at: string;
          updated_at: string;
          version: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_id: string;
          helpful: boolean;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_id?: string;
          helpful?: boolean;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
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
