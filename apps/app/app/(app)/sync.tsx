import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { OutboxEntry } from '@dsw/core';
import { Banner, Button, Card, H1, H2, Muted, P, Screen } from '@/components/ui';
import { getSyncState, synchronize } from '@/offline/sync';
import { listOutbox } from '@/offline/outbox';
import { syncDisciplines } from '@/features/disciplines/repository';
import { useAuth } from '@/features/auth/auth-context';
import { ENV } from '@/lib/env';

export default function SyncScreen() {
  const { signOut } = useAuth();
  const [pending, setPending] = useState(0);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [lastPulled, setLastPulled] = useState<string | null>(null);
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const state = await getSyncState();
    setPending(state.pending);
    setLastSynced(state.lastSyncedAt);
    setLastPulled(state.lastPulledAt);
    setEntries(await listOutbox());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function onSync() {
    setBusy(true);
    setResult(null);
    try {
      await syncDisciplines();
      const r = await synchronize();
      setResult(`Wysłano: ${r.pushed} · błędy: ${r.failed} · pobrano: ${r.pulled}`);
    } catch (e) {
      setResult(`Błąd: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
      await refresh();
    }
  }

  return (
    <Screen>
      <H1>Synchronizacja</H1>

      {!ENV.isConfigured && (
        <Banner tone="warn">
          Supabase nieskonfigurowany — synchronizacja wyłączona (tryb lokalny).
        </Banner>
      )}

      <Card>
        <Muted>Stan</Muted>
        <P>Oczekujące zmiany: {pending}</P>
        <P>Ostatnia synchronizacja: {fmt(lastSynced)}</P>
        <P>Ostatnie pobranie zmian: {fmt(lastPulled)}</P>
      </Card>

      <Button
        title="Synchronizuj teraz"
        onPress={onSync}
        loading={busy}
        disabled={!ENV.isConfigured}
      />
      {result && <Banner tone="info">{result}</Banner>}

      <H2>Kolejka zmian ({entries.length})</H2>
      {entries.length === 0 ? (
        <Muted>Kolejka pusta.</Muted>
      ) : (
        entries.map((e) => (
          <Card key={e.id}>
            <P>
              {e.op.toUpperCase()} · {e.table}
            </P>
            <Muted>rekord: {e.recordId}</Muted>
            <Muted>
              próby: {e.attempts}
              {e.lastError ? ` · ostatni błąd: ${e.lastError}` : ''}
            </Muted>
          </Card>
        ))
      )}

      <View style={{ height: 8 }} />
      <Button title="Wyloguj" variant="danger" onPress={signOut} />
    </Screen>
  );
}

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('pl-PL') : '—';
}
