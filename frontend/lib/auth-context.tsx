// lib/auth-context.tsx
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { UserProfile, UserProfileInput } from './api-types';
import { getUserProfile, saveUserProfile } from './api-client';
import { STORAGE_KEYS } from './constants';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  /** Currently authenticated user profile or null for guest session */
  user: UserProfile | null;
  /** True when a valid user profile is loaded */
  isAuthenticated: boolean;
  /** True when operating in anonymous guest mode */
  isGuest: boolean;
  /** True during initial session hydration or network operations */
  isLoading: boolean;
  /** Last authentication error message, if any */
  error: string | null;
  /** Authenticates by existing identifier (mobile number or email) */
  login: (identifier: string) => Promise<UserProfile>;
  /** Registers/saves user profile on the backend */
  signup: (input: UserProfileInput) => Promise<UserProfile>;
  /** Ends the active session and reverts to guest mode */
  logout: () => void;
  /** Clears the current error state */
  clearError: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hydrate authenticated user session from localStorage on mount
  useEffect(() => {
    let isMounted = true;

    async function hydrateSession(): Promise<void> {
      try {
        const storedIdentifier = getStorageItem(STORAGE_KEYS.authUser);
        if (storedIdentifier && storedIdentifier.trim()) {
          const profile = await getUserProfile(storedIdentifier.trim());
          if (isMounted) {
            setUser(profile);
          }
        }
      } catch {
        // Stored user profile no longer exists or backend is unreachable; revert to guest
        removeStorageItem(STORAGE_KEYS.authUser);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (identifier: string): Promise<UserProfile> => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      const msg = 'Please enter a valid mobile number or email.';
      setError(msg);
      throw new Error(msg);
    }

    setIsLoading(true);
    setError(null);

    try {
      const profile = await getUserProfile(cleanId);
      setUser(profile);
      setStorageItem(STORAGE_KEYS.authUser, profile.phone_or_email);
      return profile;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (input: UserProfileInput): Promise<UserProfile> => {
    const cleanId = input.phone_or_email.trim();
    if (!cleanId) {
      const msg = 'Please enter a valid mobile number or email.';
      setError(msg);
      throw new Error(msg);
    }

    setIsLoading(true);
    setError(null);

    try {
      const profile = await saveUserProfile({
        ...input,
        phone_or_email: cleanId,
      });
      setUser(profile);
      setStorageItem(STORAGE_KEYS.authUser, profile.phone_or_email);
      return profile;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create profile';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback((): void => {
    removeStorageItem(STORAGE_KEYS.authUser);
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isGuest: user === null,
      isLoading,
      error,
      login,
      signup,
      logout,
      clearError,
    }),
    [user, isLoading, error, login, signup, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Consumer Hook ───────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be called inside <AuthProvider>');
  }
  return ctx;
}
