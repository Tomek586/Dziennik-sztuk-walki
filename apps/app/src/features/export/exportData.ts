import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as collection from '@/offline/collection';

const TABLES = [
  'training_sessions',
  'session_techniques',
  'sparring_rounds',
  'body_metrics',
  'grades',
  'goals',
  'user_technique_notes',
  'watchlist',
  'voice_notes',
];

export async function buildExportJson(): Promise<string> {
  const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), app: 'dsw' };
  for (const table of TABLES) {
    data[table] = await collection.getAll(table);
  }
  return JSON.stringify(data, null, 2);
}

/** Eksport danych do pliku JSON (web: pobranie; natywnie: udostępnienie). */
export async function exportData(): Promise<void> {
  const json = await buildExportJson();
  const filename = `dziennik-eksport-${Date.now()}.json`;

  if (Platform.OS === 'web') {
    const g = globalThis as unknown as {
      Blob: typeof Blob;
      URL: typeof URL;
      document: Document;
    };
    const blob = new g.Blob([json], { type: 'application/json' });
    const url = g.URL.createObjectURL(blob);
    const anchor = g.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    g.URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, filename);
  file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Eksport dziennika',
    });
  }
}
