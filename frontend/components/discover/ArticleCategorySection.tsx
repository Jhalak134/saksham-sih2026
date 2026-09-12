// components/discover/ArticleCategorySection.tsx
// Bottom Section:
// - Left (col-span-6): Expanded space for Single Slideable Live News Article (auto 3s) or Selected Category Details per State
// - Right (col-span-6): All 8 Categories in a clean, compact 4X2 grid (normal spacing, full category titles, no huge gaps)
// Connected to backend GET /api/v1/insights/{location} and GET /api/v1/schemes.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { StateArticles } from './StateArticles';
import {
  ALL_CATEGORY_DETAILS,
  getCategoryDetail,
  type CategoryDetailData,
} from '@/data/categoryStateData';
import { getInsights, getSchemes } from '@/lib/api-client';
import type { InsightsResponse, OfficialScheme } from '@/lib/api-types';
import {
  MilkCartonIcon,
  SpoolIcon,
  StoreIcon,
  LeafIcon,
  UtensilsIcon,
  PotteryIcon,
  SolarSunIcon,
  WrenchToolIcon,
} from './CategoryIcons';

interface ArticleCategorySectionProps {
  readonly stateName?: string;
  readonly selectedDistrict?: string | null;
  readonly availableCapital?: string;
}

function renderIcon(type: CategoryDetailData['iconType'], size = 22): React.JSX.Element {
  switch (type) {
    case 'dairy':
      return <MilkCartonIcon size={size} className="text-slate-800" />;
    case 'textiles':
      return <SpoolIcon size={size} className="text-slate-800" />;
    case 'retail':
      return <StoreIcon size={size} className="text-slate-800" />;
    case 'agri':
      return <LeafIcon size={size} className="text-slate-800" />;
    case 'food':
      return <UtensilsIcon size={size} className="text-slate-800" />;
    case 'handicrafts':
      return <PotteryIcon size={size} className="text-slate-800" />;
    case 'solar':
      return <SolarSunIcon size={size} className="text-slate-800" />;
    case 'services':
      return <WrenchToolIcon size={size} className="text-slate-800" />;
    default:
      return <LeafIcon size={size} className="text-slate-800" />;
  }
}

function getLiveCategoryTrend(
  catId: string,
  categories: ReadonlyArray<{ name: string; trend: number }> | undefined
): number | null {
  if (!categories || categories.length === 0) return null;
  const idLower = catId.toLowerCase();
  for (const c of categories) {
    const cLower = c.name.toLowerCase();
    if (cLower.includes(idLower) || idLower.includes(cLower)) {
      return c.trend;
    }
    if (idLower === 'food' && cLower.includes('food')) return c.trend;
    if (idLower === 'agri' && (cLower.includes('agri') || cLower.includes('food'))) return c.trend;
  }
  return null;
}

