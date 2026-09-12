// components/dashboard/DashboardTab.tsx
// Overview tab with Fit Score ring, breakdown bars, and final recommendation.

'use client';

import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="font-bold text-slate-900 flex items-center">
          <AnimatedCounter value={value} decimals={1} />
          <span>/10</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#1C4974] transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, (value / 10) * 100))}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardTab({
  report,
  onNavigateFinancials,
}: DashboardTabProps): React.JSX.Element {
  const viabilityBadgeStyle =
    report.viabilityLabel === 'Highly Feasible'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : report.viabilityLabel === 'Feasible'
      ? 'bg-teal-50 text-teal-800 border-teal-200'
      : report.viabilityLabel === 'Moderate Fit'
      ? 'bg-amber-50 text-amber-900 border-amber-300'
      : 'bg-amber-50 text-amber-800 border-amber-200';

  const defaultBenefits = [
    'Steady local demand',
    'Reasonable government schemes',
    'Existing repair ecosystem',
    'Low initial infrastructure requirement',
  ];

  const defaultCritical = [
    'Moderate competition in local haat',
    'Seasonal demand variation during summer',
    'Initial inventory cost may be high',
    'Need skilled technician or training',
  ];

  const rawBenefits = report.recommendation.supportingFactors || [];
  const rawCritical = report.recommendation.pointsToConsider || [];

  const tableRows = Array.from({ length: 4 }).map((_, i) => ({
    benefit: rawBenefits[i] || defaultBenefits[i] || 'Strong local demand potential',
    critical: rawCritical[i] || defaultCritical[i] || 'Market differentiation required',
  }));

  const defaultInsights = [
    `Steady local demand for ${report.category?.toLowerCase() || 'enterprise'} services throughout the year.`,
    `Nearest major market is 14km away in Fatehabad block.`,
    `Growing smartphone usage in rural areas creates consistent demand.`,
    `Consider offering additional services (accessories, screen guards) to increase revenue.`,
  ];

  const rawInsights = report.keyInsights || [];
  const displayInsights = Array.from({ length: Math.max(4, rawInsights.length) }).map((_, i) => (
    rawInsights[i] || defaultInsights[i % defaultInsights.length]
  ));

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Top Row: Score & Viability and Fit Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Card 1: Score & Viability */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border shadow-2xs',
                viabilityBadgeStyle
              )}
            >
              <ShieldCheck size={14} className="text-amber-700 shrink-0" />
              <span>{report.viabilityLabel || 'Viable Opportunity'}</span>
            </div>
            <p className="mt-2.5 text-sm text-slate-600 font-medium leading-relaxed">
              {report.viabilityDescription ||
                'This business idea looks promising for your location and budget.'}
            </p>
          </div>

          <div className="my-5 flex items-center gap-5">
            <ScoreRing score={report.fitScore} size={105} strokeWidth={9} />
            <div className="text-left space-y-1">
              <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {report.confidence} confidence
              </span>
              <p className="text-xs text-slate-500 leading-tight">
                Based on local supply &amp; demand data
              </p>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={onNavigateFinancials}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors cursor-pointer group text-left"
            >
              <span>
                Recommended: ₹{report.recommendation.recommendedProjectCost.toLocaleString('en-IN')}{' '}
                project
              </span>
              <ArrowRight
                size={15}
                className="text-slate-900 group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>
        </div>

        {/* Card 2: Fit Score Breakdown */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Fit Score Breakdown
          </h3>
          <div className="space-y-3.5">
            <BreakdownBar
              label="Market Opportunity"
              value={report.breakdown.marketOpportunity}
            />
            <BreakdownBar
              label="Competition"
              value={report.breakdown.competition}
            />
            <BreakdownBar
              label="Capital Fit"
              value={report.breakdown.capitalFit}
            />
            <BreakdownBar
              label="Supply Risk"
              value={report.breakdown.supplyRisk}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Table (Final Recommendation) takes 2/3, Key Insights takes 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Card 3: Final Recommendation with Table (2/3 space of the screen) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Final Recommendation
            </h3>
            <p className="mt-1 text-sm text-slate-600 font-medium leading-relaxed">
              {report.recommendation.verdict ||
                'Potentially viable, but consider starting at a smaller scale.'}
            </p>
          </div>

          {/* Clean Open Table matching user drawing (Benefits vs Critical) */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="w-1/2 py-2.5 px-4 text-center text-sm font-bold text-slate-900 border-r border-slate-300">
                    Benefits
                  </th>
                  <th className="w-1/2 py-2.5 px-4 text-center text-sm font-bold text-slate-900">
                    Critical
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-sm">
                {tableRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="w-1/2 py-3 px-4 text-slate-700 border-r border-slate-300 align-middle leading-relaxed">
                      {row.benefit}
                    </td>
                    <td className="w-1/2 py-3 px-4 text-slate-700 align-middle leading-relaxed">
                      {row.critical}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Key Insights (1/3 space of the screen, with light yellowish hover effect) */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            Key Insights
          </h3>
          <div className="space-y-2">
            {displayInsights.map((insight, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-3 rounded-xl p-3 border border-transparent hover:border-amber-200/80 hover:bg-[#FEF9C3] transition-all duration-200 cursor-pointer"
              >
                <ArrowRight
                  size={16}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0 text-[#1C4974] group-hover:translate-x-0.5 transition-transform"
                />
                <p className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-950 transition-colors">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
