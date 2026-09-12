// components/reports/ReportFilters.tsx
// Filter & sort controls for My Reports matching mockups.

'use client';

import React from 'react';
import { ArrowUpDown, Filter } from 'lucide-react';
import type { AssessmentStatus } from '@/data/reportsData';
import { cn } from '@/lib/cn';

export type SortOption = 'date-desc' | 'fit-desc' | 'profit-desc';
export type FitFilterOption = 'all' | 'high' | 'moderate';

interface ReportFiltersProps {
  readonly selectedStatus: AssessmentStatus | 'All';
  readonly onStatusChange: (status: AssessmentStatus | 'All') => void;
  readonly statusCounts: Record<AssessmentStatus | 'All', number>;
  readonly sortOption: SortOption;
  readonly onSortChange: (sort: SortOption) => void;
  readonly fitFilter: FitFilterOption;
  readonly onFitFilterChange: (fit: FitFilterOption) => void;
}

const STATUS_TABS: readonly (AssessmentStatus | 'All')[] = [
  'All',
  'In Progress',
  'Completed',
];

export function ReportFilters({
  selectedStatus,
  onStatusChange,
  statusCounts,
  sortOption,
  onSortChange,
  fitFilter,
  onFitFilterChange,
}: ReportFiltersProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      {/* Top Controls Row: Sort & Fit Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <div className="relative inline-flex items-center">
          <ArrowUpDown size={13} className="pointer-events-none absolute left-2.5 text-slate-500" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={cn(
              'h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-7 pr-7 text-xs font-medium text-slate-700',
              'hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400'
            )}
            aria-label="Sort reports"
          >
            <option value="date-desc">Sorted by Date</option>
            <option value="fit-desc">Sorted by Fit Score</option>
            <option value="profit-desc">Sorted by Profit</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 text-[10px] text-slate-400">▾</span>
        </div>

        <div className="relative inline-flex items-center">
          <Filter size={13} className="pointer-events-none absolute left-2.5 text-slate-500" />
          <select
            value={fitFilter}
            onChange={(e) => onFitFilterChange(e.target.value as FitFilterOption)}
            className={cn(
              'h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-7 pr-7 text-xs font-medium text-slate-700',
              'hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400'
            )}
            aria-label="Filter by fit score"
          >
            <option value="all">Filter by Fit: All</option>
            <option value="high">High Fit (≥70)</option>
            <option value="moderate">Moderate Fit (&lt;70)</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 text-[10px] text-slate-400">▾</span>
        </div>
      </div>

      {/* Status Filter Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab;
          const count = statusCounts[tab] ?? 0;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onStatusChange(tab)}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}
              aria-pressed={isActive}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
