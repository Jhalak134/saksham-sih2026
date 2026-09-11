// components/profile/HomeLocationCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Search, X, Check } from 'lucide-react';

interface HomeLocationCardProps {
  initialLocation: string;
  onSave: (location: string) => void;
}

export function HomeLocationCard({
  initialLocation,
  onSave,
}: HomeLocationCardProps): React.JSX.Element {
  const [location, setLocation] = useState(initialLocation);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  function handleSave(): void {
    onSave(location.trim());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function handleClear(): void {
    setLocation('');
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-amber-800"
              aria-hidden="true"
            >
              <MapPin size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Home Location
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Your default location for assessments, market data and opportunities.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            aria-label="Save home location"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FACC15] px-5 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-slate-900 transition-colors hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shadow-2xs"
          >
            {saved ? (
              <>
                <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>Saved</span>
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>

        {/* Input box */}
        <div className="mt-1">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
            <Search
              size={16}
              strokeWidth={2}
              className="shrink-0 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              id="home-location-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kheragarh, Agra, Uttar Pradesh"
              aria-label="Home location search input"
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {location.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear location input"
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                <X size={15} strokeWidth={2} />
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Start typing to search for your village, town or district.
          </p>
        </div>
      </div>
    </div>
  );
}
