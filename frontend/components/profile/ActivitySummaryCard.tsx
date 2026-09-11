// components/profile/ActivitySummaryCard.tsx
'use client';

import React from 'react';
import { BarChart2, FileText, RotateCcw, Bookmark, type LucideIcon } from 'lucide-react';

interface ActivityStatProps {
  icon: LucideIcon;
  count: number;
  label: string;
  sublabel: string;
  hasLeftBorder?: boolean;
}

function ActivityStat({
  icon: Icon,
  count,
  label,
  sublabel,
  hasLeftBorder = false,
}: ActivityStatProps): React.JSX.Element {
  return (
    <div
      className={`flex items-start gap-3 ${
        hasLeftBorder ? 'border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-3 sm:pt-0 sm:pl-6' : ''
      }`}
    >
      <div
        className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="flex flex-col">
        <span className="text-base sm:text-lg font-bold leading-tight text-slate-900">
          {count}
        </span>
        <span className="text-xs sm:text-sm font-semibold text-slate-900">
          {label}
        </span>
        <span className="text-[11px] sm:text-xs text-slate-500">
          {sublabel}
        </span>
      </div>
    </div>
  );
}

export interface ActivitySummaryCardProps {
  totalAssessments?: number;
  completedAssessments?: number;
  savedAssessments?: number;
}

export function ActivitySummaryCard({
  totalAssessments = 4,
  completedAssessments = 1,
  savedAssessments = 1,
}: ActivitySummaryCardProps): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col gap-5">
        {/* Header row */}
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-amber-800"
            aria-hidden="true"
          >
            <BarChart2 size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Your Activity
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              A quick summary of your assessments.
            </p>
          </div>
        </div>

        {/* 3 Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
          <ActivityStat
            icon={FileText}
            count={totalAssessments}
            label="Total Assessments"
            sublabel="All your assessments"
          />
          <ActivityStat
            icon={RotateCcw}
            count={completedAssessments}
            label="Completed"
            sublabel="Analysis ready"
            hasLeftBorder
          />
          <ActivityStat
            icon={Bookmark}
            count={savedAssessments}
            label="Saved"
            sublabel="Saved for later"
            hasLeftBorder
          />
        </div>
      </div>
    </div>
  );
}
