// lib/shell-context.tsx
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  DEFAULT_CAPITAL,
  DEFAULT_HOME_LOCATION,
  STORAGE_KEYS,
  type LanguageCode,
} from './constants';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { INITIAL_SAVED_CATEGORIES } from '@/components/saved/saved-data';
import type { CategoryRow } from './discover-types';
import { AuthProvider, AuthContext } from './auth-context';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShellContextValue {
  /** Whether the mobile drawer is open */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Persisted home location (profile setting) */
  homeLocation: string;
  setHomeLocation: (loc: string) => void;
  /** Ephemeral browsing location (filter chip / map tap) */
  browsingLocation: string;
  setBrowsingLocation: (loc: string) => void;
  /** Snap browsing location back to saved home */
  resetToHomeLocation: () => void;
  /** Whether the user is browsing away from their home location */
  isAwayFromHome: boolean;
  /** Available margin capital in rupees */
  capital: number;
  setCapital: (amt: number) => void;
  /** Number of items currently in the comparison tray */
  compareCount: number;
  setCompareCount: (n: number) => void;
  /** Active UI language */
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  /** Bookmarked / Saved categories */
  savedCategories: CategoryRow[];
  isCategorySaved: (categoryName: string) => boolean;
  toggleSaveCategory: (category: CategoryRow | string) => void;
  /** Clear all locally stored data and reset state to defaults */
  clearAllData: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ShellContext = createContext<ShellContextValue | null>(null);

// ─── Hook ────────────────────────────────────────────────────────────────────

function useShellState(): ShellContextValue {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [homeLocation, setHomeLocationState] = useState(DEFAULT_HOME_LOCATION);
  const [browsingLocation, setBrowsingLocation] = useState(DEFAULT_HOME_LOCATION);
  const [capital, setCapitalState] = useState(DEFAULT_CAPITAL);
  const [compareCount, setCompareCount] = useState(0);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [savedCategories, setSavedCategories] = useState<CategoryRow[]>(() => [
    ...INITIAL_SAVED_CATEGORIES,
  ]);

  // Hydrate client-side persisted values after initial server-client match
  useEffect(() => {
    const storedLoc = getStorageItem(STORAGE_KEYS.homeLocation);
    if (storedLoc) {
      setHomeLocationState(storedLoc);
      setBrowsingLocation(storedLoc);
    }
    const storedCap = getStorageItem(STORAGE_KEYS.capital);
    if (storedCap !== null) {
      const parsed = Number(storedCap);
      if (Number.isFinite(parsed)) {
        setCapitalState(parsed);
      }
    }
    const storedSaved = getStorageItem(STORAGE_KEYS.savedCategories);
    if (storedSaved) {
      try {
        const parsed = JSON.parse(storedSaved);
        if (Array.isArray(parsed)) {
          setSavedCategories(parsed as CategoryRow[]);
        }
      } catch {
        // Ignored
      }
    }
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const resetToHomeLocation = useCallback(
    () => setBrowsingLocation(homeLocation),
    [homeLocation]
  );

  const setHomeLocation = useCallback((loc: string) => {
    setHomeLocationState(loc);
    setBrowsingLocation(loc);
    setStorageItem(STORAGE_KEYS.homeLocation, loc);
  }, []);

  const setCapital = useCallback((amt: number) => {
    setCapitalState(amt);
    setStorageItem(STORAGE_KEYS.capital, String(amt));
  }, []);

  const isCategorySaved = useCallback(
    (categoryName: string) =>
      savedCategories.some(
        (c) => c.category.toLowerCase() === categoryName.toLowerCase()
      ),
    [savedCategories]
  );

  const toggleSaveCategory = useCallback((category: CategoryRow | string) => {
    setSavedCategories((prev) => {
      const name = typeof category === 'string' ? category : category.category;
      const exists = prev.some(
        (c) => c.category.toLowerCase() === name.toLowerCase()
      );
      let next: CategoryRow[];
      if (exists) {
        next = prev.filter(
          (c) => c.category.toLowerCase() !== name.toLowerCase()
        );
      } else {
        let toAdd: CategoryRow;
        if (typeof category !== 'string') {
          toAdd = { ...category, bookmarked: true };
        } else {
          const found = INITIAL_SAVED_CATEGORIES.find(
            (c) => c.category.toLowerCase() === name.toLowerCase()
          );
          toAdd = found
            ? { ...found, bookmarked: true }
            : {
                category: name,
                description: `${name} business opportunities.`,
                trendPercent: 15,
                direction: 'up',
                tag: 'Growing',
                withinBudget: true,
                bookmarked: true,
                sparkline: [10, 12, 14, 15],
                icon: name,
              };
        }
        next = [toAdd, ...prev];
      }
      setStorageItem(STORAGE_KEYS.savedCategories, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearAllData = useCallback(() => {
    removeStorageItem(STORAGE_KEYS.homeLocation);
    removeStorageItem(STORAGE_KEYS.capital);
    removeStorageItem(STORAGE_KEYS.savedCategories);
    removeStorageItem(STORAGE_KEYS.emailNotifications);
    removeStorageItem(STORAGE_KEYS.authToken);
    setHomeLocationState(DEFAULT_HOME_LOCATION);
    setBrowsingLocation(DEFAULT_HOME_LOCATION);
    setCapitalState(DEFAULT_CAPITAL);
    setCompareCount(0);
    setSavedCategories([]);
    setLanguage('en');
  }, []);

  return {
    drawerOpen,
    openDrawer,
    closeDrawer,
    homeLocation,
    setHomeLocation,
    browsingLocation,
    setBrowsingLocation,
    resetToHomeLocation,
    isAwayFromHome: browsingLocation !== homeLocation,
    capital,
    setCapital,
    compareCount,
    setCompareCount,
    language,
    setLanguage,
    savedCategories,
    isCategorySaved,
    toggleSaveCategory,
    clearAllData,
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ShellProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const value = useShellState();
  const existingAuth = useContext(AuthContext);

  if (existingAuth !== null) {
    return (
      <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
    );
  }

  return (
    <AuthProvider>
      <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
    </AuthProvider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (ctx === null) {
    throw new Error('useShell must be called inside <ShellProvider>');
  }
  return ctx;
}
