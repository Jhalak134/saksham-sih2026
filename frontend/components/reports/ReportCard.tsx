// components/reports/ReportCard.tsx
// Assessment preview card matching PDF mockup Page 4 (mobile) and Page 3 (desktop).

'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  ChevronRight,
  Wrench,
  Sun,
  Scissors,
  type LucideIcon,
} from 'lucide-react';
import { CowIcon } from '@/components/discover/CategoryIcons';
import type { ReportSummary, AssessmentStatus } from '@/data/reportsData';
import { cn } from '@/lib/cn';

interface ReportCardProps {
  readonly report: ReportSummary;
}

function StatusBadge({ status }: { status: AssessmentStatus }): React.JSX.Element {
  const styles: Record<AssessmentStatus, string> = {
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'In Progress': 'bg-sky-50 text-sky-700 border-sky-200',
    Saved: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border',
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

function CategoryThumbnail({ iconType }: { iconType: ReportSummary['iconType'] }): React.JSX.Element {
  const iconMap: Record<'mobile' | 'solar' | 'tailoring', LucideIcon> = {
    mobile: Wrench,
    solar: Sun,
    tailoring: Scissors,
  };

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100/90 border border-slate-200/80 text-slate-700">
      {iconType === 'dairy' ? (
        <CowIcon size={24} className="text-slate-800" />
      ) : (
        React.createElement(iconMap[iconType], { size: 22, strokeWidth: 1.75 })
      )}
    </div>
  );
}

function FitScoreMeter({
  score,
  confidence,
}: {
  score: number;
  confidence: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-bold text-slate-900">{score}/100</span>
      </div>
      <div className="mt-1 h-1.5 w-full max-w-[90px] rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            score >= 75
              ? 'bg-[var(--color-accent)]'
              : score >= 60
                ? 'bg-amber-500'
                : 'bg-slate-400'
          )}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="mt-1 text-[10px] text-slate-500">{confidence} confidence</span>
    </div>
  );
}

export function ReportCard({ report }: ReportCardProps): React.JSX.Element {
  const formattedProfit = `₹${report.estimatedProfit.toLocaleString('en-IN')}`;

  return (
    <Link
      href={`/dashboard/${report.id}`}
      className={cn(
        'group block rounded-xl border border-slate-200 bg-white p-4',
        'hover:border-slate-300 hover:shadow-sm transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20'
      )}
      aria-label={`View report for ${report.title} in ${report.location}`}
    >
      {/* Header Row: Thumbnail, Titles, Status & Chevron */}
      <div className="flex items-start gap-3">
        <CategoryThumbnail iconType={report.iconType} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
              {report.title}
            </h3>
            <ChevronRight
              size={18}
              className="shrink-0 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5"
            />
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-slate-500">
            <MapPin size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">{report.location}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            <span className="text-[11px] text-slate-400">{report.date}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row: Profit, Break-even, Fit Score */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{formattedProfit}</p>
          <p className="text-[11px] text-slate-500">Est. monthly profit</p>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-900">{report.breakEvenMonths} months</p>
          <p className="text-[11px] text-slate-500">Break-even</p>
        </div>

        <div>
          <FitScoreMeter score={report.fitScore} confidence={report.confidence} />
        </div>
      </div>
    </Link>
  );
}
