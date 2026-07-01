import type { TechniqueOutcome, TrainingSessionInput } from '@dsw/core';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/id';
import * as collection from '@/offline/collection';
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
type ExtractionCache = { id: string; raw: ExtractionRaw };

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
}): Promise<{ extractionId: string; raw: ExtractionRaw }> {
  const res = await invoke<{ extraction_id: string; raw: ExtractionRaw }>('extract', {
    voice_note_id: input.voiceNoteId,
    text: input.text,
  });
  await collection.upsertOne<ExtractionCache>(T_EXT_LOCAL, { id: res.extraction_id, raw: res.raw });
  return { extractionId: res.extraction_id, raw: res.raw };
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
  try {
    await supabase.from('ai_extractions').update({ status: 'applied' }).eq('id', extractionId);
  } catch {
    // best-effort — offline/limit; nie blokuje zapisu
  }
  await collection.removeOne(T_EXT_LOCAL, extractionId);
}

export interface MaterialSource {
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
