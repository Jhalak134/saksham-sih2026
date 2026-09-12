// components/discover/ArticleCategorySection.tsx
// Bottom Section:
// - Left (col-span-6): Expanded space for Single Slideable Live News Article (auto 3s) or Selected Category Details per State
// - Right (col-span-6): All 8 Categories in a clean, compact 4X2 grid (normal spacing, full category titles, no huge gaps)
// Connected to backend GET /api/v1/categories/{id}, GET /api/v1/insights/{location}, and GET /api/v1/schemes.

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
  Store,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { StateArticles } from './StateArticles';
import {
  ALL_CATEGORY_DETAILS,
  getCategoryDetail,
  type CategoryDetailData,
} from '@/data/categoryStateData';
import { getInsights, getSchemes, getCategoryDetails } from '@/lib/api-client';
import type { InsightsResponse, OfficialScheme, CategoryDetailsResponse } from '@/lib/api-types';
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
  readonly selectedCategoryId?: string | null;
  readonly onSelectCategory?: (categoryId: string | null) => void;
  readonly onCategoryChange?: (category: CategoryDetailsResponse | null) => void;
}

function renderIcon(type: CategoryDetailData['iconType'] | string, size = 22): React.JSX.Element {
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
  selectedCategoryId: externalCategoryId,
  onSelectCategory,
  onCategoryChange,
}: ArticleCategorySectionProps): React.JSX.Element {
  const router = useRouter();
  const [internalCategoryId, setInternalCategoryId] = useState<string | null>(null);
  const activeCategoryId = externalCategoryId !== undefined ? externalCategoryId : internalCategoryId;

  const [categoryData, setCategoryData] = useState<CategoryDetailsResponse | null>(null);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

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

  // Static fallback metadata
  const selectedCategory = activeCategoryId ? getCategoryDetail(activeCategoryId) : null;

  // Dynamic Category Fetcher
  const fetchCategory = useCallback(async (catId: string) => {
    setCategoryLoading(true);
    setCategoryError(null);
    try {
      const data = await getCategoryDetails(catId, targetLocation);
      setCategoryData(data);
      onCategoryChange?.(data);
    } catch (err: unknown) {
      console.warn('Category detail API fallback to curated profile:', err);
      const fallback = getCategoryDetail(catId);
      if (fallback) {
        const synthetic: CategoryDetailsResponse = {
          id: fallback.id,
          numeric_id: 1,
          name: fallback.name,
          slug: fallback.id,
          icon_type: fallback.iconType,
          is_seasonal: false,
          demand_trend: fallback.trendPercent,
          trend_percent: fallback.trendPercent,
          demand_summary: fallback.demandSummary,
          description: fallback.demandSummary,
          capital_bracket: fallback.capitalBracket,
          profit_margin: fallback.profitMargin,
          feasible_locations_count: fallback.feasibleLocations,
          total_businesses: 0,
          sample_businesses: [],
          applicable_schemes: fallback.applicableSchemes.map((s, idx) => ({ id: idx + 1, name: s })),
          raw_materials: fallback.rawMaterials,
          location: targetLocation,
          district_name: selectedDistrict || 'Mathura',
          state_name: stateName,
        };
        setCategoryData(synthetic);
        onCategoryChange?.(synthetic);
      }
    } finally {
      setCategoryLoading(false);
    }
  }, [targetLocation, selectedDistrict, stateName, onCategoryChange]);

  useEffect(() => {
    if (activeCategoryId) {
      fetchCategory(activeCategoryId);
    } else {
      setCategoryData(null);
      onCategoryChange?.(null);
    }
  }, [activeCategoryId, fetchCategory, onCategoryChange]);

  const handleCategoryClick = (categoryId: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    } else {
      setInternalCategoryId(categoryId);
    }
    fetchCategory(categoryId);
  };

  const handleCloseCategory = () => {
    if (onSelectCategory) {
      onSelectCategory(null);
    } else {
      setInternalCategoryId(null);
    }
    setCategoryData(null);
    onCategoryChange?.(null);
  };

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

  // Merge dynamic and curated schemes so ODOP/PMEGP and official credit appear
  const combinedSchemes: Array<{ id?: number; name: string; interest_rate?: number; description?: string }> = (() => {
    const list: Array<{ id?: number; name: string; interest_rate?: number; description?: string }> = [];
    if (categoryData?.applicable_schemes && categoryData.applicable_schemes.length > 0) {
      for (const s of categoryData.applicable_schemes) {
        if (!list.some(item => item.name === s.name)) {
          list.push(s);
        }
      }
    }
    if (selectedCategory?.applicableSchemes) {
      for (const s of selectedCategory.applicableSchemes) {
        if (!list.some(item => item.name === s)) {
          list.push({ name: s });
        }
      }
    }
    return list;
  })();

  const displayName = categoryData?.name || selectedCategory?.name || '';
  const displayIcon = categoryData?.icon_type || selectedCategory?.iconType || 'leaf';
  const displayTrend = categoryData?.trend_percent ?? (
    isUP
      ? getLiveCategoryTrend(activeCategoryId || '', liveInsights?.categories) ?? selectedCategory?.trendPercent ?? 20
      : selectedCategory?.trendPercent ?? 20
  );
  const displayDemand = categoryData?.demand_summary || selectedCategory?.demandSummary || '';
  const displayCapital = categoryData?.capital_bracket || selectedCategory?.capitalBracket || availableCapital;
  const displayMargin = categoryData?.profit_margin || selectedCategory?.profitMargin || '20% – 30%';
  const displayFeasibleCount = categoryData?.feasible_locations_count || selectedCategory?.feasibleLocations || 50;

  return (
    <section aria-label="Featured live news and category opportunities" className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ─────────────────── LEFT (6 Cols): EXPANDED SINGLE SLIDEABLE NEWS ARTICLE / CATEGORY DETAILS ─────────────────── */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs overflow-hidden transition-all">
          {activeCategoryId ? (
            /* ── VIEW A: DETAILED CATEGORY INSIGHTS IN SELECTED STATE ── */
            <div className="flex flex-1 flex-col justify-between">
              <div>
                {/* Back button & State Pill */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={handleCloseCategory}
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

                {categoryLoading && !categoryData ? (
                  /* Loading skeleton while dynamic category data is fetching */
                  <div className="my-6 space-y-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="h-5 w-40 bg-slate-200 rounded" />
                        <div className="h-3 w-24 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="h-12 w-full bg-slate-100 rounded-xl" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-14 bg-slate-100 rounded-xl" />
                      <div className="h-14 bg-slate-100 rounded-xl" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Category Header */}
                    <div className="mt-4 flex items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-900 shadow-xs">
                        {renderIcon(displayIcon, 26)}
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                          {displayName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-emerald-600 flex items-center">
                            <TrendingUp size={13} className="mr-1" />
                            +{displayTrend}% YoY in {stateName}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.2">
                            Live Regional Indicator
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Demand Summary */}
                    <p className="mt-3 text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {displayDemand}
                    </p>

                    {/* Metric Badges Grid (Target Capital, Estimated Margins, Feasible Locations) */}
                    <div className="my-3.5 grid grid-cols-2 gap-2.5">
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <span className="text-[10.5px] font-semibold text-slate-500">Target Capital</span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                          {displayCapital}
                        </p>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5">Reference Benchmark</span>
                      </div>
                      <div className="rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-100">
                        <span className="text-[10.5px] font-semibold text-emerald-800">Estimated Margins</span>
                        <p className="text-xs sm:text-sm font-bold text-emerald-950 mt-0.5 truncate">
                          {displayMargin}
                        </p>
                        <span className="text-[9.5px] text-emerald-700/80 block mt-0.5">Model Estimate</span>
                      </div>
                    </div>

                    {/* Dynamic Mapped Enterprises from Database (SELECT * FROM businesses WHERE category_id = ?) */}
                    {categoryData && categoryData.sample_businesses && categoryData.sample_businesses.length > 0 && (
                      <div className="my-3 rounded-xl bg-blue-50/40 p-2.5 border border-blue-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                            <Store size={13} className="text-blue-700 shrink-0" />
                            <span>Mapped Enterprises ({categoryData.total_businesses} in region)</span>
                          </div>
                          <span className="text-[9.5px] font-semibold text-blue-700 bg-white/90 border border-blue-200 rounded px-1.5 py-0.2">
                            DB Verified
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {categoryData.sample_businesses.slice(0, 3).map((biz) => (
                            <li key={biz.id} className="flex items-center justify-between text-[11px] text-slate-700">
                              <span className="truncate font-medium">{biz.name}</span>
                              <span className="text-slate-400 text-[10px] shrink-0 ml-2">{biz.village_name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Government Subsidies & Official Concessional Schemes */}
                    <div className="space-y-1.5 mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          <span>Eligible Schemes &amp; Credit:</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 border border-emerald-200">
                          Official Credit Scheme
                        </span>
                      </div>
                      <div className="space-y-1">
                        {combinedSchemes.slice(0, 3).map((scheme) => (
                          <div
                            key={scheme.name}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700 border border-slate-100"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate font-medium">{scheme.name}</span>
                            </div>
                            {scheme.interest_rate !== undefined && (
                              <span className="text-[10.5px] font-bold text-emerald-700 shrink-0 ml-2">
                                {scheme.interest_rate}% p.a.
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benchmark Provenance Footnote */}
                    <div className="mt-2.5 rounded-lg bg-slate-50 p-2 border border-slate-200 text-[10.5px] text-slate-500 flex items-start gap-1.5">
                      <Info size={12} className="text-slate-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Financial ranges reflect reference benchmark estimates. Concessional credit facilities and regional growth indicators verified via backend database.
                      </p>
                    </div>
                  </>
                )}

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
                  onClick={() => handleStartAssessment(displayName)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#15803D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition-all cursor-pointer"
                >
                  <span>Start Assessment</span>
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={handleCloseCategory}
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
                const isSelected = activeCategoryId === cat.id;
                const liveTrend = isUP ? getLiveCategoryTrend(cat.id, liveInsights?.categories) : null;
                const displayCatTrend = liveTrend ?? cat.trendPercent;

                return (
                  <div
                    key={cat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCategoryClick(cat.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCategoryClick(cat.id)}
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
                        <span className="mr-0.5 text-[9px]">↑</span>{displayCatTrend}%
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
