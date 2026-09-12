// components/compare/CompareScreen.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { IndianRupee, ChevronDown, Search, ArrowLeftRight } from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { formatCurrency } from '@/lib/format';
import {
  CATEGORY_COMPARISONS,
  DEFAULT_COMPARE_CATEGORIES,
  getCategoryComparison,
} from '@/data/compareData';
import { CompareHeader } from './CompareHeader';
import { CompareCard } from './CompareCard';
import { TrendComparisonChart } from './TrendComparisonChart';
import { CompareNextSteps } from './CompareNextSteps';

export function CompareScreen(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { capital, setCompareCount } = useShell();

  // Read categories from search parameters or fallback to defaults
  const paramCategories = searchParams.getAll('c');
  const [selectedCategories, setSelectedCategories] = useState<readonly string[]>(() => {
    if (paramCategories.length >= 2) {
      return [paramCategories[0], paramCategories[1]];
    }
    if (paramCategories.length === 1) {
      const other = paramCategories[0] === 'Dairy' ? 'Food Processing' : 'Dairy';
      return [paramCategories[0], other];
    }
    return DEFAULT_COMPARE_CATEGORIES;
  });

  // Keep sidebar badge synchronized with active comparison count
  useEffect(() => {
    setCompareCount(selectedCategories.length);
  }, [selectedCategories, setCompareCount]);

  const cat1Name = selectedCategories[0] ?? DEFAULT_COMPARE_CATEGORIES[0];
  const cat2Name = selectedCategories[1] ?? DEFAULT_COMPARE_CATEGORIES[1];

  const cat1Data = useMemo(() => getCategoryComparison(cat1Name), [cat1Name]);
  const cat2Data = useMemo(() => getCategoryComparison(cat2Name), [cat2Name]);

  const handleClear = useCallback(() => {
    setSelectedCategories([]);
    router.replace('/compare');
  }, [router]);

  const handleSelectCategory = useCallback(
    (category: string) => {
      setSelectedCategories((prev) => {
        if (prev.length === 0) {
          return [category];
        }
        if (prev.length === 1) {
          if (prev[0] === category) return prev;
          return [prev[0], category];
        }
        return [category, prev[1]];
      });
    },
    []
  );

  const handleResetDefault = useCallback(() => {
    setSelectedCategories(DEFAULT_COMPARE_CATEGORIES);
  }, []);

  const hasComparison = selectedCategories.length >= 2;
  const availableKeys = Object.keys(CATEGORY_COMPARISONS);

  return (
    <div className="min-h-full w-full bg-[#F8FAFC]/70 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Mobile-only subheader search & capital bar */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs"
            aria-label={`Capital: ${formatCurrency(capital)}`}
          >
            <IndianRupee size={13} strokeWidth={2.25} className="text-slate-600" />
            <span>{formatCurrency(capital)}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </Link>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              type="search"
              placeholder="Ask SAKSHAM anything..."
              className="flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
              aria-label="Ask SAKSHAM a question"
            />
          </div>
        </div>

        {/* Header section */}
        <CompareHeader
          title1={cat1Name}
          title2={cat2Name}
          onClear={handleClear}
          hasComparison={hasComparison}
        />

        {hasComparison ? (
          <>
            {/* 1. Comparison Cards (2-col on desktop, stacked on mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
              <CompareCard
                data={cat1Data}
                capital={capital}
                onSelect={() => router.push(`/new-assessment?category=${encodeURIComponent(cat1Name)}`)}
              />
              <CompareCard
                data={cat2Data}
                capital={capital}
                onSelect={() => router.push(`/new-assessment?category=${encodeURIComponent(cat2Name)}`)}
              />
            </div>

            {/* 2. Overlaid Trend Comparison Chart */}
            <TrendComparisonChart
              category1={cat1Name}
              category2={cat2Name}
              series1={cat1Data.monthlyTrends}
              series2={cat2Data.monthlyTrends}
            />

            {/* 3. Ready to take next step Action Banner */}
            <CompareNextSteps
              category1={cat1Name}
              category2={cat2Name}
            />
          </>
        ) : (
          /* Empty / Category Selection State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <ArrowLeftRight size={28} strokeWidth={2} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Select categories to compare
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md">
              {selectedCategories.length === 1
                ? `1 selected (${selectedCategories[0]}). Choose a second category to compare.`
                : 'Choose any two business opportunities to see side-by-side market demand, setup costs, and trend insights.'}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {availableKeys.map((key) => {
                const isSelected = selectedCategories.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectCategory(key)}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-100 text-amber-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900'
                    }`}
                  >
                    {isSelected ? `✓ ${key}` : `+ ${key}`}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleResetDefault}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-[#D97706]"
            >
              Reset to Dairy vs Food Processing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