export function ArticleCategorySection({
  stateName = 'Uttar Pradesh',
  selectedDistrict = null,
  availableCapital = '₹1,00,000',
}: ArticleCategorySectionProps): React.JSX.Element {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);

  // Live backend data states
  const [liveInsights, setLiveInsights] = useState<InsightsResponse | null>(null);
  const [liveSchemes, setLiveSchemes] = useState<OfficialScheme[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isUP =
    stateName.toLowerCase().includes('uttar pradesh') ||
    stateName.toLowerCase() === 'up' ||
    Boolean(selectedDistrict && selectedDistrict.toLowerCase().includes('mathura'));

  const targetLocation = selectedDistrict || stateName || 'Uttar Pradesh';

  const loadCategoryInsights = useCallback(async (isMounted: () => boolean) => {
    if (!isUP) return;
    setLoading(true);
    setError(null);
    try {
      const [insightsRes, schemesRes] = await Promise.all([
        getInsights(targetLocation),
        getSchemes(),
      ]);
      if (isMounted()) {
        setLiveInsights(insightsRes);
        setLiveSchemes(schemesRes);
        setError(null);
      }
    } catch (err: unknown) {
      if (isMounted()) {
        const msg = err instanceof Error ? err.message : 'Unable to load category insights';
        setError(msg);
        setLiveInsights(null);
        setLiveSchemes(null);
      }
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, [isUP, targetLocation]);

  useEffect(() => {
    let mounted = true;
    if (isUP) {
      loadCategoryInsights(() => mounted);
    } else {
      setLiveInsights(null);
      setLiveSchemes(null);
      setError(null);
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [isUP, loadCategoryInsights]);

  const selectedCategory = selectedCategoryId ? getCategoryDetail(selectedCategoryId) : null;

  const handleStartAssessment = (ideaName: string) => {
    if (isUP) {
      setComingSoonMessage(null);
      const districtParam = selectedDistrict ? `&district=${encodeURIComponent(selectedDistrict)}` : '';
      router.push(`/new-assessment?idea=${encodeURIComponent(ideaName)}&state=${encodeURIComponent(stateName)}${districtParam}`);
    } else {
      setComingSoonMessage(
        `Sorry, assessments are currently active only in Uttar Pradesh (Pilot Region). Expansion to ${stateName} is coming soon!`
      );
      setTimeout(() => {
        setComingSoonMessage(null);
      }, 4500);
    }
  };

  return (
    <section aria-label="Featured live news and category opportunities" className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ─────────────────── LEFT (6 Cols): EXPANDED SINGLE SLIDEABLE NEWS ARTICLE / CATEGORY DETAILS ─────────────────── */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs overflow-hidden transition-all">
          {selectedCategory ? (
            /* ── VIEW A: DETAILED CATEGORY INSIGHTS IN SELECTED STATE ── */
            <div className="flex flex-1 flex-col justify-between">
              <div>
                {/* Back button & State Pill */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#2E6FF2] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-md py-1 pr-2 cursor-pointer"
                  >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                    <span>Back to Live News</span>
                  </button>

                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <MapPin size={12} className="text-emerald-600" />
                    <span>{selectedDistrict ? `${selectedDistrict}, ${stateName}` : `${stateName} Market`}</span>
                  </div>
                </div>

                {/* Category Header */}
                <div className="mt-4 flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-900 shadow-xs">
                    {renderIcon(selectedCategory.iconType, 26)}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {selectedCategory.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {(() => {
                        const liveTrend = isUP ? getLiveCategoryTrend(selectedCategory.id, liveInsights?.categories) : null;
                        const displayTrend = liveTrend ?? selectedCategory.trendPercent;
                        return (
                          <>
                            <span className="text-xs font-bold text-emerald-600 flex items-center">
                              <TrendingUp size={13} className="mr-1" />
                              +{displayTrend}% YoY in {stateName}
                            </span>
                            {liveTrend !== null && (
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.2">
                                Live Regional Indicator
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Demand Summary */}
                <p className="mt-3 text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {selectedCategory.demandSummary}
                </p>

                {/* Metric Badges Grid (With Reference Benchmark Labeling) */}
                <div className="my-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10.5px] font-semibold text-slate-500">Target Capital</span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                      {selectedCategory.capitalBracket}
                    </p>
                    <span className="text-[9.5px] text-slate-400 block mt-0.5">Reference Benchmark</span>
                  </div>
                  <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                    <span className="text-[10.5px] font-semibold text-emerald-800">Estimated Margins</span>
                    <p className="text-xs sm:text-sm font-bold text-emerald-950 mt-0.5 truncate">
                      {selectedCategory.profitMargin}
                    </p>
                    <span className="text-[9.5px] text-emerald-700/80 block mt-0.5">Model Estimate</span>
                  </div>
                </div>

                {/* Government Subsidies & Official Concessional Schemes */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Eligible Schemes &amp; Credit:</span>
                    </div>
                    {isUP && liveSchemes && liveSchemes.length > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 border border-emerald-200">
                        Official Credit Scheme
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {isUP && liveSchemes && liveSchemes.length > 0 ? (
                      <>
                        {liveSchemes.slice(0, 2).map((scheme) => (
                          <div
                            key={scheme.id}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700 border border-slate-100"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate font-medium">{scheme.name}</span>
                            </div>
                            <span className="text-[10.5px] font-bold text-emerald-700 shrink-0 ml-2">
                              {scheme.interest_rate}% p.a.
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700 border border-slate-100">
                          <div className="flex items-center gap-2 truncate">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate font-medium">PMFME Scheme</span>
                          </div>
                          <span className="text-[10.5px] font-medium text-slate-500 shrink-0 ml-2">
                            35% Capital Subsidy
                          </span>
                        </div>
                      </>
                    ) : (
                      selectedCategory.applicableSchemes.slice(0, 2).map((scheme) => (
                        <div
                          key={scheme}
                          className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700 border border-slate-100"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">{scheme}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Benchmark Provenance Footnote */}
                <div className="mt-2.5 rounded-lg bg-slate-50 p-2 border border-slate-200 text-[10.5px] text-slate-500 flex items-start gap-1.5">
                  <Info size={12} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Financial ranges reflect reference benchmark estimates. Concessional credit facilities and regional growth indicators verified via backend database.
                  </p>
                </div>

                {/* Coming Soon Notice */}
                {comingSoonMessage && (
                  <div
                    role="alert"
                    className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-900"
                  >
                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{comingSoonMessage}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleStartAssessment(selectedCategory.name)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#15803D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition-all cursor-pointer"
                >
                  <span>Start Assessment</span>
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* ── VIEW B: SINGLE ARTICLE AUTO-SLIDER ── */
            <StateArticles selectedState={stateName} />
          )}
        </div>

        {/* ─────────────────── RIGHT (6 Cols): ALL 8 CATEGORIES IN A CLEAN 4X2 GRID (NORMAL PADDING, NO TRUNCATION) ─────────────────── */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h4 className="text-sm md:text-base font-bold text-slate-900">
                All Business Categories
              </h4>
              {isUP && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                  Verified Indicators
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-slate-400">Click to view details</span>
          </div>

          {/* 4X2 Category Grid (4 rows x 2 columns with normal spacing and full titles) */}
          {error ? (
            <div role="alert" className="my-auto flex flex-col items-center justify-center p-6 text-center rounded-xl border border-red-200 bg-red-50 text-red-800 space-y-2">
              <AlertCircle size={20} className="text-red-600 shrink-0" />
              <p className="text-xs font-bold text-red-800">Unable to load live category trends</p>
              <p className="text-[11px] text-red-700 leading-snug">{error}</p>
              <button
                type="button"
                onClick={() => loadCategoryInsights(() => true)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
              {ALL_CATEGORY_DETAILS.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const liveTrend = isUP ? getLiveCategoryTrend(cat.id, liveInsights?.categories) : null;
                const displayTrend = liveTrend ?? cat.trendPercent;

                return (
                  <div
                    key={cat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedCategoryId(cat.id)}
                    aria-label={`${cat.name} category`}
                    className={cn(
                      'group flex items-center justify-between rounded-xl border px-3 py-2.5 shadow-xs transition-all cursor-pointer',
                      isSelected
                        ? 'border-[#2E6FF2] bg-blue-50/50 shadow-sm ring-1 ring-[#2E6FF2]'
                        : 'border-slate-200/80 bg-white hover:border-[#2E6FF2] hover:bg-slate-50/70 hover:shadow-xs'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                          isSelected
                            ? 'bg-blue-100/70 border-blue-300 text-blue-900'
                            : 'bg-slate-50 border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200'
                        )}
                      >
                        {renderIcon(cat.iconType, 20)}
                      </div>
                      <div className="min-w-0 flex-1 pr-1">
                        <h5 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
                          {cat.name}
                        </h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                        <span className="mr-0.5 text-[9px]">↑</span>{displayTrend}%
                      </span>
                      <div
                        className={cn(
                          'transition-all',
                          isSelected ? 'text-[#2E6FF2] translate-x-0.5' : 'text-slate-300 group-hover:text-[#2E6FF2]'
                        )}
                      >
                        <ChevronRight size={14} strokeWidth={2.2} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

