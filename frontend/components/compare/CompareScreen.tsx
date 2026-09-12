// components/compare/CompareScreen.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { IndianRupee, ChevronDown, Search, ArrowLeftRight, AlertTriangle, RefreshCw, PlusCircle } from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { formatCurrency } from '@/lib/format';
import {
  CATEGORY_COMPARISONS,
  DEFAULT_COMPARE_CATEGORIES,
  getCategoryComparison,
} from '@/data/compareData';
import { getInsights, getSchemes, getAssessmentHistory, getAssessmentById } from '@/lib/api-client';
import type { InsightsResponse, SchemeData, AssessmentHistoryItem, BackendAssessmentResponse } from '@/lib/api-types';
import { CompareHeader } from './CompareHeader';
import { CompareCard } from './CompareCard';
import { TrendComparisonChart } from './TrendComparisonChart';
import { CompareNextSteps } from './CompareNextSteps';
import { CompareAssessmentView } from './CompareAssessmentView';

export function CompareScreen(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { capital, setCompareCount } = useShell();

  // Read URL parameters
  const paramCategories = searchParams.getAll('c');
  const paramAssessments = searchParams.getAll('a');

  // Mode state: 'opportunities' or 'assessments'
  const [mode, setMode] = useState<'opportunities' | 'assessments'>(() => {
    if (paramAssessments.length >= 2) return 'assessments';
    return 'opportunities';
  });

  // Opportunities state
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

  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [schemes, setSchemes] = useState<SchemeData[] | null>(null);
  const [loadingOpportunities, setLoadingOpportunities] = useState<boolean>(true);
  const [errorOpportunities, setErrorOpportunities] = useState<string | null>(null);

  // Assessments state
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryItem[] | null>(null);
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<readonly [number, number] | null>(() => {
    if (paramAssessments.length >= 2) {
      return [Number(paramAssessments[0]), Number(paramAssessments[1])];
    }
    return null;
  });
  const [assessmentData1, setAssessmentData1] = useState<BackendAssessmentResponse | null>(null);
  const [assessmentData2, setAssessmentData2] = useState<BackendAssessmentResponse | null>(null);
  const [loadingAssessments, setLoadingAssessments] = useState<boolean>(false);
  const [errorAssessments, setErrorAssessments] = useState<string | null>(null);

  // Synchronize sidebar badge count
  useEffect(() => {
    if (mode === 'opportunities') {
      setCompareCount(selectedCategories.length);
    } else {
      setCompareCount(selectedAssessmentIds ? 2 : 0);
    }
  }, [mode, selectedCategories.length, selectedAssessmentIds, setCompareCount]);

  // Load Opportunities Data (Live Insights & Schemes)
  const loadOpportunities = useCallback(async () => {
    setLoadingOpportunities(true);
    setErrorOpportunities(null);
    try {
      const [insightsRes, schemesRes] = await Promise.all([
        getInsights('Uttar Pradesh'),
        getSchemes(),
      ]);
      setInsights(insightsRes);
      setSchemes(schemesRes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load live comparison data';
      setErrorOpportunities(message);
    } finally {
      setLoadingOpportunities(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'opportunities' && !insights) {
      loadOpportunities();
    }
  }, [mode, insights, loadOpportunities]);

  // Load Assessments Data (History & Assessment Details)
  const loadAssessments = useCallback(
    async (customIds?: [number, number]) => {
      setLoadingAssessments(true);
      setErrorAssessments(null);
      try {
        const history = await getAssessmentHistory();
        setAssessmentHistory(history);

        let idsToLoad: [number, number] | null = null;
        if (customIds) {
          idsToLoad = customIds;
        } else if (paramAssessments.length >= 2) {
          idsToLoad = [Number(paramAssessments[0]), Number(paramAssessments[1])];
        } else if (history && history.length >= 2) {
          idsToLoad = [history[0].id, history[1].id];
        }

        if (idsToLoad) {
          setSelectedAssessmentIds(idsToLoad);
          const [a1, a2] = await Promise.all([
            getAssessmentById(idsToLoad[0]),
            getAssessmentById(idsToLoad[1]),
          ]);
          setAssessmentData1(a1);
          setAssessmentData2(a2);
        } else {
          setSelectedAssessmentIds(null);
          setAssessmentData1(null);
          setAssessmentData2(null);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load assessment reports';
        setErrorAssessments(message);
      } finally {
        setLoadingAssessments(false);
      }
    },
    [paramAssessments]
  );

  useEffect(() => {
    if (mode === 'assessments' && !assessmentHistory) {
      loadAssessments();
    }
  }, [mode, assessmentHistory, loadAssessments]);

  // Handle Assessment Selection Change from Dropdowns
  const handleSelectAssessmentId = useCallback(
    async (slot: 0 | 1, id: number) => {
      const nextIds: [number, number] = slot === 0 ? [id, selectedAssessmentIds![1]] : [selectedAssessmentIds![0], id];
      setSelectedAssessmentIds(nextIds);
      setLoadingAssessments(true);
      setErrorAssessments(null);
      try {
        const fetched = await getAssessmentById(id);
        if (slot === 0) {
          setAssessmentData1(fetched);
        } else {
          setAssessmentData2(fetched);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : `Failed to load assessment #${id}`;
        setErrorAssessments(message);
      } finally {
        setLoadingAssessments(false);
      }
    },
    [selectedAssessmentIds]
  );

  // Opportunity categories and data
  const cat1Name = selectedCategories[0] ?? DEFAULT_COMPARE_CATEGORIES[0];
  const cat2Name = selectedCategories[1] ?? DEFAULT_COMPARE_CATEGORIES[1];

  const cat1Data = useMemo(() => {
    const base = getCategoryComparison(cat1Name);
    const liveTrend = insights?.categories?.find(
      (c) => c.name.toLowerCase() === cat1Name.toLowerCase()
    );
    if (!liveTrend) return base;
    return {
      ...base,
      trendPercent: liveTrend.trend,
      trendDirection: liveTrend.trend >= 0 ? ('up' as const) : ('down' as const),
      sparkline: liveTrend.sparkline,
      demandLevel: liveTrend.trend >= 20 ? ('High' as const) : ('Medium' as const),
    };
  }, [cat1Name, insights]);

  const cat2Data = useMemo(() => {
    const base = getCategoryComparison(cat2Name);
    const liveTrend = insights?.categories?.find(
      (c) => c.name.toLowerCase() === cat2Name.toLowerCase()
    );
    if (!liveTrend) return base;
    return {
      ...base,
      trendPercent: liveTrend.trend,
      trendDirection: liveTrend.trend >= 0 ? ('up' as const) : ('down' as const),
      sparkline: liveTrend.sparkline,
      demandLevel: liveTrend.trend >= 20 ? ('High' as const) : ('Medium' as const),
    };
  }, [cat2Name, insights]);

  const matchedScheme1 = useMemo(() => {
    if (!schemes || schemes.length === 0) return null;
    return schemes.find((s) => s.name.toLowerCase().includes('micro')) ?? schemes[0];
  }, [schemes]);

  const matchedScheme2 = useMemo(() => {
    if (!schemes || schemes.length === 0) return null;
    return schemes.find((s) => s.name.toLowerCase().includes('term')) ?? schemes[schemes.length - 1];
  }, [schemes]);

  const handleClear = useCallback(() => {
    if (mode === 'opportunities') {
      setSelectedCategories([]);
      router.replace('/compare');
    } else {
      setSelectedAssessmentIds(null);
      setAssessmentData1(null);
      setAssessmentData2(null);
    }
  }, [mode, router]);

  const handleSelectCategory = useCallback(
    (category: string) => {
      setSelectedCategories((prev) => {
        if (prev.includes(category)) return prev;
        return [...prev, category];
      });
    },
    []
  );

  const handleResetDefault = useCallback(() => {
    setSelectedCategories(DEFAULT_COMPARE_CATEGORIES);
  }, []);

  const hasComparison = mode === 'opportunities' ? selectedCategories.length >= 2 : !!(assessmentData1 && assessmentData2);
  const availableKeys = Object.keys(CATEGORY_COMPARISONS);

  return (
    <div className="min-h-full w-full bg-[#F8FAFC]/70 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Mobile Subheader */}
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

        {/* Header Section with Mode Switcher */}
        <CompareHeader
          title1={mode === 'opportunities' ? cat1Name : (assessmentData1 ? (assessmentData1.village?.name ? `#${assessmentData1.id} ${assessmentData1.village.name}` : `#${assessmentData1.id}`) : 'Report 1')}
          title2={mode === 'opportunities' ? cat2Name : (assessmentData2 ? (assessmentData2.village?.name ? `#${assessmentData2.id} ${assessmentData2.village.name}` : `#${assessmentData2.id}`) : 'Report 2')}
          onClear={handleClear}
          hasComparison={hasComparison}
          mode={mode}
          onModeChange={setMode}
          assessmentCount={assessmentHistory?.length}
        />

        {/* ─── MODE A: OPPORTUNITIES COMPARISON ─────────────────────────────────── */}
        {mode === 'opportunities' && (
          <>
            {loadingOpportunities ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-xs font-semibold text-slate-600">Loading live market insights...</p>
              </div>
            ) : errorOpportunities ? (
              <div
                role="alert"
                className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center"
              >
                <AlertTriangle size={32} className="text-rose-600" />
                <h3 className="mt-3 text-sm font-bold text-rose-900">Failed to load live comparison data</h3>
                <p className="mt-1 text-xs text-rose-700 max-w-md">{errorOpportunities}</p>
                <button
                  type="button"
                  onClick={loadOpportunities}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
                >
                  <RefreshCw size={13} />
                  <span>Retry</span>
                </button>
              </div>
            ) : hasComparison ? (
              <>
                {/* 1. Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
                  <CompareCard
                    data={cat1Data}
                    capital={capital}
                    matchedScheme={matchedScheme1}
                    isLive={!!insights}
                    onSelect={() => router.push(`/new-assessment?category=${encodeURIComponent(cat1Name)}`)}
                  />
                  <CompareCard
                    data={cat2Data}
                    capital={capital}
                    matchedScheme={matchedScheme2}
                    isLive={!!insights}
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

                {/* 3. Next Steps Call to Action */}
                <CompareNextSteps
                  category1={cat1Name}
                  category2={cat2Name}
                />
              </>
            ) : (
              /* Empty Selection State */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <ArrowLeftRight size={28} strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">Select categories to compare</h3>
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
          </>
        )}

        {/* ─── MODE B: PAST ASSESSMENTS COMPARISON ───────────────────────────────── */}
        {mode === 'assessments' && (
          <>
            {loadingAssessments ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="mt-3 text-xs font-semibold text-slate-600">Loading assessment reports...</p>
              </div>
            ) : errorAssessments ? (
              <div
                role="alert"
                className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center"
              >
                <AlertTriangle size={32} className="text-rose-600" />
                <h3 className="mt-3 text-sm font-bold text-rose-900">Failed to load assessment reports</h3>
                <p className="mt-1 text-xs text-rose-700 max-w-md">{errorAssessments}</p>
                <button
                  type="button"
                  onClick={() => loadAssessments()}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
                >
                  <RefreshCw size={13} />
                  <span>Retry</span>
                </button>
              </div>
            ) : assessmentHistory && assessmentHistory.length < 2 && !assessmentData1 ? (
              /* Empty History State */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <PlusCircle size={28} strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">Not enough assessments to compare</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md">
                  You need at least 2 generated assessments to perform a side-by-side report comparison.
                </p>
                <Link
                  href="/new-assessment"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-[#D97706]"
                >
                  Start New Assessment
                </Link>
              </div>
            ) : assessmentData1 && assessmentData2 && selectedAssessmentIds && assessmentHistory ? (
              <CompareAssessmentView
                history={assessmentHistory}
                selectedIds={selectedAssessmentIds}
                assessment1={assessmentData1}
                assessment2={assessmentData2}
                onSelectId={handleSelectAssessmentId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <ArrowLeftRight size={28} strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">Select two assessments to compare</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md">
                  Choose two assessments from your history to see a side-by-side comparison of feasibility and financial terms.
                </p>
                {assessmentHistory && assessmentHistory.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => loadAssessments([assessmentHistory[0].id, assessmentHistory[1].id])}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-[#D97706]"
                  >
                    Compare Recent Reports (#{assessmentHistory[0].id} vs #{assessmentHistory[1].id})
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
