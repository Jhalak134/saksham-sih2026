// lib/auth.ts
'use client';

export interface AuthUser {
  email?: string;
  phone?: string;
  name?: string;
  picture?: string;
  authProvider?: 'google' | 'phone' | 'guest';
  token?: string;
}

const STORAGE_KEY_USER = 'saksham_user';

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch {
    // Fail silently
  }
}

export function clearAuthUser(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_USER);
  } catch {
    // Fail silently
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}
