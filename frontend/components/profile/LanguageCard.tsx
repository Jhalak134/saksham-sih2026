// components/profile/LanguageCard.tsx
'use client';

import React from 'react';
import { Languages, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/constants';

interface LanguageCardProps {
  language: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
}

export function LanguageCard({
  language,
  onLanguageChange,
}: LanguageCardProps): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-amber-800"
            aria-hidden="true"
          >
            <Languages size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Language
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Choose your preferred language for the app.
            </p>
          </div>
        </div>

        {/* Dropdown select */}
        <div className="mt-1">
          <div className="relative">
            <select
              id="profile-language-select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              aria-label="Select app language"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-900 shadow-2xs transition-colors hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 cursor-pointer pr-10"
            >
              {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              strokeWidth={2}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            This will update the app language immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
