import type { TechniqueOutcome, TrainingSessionInput } from '@dsw/core';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/id';
import * as collection from '@/offline/collection';
import { enqueue } from '@/offline/outbox';
import {
  createSession,
  createSparringRound,
  type SessionTechniqueDraft,
  type SparringDraft,
} from '@/features/sessions/repository';

export interface ExtractedTechnique {
  technique_id: string | null;
  name_pl: string;
  name_en: string | null;
  raw_text: string;
  outcome: TechniqueOutcome | null;
  went_well: string | null;
  went_bad: string | null;
  confidence: number;
  needs_review: boolean;
}

export interface ExtractedSparring {
  rounds?: number | null;
  result?: string | null;
  taps_for?: number | null;
  taps_against?: number | null;
  notes?: string | null;
}

export interface ExtractionRaw {
  session: {
    session_type?: string | null;
    duration_min?: number | null;
    intensity?: number | null;
    feeling?: number | null;
    summary?: string;
  };
  techniques: ExtractedTechnique[];
  sparring: ExtractedSparring[];
}

const T_EXT_LOCAL = 'ai_extractions_local';
const T_VOICE = 'voice_notes';
type ExtractionCache = {
  id: string;
  raw: ExtractionRaw;
  voiceNoteId?: string | null;
  transcript?: string | null;
};

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw new Error(error.message);
  const payload = data as { error?: string } & T;
  if (payload?.error) throw new Error(payload.error);
  return data as T;
}

/** Upload nagrania do Storage, utworzenie voice_note i transkrypcja. */
export async function uploadAndTranscribe(
  userId: string,
  uri: string,
  durationS: number,
): Promise<{ voiceNoteId: string; transcript: string }> {
  const voiceNoteId = newId();
  const path = `${userId}/${voiceNoteId}.m4a`;
  const blob = (await fetch(uri).then((r) => r.blob())) as Blob;

  const up = await supabase.storage
    .from('voice-notes')
    .upload(path, blob, { contentType: 'audio/m4a', upsert: true });
  if (up.error) throw new Error(up.error.message);

  const ins = await supabase.from('voice_notes').insert({
    id: voiceNoteId,
    user_id: userId,
    storage_path: path,
    duration_s: durationS,
    status: 'uploaded',
  });
  if (ins.error) throw new Error(ins.error.message);

  const res = await invoke<{ transcript: string }>('transcribe', { voice_note_id: voiceNoteId });
  return { voiceNoteId, transcript: res.transcript };
}

export async function runExtract(input: {
  voiceNoteId?: string;
  text?: string;
  userId?: string;
  /** transkrypcja do lokalnego podglądu (ścieżka głosowa przekazuje ją tutaj) */
  transcript?: string;
}): Promise<{ extractionId: string; raw: ExtractionRaw }> {
  let voiceNoteId = input.voiceNoteId ?? null;
  let transcript = input.transcript ?? input.text ?? null;

  // Ścieżka tekstowa: zapisz oryginalny tekst jako notatkę (voice_note bez audio),
  // żeby dało się ją potem powiązać z treningiem i podejrzeć w szczegółach.
  if (!voiceNoteId && input.text && input.userId) {
    const id = newId();
    const ins = await supabase.from('voice_notes').insert({
      id,
      user_id: input.userId,
      storage_path: null,
      transcript: input.text,
      status: 'transcribed',
    });
    if (!ins.error) voiceNoteId = id;
  }

  const res = await invoke<{ extraction_id: string; raw: ExtractionRaw }>('extract', {
    voice_note_id: voiceNoteId ?? undefined,
    text: voiceNoteId ? undefined : input.text,
  });
  await collection.upsertOne<ExtractionCache>(T_EXT_LOCAL, {
    id: res.extraction_id,
    raw: res.raw,
    voiceNoteId,
    transcript,
  });
  return { extractionId: res.extraction_id, raw: res.raw };
}

/** Oryginalna transkrypcja/tekst dla ekstrakcji (z lokalnego cache). */
export async function getExtractionTranscript(id: string): Promise<string | null> {
  const local = await collection.getById<ExtractionCache>(T_EXT_LOCAL, id);
  return local?.transcript ?? null;
}

