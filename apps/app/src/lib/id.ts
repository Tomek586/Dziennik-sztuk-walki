import * as Crypto from 'expo-crypto';

/** Generator UUID działający na web i natywnie (Expo Crypto). */
export function newId(): string {
  return Crypto.randomUUID();
}

/** Bieżący znacznik czasu w ISO 8601 (UTC). */
export function nowIso(): string {
  return new Date().toISOString();
}
