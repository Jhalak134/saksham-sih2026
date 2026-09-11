import { useState } from 'react';
import { useDebounce } from './useDebounce';

interface LocationResult {
  id: string;
  village: string;
  block: string;
  district: string;
  state: string;
}

export function useLocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  // TODO: wire this to actual location search API in Part 5/10
  const search = async (q: string) => {
    setLoading(true);
    // placeholder — replace with real fetch call
    setResults([]);
    setLoading(false);
  };

  return { query, setQuery, debouncedQuery, results, loading, search };
}