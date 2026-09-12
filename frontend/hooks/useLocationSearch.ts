import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { searchLocations } from '@/lib/api-client';
import type { VillageLocation } from '@/lib/api-types';

export interface LocationSearchState {
  query: string;
  setQuery: (q: string) => void;
  debouncedQuery: string;
  results: VillageLocation[];
  loading: boolean;
  error: string | null;
  search: (q: string) => Promise<void>;
  clear: () => void;
}

export function useLocationSearch(debounceMs: number = 300): LocationSearchState {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VillageLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, debounceMs);
  const activeRequestRef = useRef<number>(0);

  const search = useCallback(async (q: string) => {
    const cleanQ = q.trim();
    if (!cleanQ) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = ++activeRequestRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = await searchLocations(cleanQ);
      if (requestId === activeRequestRef.current) {
        setResults(data);
        setLoading(false);
      }
    } catch (err: unknown) {
      if (requestId === activeRequestRef.current) {
        setResults([]);
        setLoading(false);
        const msg = err instanceof Error ? err.message : 'Location search failed';
        setError(msg);
      }
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  const clear = useCallback(() => {
    activeRequestRef.current++;
    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  return { query, setQuery, debouncedQuery, results, loading, error, search, clear };
}