export async function getExtraction(id: string): Promise<ExtractionRaw | null> {
  const local = await collection.getById<ExtractionCache>(T_EXT_LOCAL, id);
  if (local) return local.raw;
  const { data } = await supabase.from('ai_extractions').select('raw').eq('id', id).maybeSingle();
  return (data?.raw as ExtractionRaw | undefined) ?? null;
}

/** Zapis zaakceptowanej ekstrakcji jako trening + techniki + sparingi. */
export async function applyExtraction(
  userId: string,
  extractionId: string,
  sessionInput: TrainingSessionInput,
  techniques: SessionTechniqueDraft[],
  sparring: SparringDraft[],
): Promise<void> {
  const session = await createSession(userId, sessionInput, techniques);
  for (const s of sparring) await createSparringRound(userId, session.id, s);

  // Powiąż notatkę źródłową (głosową/tekstową) z utworzonym treningiem —
  // lokalnie od razu (podgląd offline) + przez outbox na serwer.
  const cached = await collection.getById<ExtractionCache>(T_EXT_LOCAL, extractionId);
  if (cached?.voiceNoteId) {
    const existing = await collection.getById<{ id: string } & Record<string, unknown>>(
      T_VOICE,
      cached.voiceNoteId,
    );
    await collection.upsertOne(T_VOICE, {
      id: cached.voiceNoteId,
      user_id: userId,
      transcript: cached.transcript ?? null,
      storage_path: null,
      status: 'extracted',
      duration_s: null,
      lang: 'pl',
      error: null,
      created_at: session.created_at,
      updated_at: session.updated_at,
      version: 1,
      deleted_at: null,
      ...(existing ?? {}),
      session_id: session.id,
    });
    await enqueue(T_VOICE, 'update', cached.voiceNoteId, { session_id: session.id });
  }

  try {
    await supabase.from('ai_extractions').update({ status: 'applied' }).eq('id', extractionId);
  } catch {
    // best-effort — offline/limit; nie blokuje zapisu
  }
  await collection.removeOne(T_EXT_LOCAL, extractionId);
}

/** Notatka źródłowa treningu (transkrypcja + ewentualne audio). */
export interface SessionNote {
  id: string;
  transcript: string | null;
  storagePath: string | null;
  durationS: number | null;
}

export async function getSessionNote(sessionId: string): Promise<SessionNote | null> {
  type VoiceRow = {
    id: string;
    session_id: string | null;
    transcript: string | null;
    storage_path: string | null;
    duration_s: number | null;
    deleted_at: string | null;
  };
  const local = (await collection.getAll<VoiceRow & { id: string }>(T_VOICE)).find(
    (r) => r.session_id === sessionId && r.deleted_at == null,
  );
  let row: VoiceRow | undefined = local;
  // lokalny wpis bywa niepełny (np. brak storage_path tuż po zapisie) — dociągnij z serwera
  if (!row || (row.storage_path == null && row.transcript == null)) {
    const { data } = await supabase
      .from('voice_notes')
      .select('id, session_id, transcript, storage_path, duration_s, deleted_at')
      .eq('session_id', sessionId)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();
    if (data) row = data as VoiceRow;
  }
  if (!row) return null;
  return {
    id: row.id,
    transcript: row.transcript,
    storagePath: row.storage_path,
    durationS: row.duration_s,
  };
}

/** Krótkotrwały podpisany URL do odtworzenia nagrania z prywatnego bucketu. */
export async function getAudioUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('voice-notes')
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'brak dostępu do nagrania');
  return data.signedUrl;
}

export interface MaterialSource {
  id: string;
  url: string;
  title: string | null;
  channel: string | null;
  duration_s: number | null;
  ai_reason: string | null;
}
export interface MaterialData {
  material: { summary: string; key_points: string[]; common_errors: string[] } | null;
  sources: MaterialSource[];
}

export async function fetchMaterials(
  techniqueId: string,
  forceRefresh = false,
): Promise<MaterialData> {
  const res = await invoke<{ material: MaterialData['material']; sources: MaterialSource[] }>(
    'materials',
    { technique_id: techniqueId, lang: 'pl', force_refresh: forceRefresh },
  );
  return { material: res.material ?? null, sources: res.sources ?? [] };
}
