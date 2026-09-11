// components/assessment/StepLocation.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, MapPin, X, Search, AlertCircle, CheckCircle2, Sparkles, Edit2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDebounce } from '@/hooks/useDebounce';
import {
  searchLocations,
  formatLocation,
  isMathuraLocation,
  POPULAR_MATHURA_PILOT_LOCATIONS,
  type LocationResult,
} from '@/data/mockLocations';

// ─── Result list item ─────────────────────────────────────────────────────────

interface ResultItemProps {
  result: LocationResult;
  onSelect: (r: LocationResult) => void;
}

function ResultItem({ result, onSelect }: ResultItemProps): React.JSX.Element {
  const isPilot = isMathuraLocation(result);

  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className={cn(
        'flex w-full items-start justify-between gap-3 px-4 py-3 text-left',
        'hover:bg-[var(--color-surface)] transition-colors'
      )}
    >
      <div className="flex items-start gap-3">
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
      </div>
      {isPilot ? (
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
          Pilot Area
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          Coming Soon
        </span>
      )}
    </button>
  );
}

// ─── Selected chip ────────────────────────────────────────────────────────────

interface SelectedChipProps {
  display: string;
  isPilot: boolean;
  onChange?: () => void;
  onClear: () => void;
}

function SelectedChip({ display, isPilot, onChange, onClear }: SelectedChipProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border px-3.5 py-3 transition-colors shadow-2xs',
        isPilot
          ? 'border-emerald-300 bg-emerald-50/70'
          : 'border-amber-300 bg-amber-50/70'
      )}
    >
      <MapPin
        size={18}
        strokeWidth={2}
        className={cn('shrink-0', isPilot ? 'text-emerald-700' : 'text-amber-700')}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-[var(--color-text-dark)] block truncate">
          {display}
        </span>
        <span className="text-[11px] text-slate-500 block">
          {isPilot ? 'Selected pilot location' : 'Saved location'}
        </span>
      </div>
      <button
        type="button"
        onClick={onChange || onClear}
        className={cn(
          'text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95',
          isPilot
            ? 'text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300/80'
            : 'text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200/80 border border-amber-300'
        )}
      >
        <Edit2 size={12} strokeWidth={2.5} />
        <span>Change</span>
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${display}`}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 transition-colors cursor-pointer active:scale-95"
      >
        <X size={16} strokeWidth={2.5} aria-hidden="true" />
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
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const hasSelection = locationId.length > 0;
  const isPilot = hasSelection && isMathuraLocation(locationDisplay || locationId);

  useEffect(() => {
    let active = true;
    const localMatches = searchLocations(debouncedQuery);
    setResults(localMatches);

    // Also query backend /api/v1/locations to search from the 874 villages when available
    if (debouncedQuery.trim().length >= 2) {
      fetch(`/api/v1/locations?q=${encodeURIComponent(debouncedQuery.trim())}&limit=10`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!active || !Array.isArray(data) || data.length === 0) return;
          const remoteResults: LocationResult[] = data.map((item: any) => ({
            id: `loc_v_${item.id}`,
            village: item.name,
            block: item.block_name || 'Mathura',
            district: item.district_name || 'Mathura',
            state: item.state_name || 'Uttar Pradesh',
          }));

          setResults((prev) => {
            const existingNames = new Set(prev.map((p) => p.village.toLowerCase()));
            const newOnes = remoteResults.filter((r) => !existingNames.has(r.village.toLowerCase()));
            return [...prev, ...newOnes];
          });
        })
        .catch(() => {
          // Ignore network errors, fallback gracefully to local matches
        });
    }

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  function handleChangeLocation(): void {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  function handleClear(): void {
    onSelect('', '');
    setQuery('');
    setResults([]);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  function handleSelect(r: LocationResult): void {
    onSelect(r.id, formatLocation(r));
    setQuery('');
    setResults([]);
    setIsEditing(false);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        {/* Title and Pilot indicator */}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-dark)]">
              Select Your Location
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 border border-amber-200">
              <Sparkles size={12} className="text-amber-700" />
              Pilot Active: Mathura
            </span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
            SAKSHAM localized market intelligence is currently calibrated for villages & blocks across Mathura District.
          </p>
        </div>

        {hasSelection && !isEditing ? (
          <div className="mt-5 flex flex-col gap-3.5">
            <SelectedChip
              display={locationDisplay}
              isPilot={isPilot}
              onChange={handleChangeLocation}
              onClear={handleClear}
            />

            {isPilot ? (
              <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs sm:text-sm text-emerald-800 font-medium">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>Active Pilot Region verified — comprehensive hyper-local dataset ready.</span>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      Pilot Region Boundary Notice
                    </p>
                    <p className="mt-1 text-amber-800 text-xs sm:text-sm leading-relaxed">
                      We are sorry, assessments are currently active exclusively in <strong>Mathura district</strong> (Pilot Region). Full coverage for <strong>{locationDisplay}</strong> is coming soon!
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-amber-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-amber-900 text-xs">
                      Try one of our active pilot locations to explore the assessment:
                    </p>
                    <button
                      type="button"
                      onClick={handleChangeLocation}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 cursor-pointer"
                    >
                      Search other villages
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_MATHURA_PILOT_LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelect(loc)}
                        className="rounded-lg bg-white border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-colors cursor-pointer"
                      >
                        {loc.village}, {loc.district}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-5">
            {hasSelection && isEditing && (
              <div className="flex items-center justify-between pb-1 text-xs text-slate-500">
                <span>
                  Currently selected: <strong className="text-slate-800">{locationDisplay}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="font-medium text-emerald-700 hover:text-emerald-900 cursor-pointer hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Search Input Box */}
            <div className="relative">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-slate-50/50 hover:bg-white px-3.5 py-3 sm:py-3.5 focus-within:bg-white focus-within:border-[var(--color-primary)] focus-within:ring-3 focus-within:ring-[var(--color-primary)]/20 transition-all shadow-2xs">
                <Search
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 text-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search village, block or district (e.g. Vrindavan, Mathura)..."
                  className="flex-1 bg-transparent text-sm sm:text-base text-[var(--color-text-dark)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                  aria-label="Search for your location"
                  aria-controls="location-results"
                  aria-expanded={results.length > 0}
                  role="combobox"
                  aria-autocomplete="list"
                  autoFocus={isEditing}
                />
              </div>

              {results.length > 0 && (
                <ul
                  id="location-results"
                  role="listbox"
                  aria-label="Location suggestions"
                  className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-lg max-h-60 overflow-y-auto"
                >
                  {results.map((r) => (
                    <li key={r.id} role="option" aria-selected={false}>
                      <ResultItem result={r} onSelect={handleSelect} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick-select chips for popular Mathura pilot areas */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Quick Select Pilot Areas (Mathura):
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_MATHURA_PILOT_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:border-[var(--color-primary)] hover:bg-amber-50/60 hover:text-amber-950 shadow-2xs transition-all cursor-pointer active:scale-95"
                  >
                    <MapPin size={13} className="text-amber-600" />
                    <span>{loc.village}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pilot context helper banner */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs text-slate-600 flex items-start gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-800 shrink-0">
                <MapPin size={16} />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">Hyper-Local Intelligence Ready</p>
                <p className="mt-0.5 text-slate-500 leading-relaxed">
                  Search by village name or click a pilot area above to automatically calibrate market demand, demographics, and eligible schemes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={onContinue}
          disabled={!hasSelection || !isPilot}
          className={cn(
            'flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm sm:text-base font-semibold',
            'transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-xs',
            hasSelection && isPilot
              ? 'bg-[var(--color-primary)] text-[var(--color-text-dark)] hover:bg-[var(--color-primary-dark)] active:scale-[0.99]'
              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
          )}
          aria-disabled={!hasSelection || !isPilot}
        >
          <span>{hasSelection && !isPilot ? 'Select a Mathura Location to Proceed' : 'Continue to Business Idea'}</span>
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
