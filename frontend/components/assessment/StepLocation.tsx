// components/assessment/StepLocation.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, MapPin, X, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDebounce } from '@/hooks/useDebounce';
import {
  searchLocations,
  formatLocation,
  type LocationResult,
} from '@/data/mockLocations';

// ─── Result list item ─────────────────────────────────────────────────────────

interface ResultItemProps {
  result: LocationResult;
  onSelect: (r: LocationResult) => void;
}

function ResultItem({ result, onSelect }: ResultItemProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left',
        'hover:bg-[var(--color-surface)] transition-colors'
      )}
    >
      <MapPin
        size={14}
        strokeWidth={2}
        className="mt-0.5 shrink-0 text-[var(--color-text-muted)]"
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-medium text-[var(--color-text-dark)]">
          {result.village}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {result.block} Block · {result.district} · {result.state}
        </p>
      </div>
    </button>
  );
}

// ─── Selected chip ────────────────────────────────────────────────────────────

interface SelectedChipProps {
  display: string;
  onClear: () => void;
}

function SelectedChip({ display, onClear }: SelectedChipProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--color-primary)] bg-[#FEF3C7] px-3 py-2">
      <MapPin
        size={14}
        strokeWidth={2}
        className="shrink-0 text-[var(--color-text-dark)]"
        aria-hidden="true"
      />
      <span className="flex-1 text-sm font-medium text-[var(--color-text-dark)]">
        {display}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${display}`}
        className="rounded p-0.5 hover:bg-[var(--color-primary-dark)]/20 transition-colors"
      >
        <X size={14} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── StepLocation ─────────────────────────────────────────────────────────────

interface StepLocationProps {
  locationId: string;
  locationDisplay: string;
  onSelect: (id: string, display: string) => void;
  onContinue: () => void;
}

export function StepLocation({
  locationId,
  locationDisplay,
  onSelect,
  onContinue,
}: StepLocationProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const debouncedQuery = useDebounce(query, 300);
  const hasSelection = locationId.length > 0;

  useEffect(() => {
    const found = searchLocations(debouncedQuery);
    setResults(found);
  }, [debouncedQuery]);

  function handleSelect(r: LocationResult): void {
    onSelect(r.id, formatLocation(r));
    setQuery('');
    setResults([]);
  }

  function handleClear(): void {
    onSelect('', '');
    setQuery('');
    setResults([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-dark)]">
            Your location
          </p>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Search by village, block, or district.
          </p>
        </div>

        {hasSelection ? (
          <SelectedChip display={locationDisplay} onClear={handleClear} />
        ) : (
          <div className="relative">
            <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 transition-colors">
              <Search
                size={16}
                strokeWidth={2}
                className="shrink-0 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search village, block or district..."
                className="flex-1 bg-transparent text-sm text-[var(--color-text-dark)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                aria-label="Search for your location"
                aria-controls="location-results"
                aria-expanded={results.length > 0}
                role="combobox"
                aria-autocomplete="list"
              />
            </div>

            {results.length > 0 && (
              <ul
                id="location-results"
                role="listbox"
                aria-label="Location suggestions"
                className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-md"
              >
                {results.map((r) => (
                  <li key={r.id} role="option" aria-selected={false}>
                    <ResultItem result={r} onSelect={handleSelect} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        disabled={!hasSelection}
        className={cn(
          'flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-6 py-3.5 sm:py-3 text-sm font-semibold',
          'transition-colors disabled:cursor-not-allowed disabled:opacity-40',
          hasSelection
            ? 'bg-[var(--color-primary)] text-[var(--color-text-dark)] hover:bg-[var(--color-primary-dark)]'
            : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
        )}
        aria-disabled={!hasSelection}
      >
        Continue
        <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
