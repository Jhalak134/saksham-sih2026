// components/compare/CompareHeader.tsx
'use client';

import React from 'react';
import { Trash2, Sparkles, FileText } from 'lucide-react';

interface CompareHeaderProps {
  readonly title1: string;
  readonly title2: string;
  readonly onClear: () => void;
  readonly hasComparison: boolean;
  readonly mode?: 'opportunities' | 'assessments';
  readonly onModeChange?: (mode: 'opportunities' | 'assessments') => void;
  readonly assessmentCount?: number;
}

export function CompareHeader({
  title1,
  title2,
  onClear,
  hasComparison,
  mode = 'opportunities',
  onModeChange,
  assessmentCount,
}: CompareHeaderProps): React.JSX.Element {
  const isAssessments = mode === 'assessments';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Compare
          </h1>

          {/* Mode Switcher Tabs */}
          {onModeChange && (
            <div
              className="inline-flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold text-slate-700"
              role="tablist"
              aria-label="Comparison Mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isAssessments}
                onClick={() => onModeChange('opportunities')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  !isAssessments
                    ? 'bg-white text-slate-950 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={13} className={!isAssessments ? 'text-amber-600' : 'text-slate-400'} />
                <span>Opportunities</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={isAssessments}
                onClick={() => onModeChange('assessments')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  isAssessments
                    ? 'bg-white text-slate-950 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={13} className={isAssessments ? 'text-amber-600' : 'text-slate-400'} />
                <span>Past Assessments</span>
                {assessmentCount !== undefined && assessmentCount > 0 && (
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
                    {assessmentCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {hasComparison && (
          <button
            type="button"
            onClick={onClear}
            className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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
          {isAssessments
            ? 'Compare authoritative financial, feasibility, and risk profiles side-by-side.'
            : 'Compare key insights to choose the right opportunity for you.'}
        </p>
      </div>
    </div>
  );
}
