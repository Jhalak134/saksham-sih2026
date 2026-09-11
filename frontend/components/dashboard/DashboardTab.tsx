// components/dashboard/DashboardTab.tsx
// Overview tab with Fit Score ring, breakdown bars, and final recommendation.

'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import type { DetailedReport } from '@/data/reportsData';
import { cn } from '@/lib/cn';

interface DashboardTabProps {
  readonly report: DetailedReport;
  readonly onNavigateFinancials: () => void;
}

interface BreakdownBarProps {
  readonly label: string;
  readonly value: number; // out of 10
}

function BreakdownBar({ label, value }: BreakdownBarProps): React.JSX.Element {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value}/10</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-sky-600 transition-all duration-500"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardTab({
  report,
  onNavigateFinancials,
}: DashboardTabProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* 1. Score Section: stacked on mobile, side-by-side on desktop (md:flex-row) */}
      <div className="flex flex-col md:flex-row gap-6 rounded-xl border border-slate-200 bg-white p-5 md:p-6">
        {/* Ring & Verdict side */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left md:w-1/2 justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <ShieldCheck size={14} />
              <span>{report.viabilityLabel}</span>
            </div>
            <p className="mt-2 text-xs md:text-sm text-slate-600 max-w-sm">
              {report.viabilityDescription}
            </p>
          </div>

          <div className="my-4 flex items-center gap-4">
            <ScoreRing score={report.fitScore} />
            <div className="text-left">
              <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {report.confidence} confidence
              </span>
              <p className="mt-1 text-xs text-slate-500">Based on local supply & demand data</p>
            </div>
          </div>

          {/* Teaser CTA */}
          <button
            type="button"
            onClick={onNavigateFinancials}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            <span>Recommended: ₹{report.recommendation.recommendedProjectCost.toLocaleString('en-IN')} project</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Breakdown bars side */}
        <div className="border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pl-6 md:pt-0 md:w-1/2 flex flex-col justify-center space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Fit Score Breakdown
          </h3>
          <BreakdownBar label="Market Opportunity" value={report.breakdown.marketOpportunity} />
          <BreakdownBar label="Competition" value={report.breakdown.competition} />
          <BreakdownBar label="Capital Fit" value={report.breakdown.capitalFit} />
          <BreakdownBar label="Supply Risk" value={report.breakdown.supplyRisk} />
        </div>
      </div>

      {/* 2. Final Recommendation Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Final Recommendation</h3>
          <p className="mt-1 text-xs md:text-sm text-slate-600 font-medium">
            {report.recommendation.verdict}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
          {/* Supporting Factors */}
          <div className="space-y-2">
            <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>Supporting factors</span>
            </p>
            <ul className="space-y-1.5 text-slate-600 pl-5 list-disc marker:text-emerald-500">
              {report.recommendation.supportingFactors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </div>

          {/* Points to Consider */}
          <div className="space-y-2">
            <p className="font-semibold text-amber-800 flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>Points to consider</span>
            </p>
            <ul className="space-y-1.5 text-slate-600 pl-5 list-disc marker:text-amber-500">
              {report.recommendation.pointsToConsider.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Key Insights */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Insights</h3>
        <div className="space-y-2">
          {report.keyInsights.map((insight) => (
            <p key={insight} className="text-xs text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              {insight}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
