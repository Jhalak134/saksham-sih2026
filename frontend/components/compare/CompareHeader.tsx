// components/compare/CompareHeader.tsx
'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

interface CompareHeaderProps {
  readonly title1: string;
  readonly title2: string;
  readonly onClear: () => void;
  readonly hasComparison: boolean;
}

export function CompareHeader({
  title1,
  title2,
  onClear,
  hasComparison,
}: CompareHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Compare
        </h1>
        {hasComparison && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Clear current comparison"
          >
            <Trash2 size={14} className="text-slate-500" aria-hidden="true" />
            <span>Clear comparison</span>
          </button>
        )}
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          {title1} vs {title2}
        </h2>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
          Compare key insights to choose the right opportunity for you.
        </p>
      </div>
    </div>
  );
}
