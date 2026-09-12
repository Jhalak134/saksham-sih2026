// components/compare/CompareAssessmentView.tsx
'use client';

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { CompareAssessmentCard } from './CompareAssessmentCard';
import type { BackendAssessmentResponse, AssessmentHistoryItem } from '@/lib/api-types';

interface CompareAssessmentViewProps {
  readonly history: readonly AssessmentHistoryItem[];
  readonly selectedIds: readonly [number, number];
  readonly assessment1: BackendAssessmentResponse;
  readonly assessment2: BackendAssessmentResponse;
  readonly onSelectId: (slot: 0 | 1, id: number) => void;
}

export function CompareAssessmentView({
  history,
  selectedIds,
  assessment1,
  assessment2,
  onSelectId,
}: CompareAssessmentViewProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Assessment Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <ArrowLeftRight size={16} className="text-amber-600 shrink-0" />
          <span>Select Reports to Compare:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 sm:max-w-2xl">
          {/* Slot 0 Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Report A:</span>
            <select
              value={selectedIds[0]}
              onChange={(e) => onSelectId(0, Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Select first assessment to compare"
            >
              {history.map((item) => (
                <option key={`a-${item.id}`} value={item.id}>
                  #{item.id} • {item.village_name} ({item.category_name}) — Score {item.fit_score}
                </option>
              ))}
            </select>
          </div>

          {/* Slot 1 Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Report B:</span>
            <select
              value={selectedIds[1]}
              onChange={(e) => onSelectId(1, Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Select second assessment to compare"
            >
              {history.map((item) => (
                <option key={`b-${item.id}`} value={item.id}>
                  #{item.id} • {item.village_name} ({item.category_name}) — Score {item.fit_score}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
        <CompareAssessmentCard assessment={assessment1} />
        <CompareAssessmentCard assessment={assessment2} />
      </div>

      {/* Provenance and Integrity Banner */}
      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-center text-xs text-slate-500">
        All financial, EMI, and feasibility scores are authoritative outputs persisted by the SAKSHAM Backend Engine.
        Village demographics are calibrated against Census 2011 baseline data.
      </div>
    </div>
  );
}
