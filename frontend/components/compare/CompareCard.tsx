// components/compare/CompareCard.tsx
'use client';

import React from 'react';
import { ChevronRight, Landmark } from 'lucide-react';
import { getCategoryIcon } from '@/components/discover/CategoryIcons';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { CategoryComparisonData, DemandLevel, BudgetFitStatus } from '@/data/compareData';
import type { SchemeData } from '@/lib/api-types';

interface CompareCardProps {
  readonly data: CategoryComparisonData;
  readonly capital: number;
  readonly matchedScheme?: SchemeData | null;
  readonly isLive?: boolean;
  readonly onSelect?: () => void;
}

function getIconTheme(category: string): { bg: string; text: string } {
  const lower = category.toLowerCase();
  if (lower.includes('dairy')) {
    return { bg: 'bg-[#EBF5FF]', text: 'text-[#2563EB]' };
  }
  if (lower.includes('food') || lower.includes('process')) {
    return { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]' };
  }
  if (lower.includes('textile') || lower.includes('garment')) {
    return { bg: 'bg-[#FAF5FF]', text: 'text-[#9333EA]' };
  }
  if (lower.includes('retail')) {
    return { bg: 'bg-[#FFF7ED]', text: 'text-[#EA580C]' };
  }
  if (lower.includes('logistic')) {
    return { bg: 'bg-[#F0F9FF]', text: 'text-[#0284C7]' };
  }
  return { bg: 'bg-[#FEFCE8]', text: 'text-[#CA8A04]' };
}

function renderDemandBadge(level: DemandLevel): React.JSX.Element {
  if (level === 'High') {
    return (
      <span className="inline-flex items-center rounded-full bg-[#EBF5FF] px-3 py-1 text-xs font-semibold text-[#2563EB]">
        High
      </span>
    );
  }
  if (level === 'Medium') {
    return (
      <span className="inline-flex items-center rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#B45309]">
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      Low
    </span>
  );
}

function MiniSparkline({ points }: { points: readonly number[] }): React.JSX.Element {
  if (points.length < 2) {
    return <div className="h-6 w-16" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 64;
  const height = 22;
  const padding = 2;

  const coords = points.map((val, idx) => {
    const x = padding + (idx / (points.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(' L ')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CompareCard({
  data,
  capital,
  matchedScheme,
  isLive = false,
  onSelect,
}: CompareCardProps): React.JSX.Element {
  const theme = getIconTheme(data.category);
  const isPositive = data.trendPercent >= 0;

  // Determine budget fit status based on matched scheme or fallback data
  let computedBudgetFit: BudgetFitStatus = data.budgetFit;
  if (matchedScheme) {
    const minEstimatedCost = 50000;
    const requiredMargin = minEstimatedCost * 0.10;
    if (capital >= requiredMargin) {
      computedBudgetFit = 'Good fit';
    } else {
      computedBudgetFit = 'Needs loan';
    }
  }

  return (
    <article
      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition hover:border-slate-300"
      aria-label={`Comparison card for ${data.category}`}
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                theme.bg,
                theme.text
              )}
            >
              {getCategoryIcon(data.category, 26, theme.text)}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {data.category}
              </h3>
              <p className="text-xs text-slate-500 leading-snug">
                {data.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#EBF5FF] px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
              {data.badgeLabel}
            </span>
            {isLive && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                Verified
              </span>
            )}
            {onSelect && (
              <button
                type="button"
                onClick={onSelect}
                className="text-slate-400 hover:text-slate-700 md:hidden"
                aria-label={`View details for ${data.category}`}
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Metric Comparison Rows */}
        <div className="mt-6 space-y-4 divide-y divide-slate-100">
          {/* Market trend */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm text-slate-500">Market trend</span>
              {isLive && (
                <span className="text-[10px] text-slate-400">Observed Regional Indicator</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-0.5 text-xs sm:text-sm font-bold text-[#2563EB]">
                {isPositive ? '▲' : '▼'} {Math.abs(data.trendPercent)}%
              </span>
              <MiniSparkline points={data.sparkline} />
            </div>
          </div>

          {/* Demand in your area */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs sm:text-sm text-slate-500">Demand in your area</span>
            {renderDemandBadge(data.demandLevel)}
          </div>

          {/* Budget fit */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs sm:text-sm text-slate-500">
              Budget fit ({formatCurrency(capital)})
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                computedBudgetFit === 'Good fit'
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : computedBudgetFit === 'Needs loan'
                  ? 'bg-[#FEF3C7] text-[#B45309]'
                  : 'bg-slate-100 text-slate-700'
              )}
            >
              {computedBudgetFit}
            </span>
          </div>

          {/* Matched Government Scheme */}
          {matchedScheme && (
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                <Landmark size={14} className="text-blue-600 shrink-0" />
                <span>Concessional Credit</span>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm font-semibold text-slate-900">
                  {matchedScheme.name}
                </div>
                <div className="text-[11px] text-blue-700">
                  {matchedScheme.interest_rate}% p.a. • Up to {formatCurrency(matchedScheme.max_loan_amount ?? 100000)}
                </div>
              </div>
            </div>
          )}

          {/* Typical setup cost */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm text-slate-500">Typical setup cost</span>
              <span className="text-[10px] text-slate-400">Reference Benchmark Range</span>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-900">
              {data.typicalSetupCost}
            </span>
          </div>

          {/* Why consider this */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 pt-3">
            <span className="text-xs sm:text-sm text-slate-500 shrink-0">Why consider this?</span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed sm:text-right">
              {data.whyConsider}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
