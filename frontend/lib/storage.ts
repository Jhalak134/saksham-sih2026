// lib/storage.ts
// Typed localStorage helpers with SSR guard.
// All functions return null on server or when key is absent.

const isClient = typeof window !== 'undefined';

export function getStorageItem(key: string): string | null {
  if (!isClient) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key: string, value: string): void {
  if (!isClient) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage quota exceeded or private mode — fail silently.
  }
}

export function removeStorageItem(key: string): void {
  if (!isClient) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Fail silently.
  }
}
