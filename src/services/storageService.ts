import type { StoredSession } from '../types/tailor';

const STORAGE_KEY = 'resume-tailor-session';
const SCHEMA_VERSION = 1;

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Omit<StoredSession, 'schemaVersion'>): void {
  try {
    const toStore: StoredSession = { schemaVersion: SCHEMA_VERSION, ...session };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // localStorage quota exceeded or unavailable — silently skip
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
