import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/lib/storage';

// ─── SSR guard ────────────────────────────────────────────────────────────────

describe('storage — SSR guard (window undefined)', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    // Simulate server environment by removing window.
    // @ts-expect-error intentional deletion for SSR simulation
    delete globalThis.window;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('getStorageItem returns null on server', () => {
    expect(getStorageItem('key')).toBeNull();
  });

  it('setStorageItem does not throw on server', () => {
    expect(() => setStorageItem('key', 'value')).not.toThrow();
  });

  it('removeStorageItem does not throw on server', () => {
    expect(() => removeStorageItem('key')).not.toThrow();
  });
});

// ─── Happy path ───────────────────────────────────────────────────────────────

describe('storage — client (jsdom environment)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null for a missing key', () => {
    expect(getStorageItem('missing')).toBeNull();
  });

  it('stores and retrieves a string value', () => {
    setStorageItem('k', 'hello');
    expect(getStorageItem('k')).toBe('hello');
  });

  it('overwrites an existing key', () => {
    setStorageItem('k', 'first');
    setStorageItem('k', 'second');
    expect(getStorageItem('k')).toBe('second');
  });

  it('removes a key and returns null afterwards', () => {
    setStorageItem('k', 'exists');
    removeStorageItem('k');
    expect(getStorageItem('k')).toBeNull();
  });

  it('removeStorageItem on a non-existent key does not throw', () => {
    expect(() => removeStorageItem('ghost')).not.toThrow();
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('storage — quota / error handling', () => {
  it('getStorageItem returns null when localStorage.getItem throws', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(getStorageItem('k')).toBeNull();
    vi.restoreAllMocks();
  });

  it('setStorageItem does not throw when localStorage.setItem throws', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => setStorageItem('k', 'v')).not.toThrow();
    vi.restoreAllMocks();
  });

  it('removeStorageItem does not throw when localStorage.removeItem throws', () => {
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => removeStorageItem('k')).not.toThrow();
    vi.restoreAllMocks();
  });
});
