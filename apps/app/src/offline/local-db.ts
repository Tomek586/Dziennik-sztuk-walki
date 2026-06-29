import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Niskopoziomowy magazyn klucz-wartość (JSON) na bazie AsyncStorage.
 * Działa na web (localStorage) i natywnie. To celowo cienka warstwa za
 * abstrakcją — w v1 podmienimy ją na WatermelonDB bez zmian w warstwach wyżej.
 */
const PREFIX = 'dsw';
const k = (...parts: string[]) => [PREFIX, ...parts].join(':');

export const keys = {
  collection: (table: string) => k('collection', table),
  outbox: () => k('outbox'),
  meta: (name: string) => k('meta', name),
};

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
