import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AudioModule,
  createAudioPlayer,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioPlayer,
} from 'expo-audio';
import { Banner, Button, Card, H1, H2, Muted, P, Screen } from '@/components/ui';
import {
  addVoiceNote,
  deleteVoiceNote,
  listVoiceNotes,
  type LocalVoiceNote,
} from '@/features/voice/repository';
import { useAuth } from '@/features/auth/auth-context';
import { runExtract, uploadAndTranscribe } from '@/features/ai/repository';
import { ENV } from '@/lib/env';

function fmtDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecordScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [notes, setNotes] = useState<LocalVoiceNote[]>([]);
  const [busy, setBusy] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [procError, setProcError] = useState<string | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const refresh = useCallback(async () => {
    setNotes(await listVoiceNotes());
  }, []);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermission(status.granted);
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    })();
    return () => {
      playerRef.current?.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const start = async () => {
    if (!permission) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermission(status.granted);
      if (!status.granted) return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stop = async () => {
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      const duration = recorderState.durationMillis ?? 0;
      if (uri) {
        await addVoiceNote(uri, duration);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const play = (note: LocalVoiceNote) => {
    playerRef.current?.remove();
    const player = createAudioPlayer({ uri: note.uri });
    playerRef.current = player;
    player.play();
  };

  const onDelete = async (id: string) => {
    await deleteVoiceNote(id);
    await refresh();
  };

  const analyze = async (note: LocalVoiceNote) => {
    if (!userId || !ENV.isConfigured) {
      setProcError('Analiza AI wymaga zalogowania i połączenia z internetem.');
      return;
    }
    setProcError(null);
    setProcessingId(note.id);
    try {
      const { voiceNoteId } = await uploadAndTranscribe(
        userId,
        note.uri,
        Math.round(note.durationMs / 1000),
      );
      const { extractionId } = await runExtract({ voiceNoteId });
      router.push({ pathname: '/review', params: { id: extractionId } });
    } catch (e) {
      setProcError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Screen>
      <H1>Notatka głosowa</H1>
      <Banner tone="info">
        Nagraj relację po treningu, a „Analizuj (AI)" przepisze ją i wyciągnie techniki. Bez
        internetu nagranie zapisze się lokalnie — analizę zrobisz później.
      </Banner>
      <Button
        title="✍️ Wpisz tekstem zamiast nagrania"
        variant="ghost"
        onPress={() => router.push('/analyze')}
      />
      {procError && <Banner tone="error">{procError}</Banner>}

      {permission === false && (
        <Banner tone="warn">
          Brak zgody na mikrofon. Zezwól w ustawieniach systemu/przeglądarki, aby nagrywać.
        </Banner>
      )}

      <Card>
        <H2>{recorderState.isRecording ? 'Nagrywanie…' : 'Gotowy'}</H2>
        <P>{fmtDuration(recorderState.durationMillis ?? 0)}</P>
        {recorderState.isRecording ? (
          <Button title="■ Zatrzymaj i zapisz" variant="danger" onPress={stop} loading={busy} />
        ) : (
          <Button title="● Nagrywaj" onPress={start} />
        )}
      </Card>

      <H2>Twoje nagrania ({notes.length})</H2>
      {notes.length === 0 ? (
        <Muted>Brak nagrań.</Muted>
      ) : (
        notes.map((n) => (
          <Card key={n.id}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <P>{fmtDuration(n.durationMs)}</P>
              <Muted>{new Date(n.createdAt).toLocaleString('pl-PL')}</Muted>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button
                title="Analizuj (AI)"
                onPress={() => analyze(n)}
                loading={processingId === n.id}
              />
              <Button title="▶ Odtwórz" variant="ghost" onPress={() => play(n)} />
              <Button title="Usuń" variant="ghost" onPress={() => onDelete(n.id)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
