// components/discover/ArticleCategorySection.tsx
// Bottom Section:
// - Left (col-span-6): Single Slideable Live News Article (auto 3s)
// - Right (col-span-6): All 8 Categories in 4X2 grid OR Selected Category real data (4-5 lines in user-friendly language in the same section)
// Connected to backend GET /api/v1/insights/{location} and GET /api/v1/schemes.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
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

interface CategoryFriendlyData {
  readonly demandLine: string;
  readonly capitalLine: string;
  readonly profitLine: string;
  readonly schemesLine: string;
  readonly materialsLine: string;
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

function getCategoryFriendlyLines(
  cat: CategoryDetailData,
  liveTrend: number | null,
  stateName: string
): CategoryFriendlyData {
  const trend = liveTrend ?? cat.trendPercent;

  switch (cat.id) {
    case 'textiles':
      return {
        demandLine: `Steady +${trend}% annual demand in ${stateName} for handloom garments, school uniforms, and local fabrics.`,
        capitalLine: `Initial investment between ${cat.capitalBracket} covers loom equipment, tools, and raw materials.`,
        profitLine: `Expected profit margins of ${cat.profitMargin} with regular sales to regional retail shops and markets.`,
        schemesLine: `Supported by PMEGP 35% rural margin money subsidy, ODOP Textile Cluster Support, and Mudra credit.`,
        materialsLine: `Easily accessible local supplies including ${cat.rawMaterials.toLowerCase()}`,
      };
    case 'retail':
      return {
        demandLine: `Consistent daily household consumption with +${trend}% demand for FMCG, packaged groceries, and daily staples.`,
        capitalLine: `Starting capital of ${cat.capitalBracket} covers initial inventory, racks, and digital billing setup.`,
        profitLine: `Reliable cash-flow returns of ${cat.profitMargin} with fast-moving stock turnover in local hamlets.`,
        schemesLine: `Backed by PM SVANidhi micro credit and collateral-free Mudra Shishu loans up to ₹50,000.`,
        materialsLine: `Direct inventory sourcing from wholesale mandis and FMCG distribution networks.`,
      };
    case 'agri':
      return {
        demandLine: `High +${trend}% regional growth for value-added mini oil expellers, flour milling, and spice packaging.`,
        capitalLine: `Setup investment of ${cat.capitalBracket} depending on machinery capacity and power connection.`,
        profitLine: `Attractive profit margins of ${cat.profitMargin} by eliminating middlemen and selling directly to local retail.`,
        schemesLine: `Eligible for PMFME 35% capital subsidy, Agriculture Infrastructure Fund, and state food policies.`,
        materialsLine: `Abundant locally harvested raw supplies including ${cat.rawMaterials.toLowerCase()}`,
      };
    case 'food':
      return {
        demandLine: `Fast-growing +${trend}% market demand for packaged namkeen, bakery snacks, sweets, and local beverages.`,
        capitalLine: `Startup budget between ${cat.capitalBracket} for kitchen utensils, sealing, and packaging equipment.`,
        profitLine: `Strong profit margins between ${cat.profitMargin} through local tea stalls, kirana stores, and weekly haats.`,
        schemesLine: `Supported by PMFME micro enterprise subsidies, FSSAI rural food safety grants, and Mudra loans.`,
        materialsLine: `Easily sourced raw ingredients including ${cat.rawMaterials.toLowerCase()}`,
      };
    case 'dairy':
      return {
        demandLine: `High daily essential demand with +${trend}% regional growth for fresh milk, paneer, curd, and sweets.`,
        capitalLine: `Initial investment between ${cat.capitalBracket} for high-yield milch cattle, silage, and chilling cans.`,
        profitLine: `Dependable profit margins of ${cat.profitMargin} with guaranteed morning and evening daily cash collections.`,
        schemesLine: `Backed by State Dairy Incentive cattle subsidies, National Livestock Mission, and PMFME grants.`,
        materialsLine: `Key livestock requirements including ${cat.rawMaterials.toLowerCase()}`,
      };
    case 'handicrafts':
      return {
        demandLine: `Expanding +${trend}% demand for terracotta pottery, brass figurines, wood carving, and festival artifacts.`,
        capitalLine: `Low entry barrier requiring ${cat.capitalBracket} for basic toolkits, mini kilns, and packaging materials.`,
        profitLine: `High artisan margins of ${cat.profitMargin} through direct tourist sales, fairs, and urban craft exhibitions.`,
        schemesLine: `Covered under PM Vishwakarma Scheme (free toolkit + ₹3L concessional credit) and ODOP artisan grants.`,
        materialsLine: `Locally available natural materials including ${cat.rawMaterials.toLowerCase()}`,
      };
    case 'solar':
      return {
        demandLine: `Strong +${trend}% surge in rural rooftop solar installations, agricultural solar water pumps, and clean energy care.`,
        capitalLine: `Working capital between ${cat.capitalBracket} for certified solar panels, inverters, and testing tools.`,
        profitLine: `Estimated margins of ${cat.profitMargin} combining upfront equipment installation and ongoing maintenance.`,
        schemesLine: `Substantial government subsidies under PM Surya Ghar (up to ₹78,000) and PM-KUSUM agricultural solar (up to 60%).`,
        materialsLine: `Technical supplies including ${cat.rawMaterials.toLowerCase()}`,
      };
    case 'services':
      return {
        demandLine: `Consistent +${trend}% year-round demand for two-wheeler repair, tractor implements, submersible pumps, and wiring.`,
        capitalLine: `Accessible startup cost of ${cat.capitalBracket} for diagnostic multimeters, welding kits, and fast-moving spare parts.`,
        profitLine: `High service profit margins of ${cat.profitMargin} with immediate daily cash payments and minimal overhead.`,
        schemesLine: `Supported by Skill India PMKVY certification grants and PMEGP service sector margin money subsidy.`,
        materialsLine: `Essential repair tools including ${cat.rawMaterials.toLowerCase()}`,
      };
    default:
      return {
        demandLine: `Growing +${trend}% demand in ${stateName} with steady local consumer adoption across districts.`,
        capitalLine: `Initial capital requirement of ${cat.capitalBracket} tailored for rural small-scale enterprises.`,
        profitLine: `Healthy operating profit margins estimated at ${cat.profitMargin}.`,
        schemesLine: `Eligible for state MSME incentives, PMEGP rural subsidy, and Mudra credit facilities.`,
        materialsLine: `Locally accessible raw materials and tools including ${cat.rawMaterials.toLowerCase()}`,
      };
  }
}

export function ArticleCategorySection({
  stateName = 'Uttar Pradesh',
  selectedDistrict = null,
}: ArticleCategorySectionProps): React.JSX.Element {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);

  // Live backend data states
  const [liveInsights, setLiveInsights] = useState<InsightsResponse | null>(null);
  const [, setLiveSchemes] = useState<OfficialScheme[] | null>(null);
  const [, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isUP =
    stateName.toLowerCase().includes('uttar pradesh') ||
    stateName.toLowerCase() === 'up' ||
    Boolean(selectedDistrict && selectedDistrict.toLowerCase().includes('mathura'));

  const targetLocation = selectedDistrict || stateName || 'Uttar Pradesh';

  const loadCategoryInsights = useCallback(async (isMounted: () => boolean) => {
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
  }, [targetLocation]);

  useEffect(() => {
    let mounted = true;
    loadCategoryInsights(() => mounted);
    return () => {
      mounted = false;
    };
  }, [loadCategoryInsights]);

  const baseCategory = selectedCategoryId ? getCategoryDetail(selectedCategoryId) : null;
  const selectedCategory = baseCategory ? (() => {
    if (!liveInsights?.categories) return baseCategory;
    const idLower = baseCategory.id.toLowerCase();
    for (const c of liveInsights.categories) {
      const cLower = c.name.toLowerCase();
      if (
        cLower.includes(idLower) ||
        idLower.includes(cLower) ||
        (idLower === 'food' && cLower.includes('food')) ||
        (idLower === 'agri' && (cLower.includes('agri') || cLower.includes('food')))
      ) {
        return {
          ...baseCategory,
          capitalBracket: c.capital_bracket || baseCategory.capitalBracket,
          profitMargin: c.profit_margin || baseCategory.profitMargin,
          demandSummary: c.demand_summary || baseCategory.demandSummary,
          applicableSchemes: c.applicable_schemes && c.applicable_schemes.length > 0 ? c.applicable_schemes : baseCategory.applicableSchemes,
        };
      }
    }
    return baseCategory;
  })() : null;

  const liveTrend = selectedCategory ? getLiveCategoryTrend(selectedCategory.id, liveInsights?.categories) : null;
  const displayTrend = selectedCategory ? (liveTrend ?? selectedCategory.trendPercent) : 0;
  const friendly = selectedCategory ? getCategoryFriendlyLines(selectedCategory, liveTrend, stateName) : null;

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
        {/* ── LEFT (6 Cols): SINGLE SLIDEABLE LIVE NEWS ARTICLE (ALWAYS DISPLAYED) ── */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs overflow-hidden transition-all">
          <StateArticles selectedState={stateName} />
        </div>

        {/* ── RIGHT (6 Cols): ALL 8 CATEGORIES GRID OR SELECTED CATEGORY DETAIL IN THE SAME SECTION ── */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all">
          {selectedCategory && friendly ? (
            /* ── VIEW A: CATEGORY DETAIL OPENED IN THE SAME SECTION ── */
            <div className="flex flex-1 flex-col justify-between">
              <div>
                {/* Header: Back Button on Left, Trend Badge on Right */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 transition-colors rounded-lg py-1 px-2 hover:bg-slate-100 cursor-pointer"
                    aria-label="Back to Categories"
                  >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                    <span>All Categories</span>
                  </button>

                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                    <TrendingUp size={12} className="mr-1" />
                    +{displayTrend}% YoY in {stateName}
                  </span>
                </div>

                {/* Category Heading with Icon */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-900 shadow-2xs">
                    {renderIcon(selectedCategory.iconType, 22)}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {selectedCategory.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Key business feasibility &amp; real market data
                    </span>
                  </div>
                </div>

                {/* 4 to 5 lines of real data in user-friendly language */}
                <div className="space-y-2 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/80 text-xs sm:text-[12.5px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <p className="text-slate-700">
                      <strong className="text-slate-900 font-semibold">Market Demand: </strong>
                      {friendly.demandLine}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <p className="text-slate-700">
                      <strong className="text-slate-900 font-semibold">Initial Capital: </strong>
                      {friendly.capitalLine}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <p className="text-slate-700">
                      <strong className="text-slate-900 font-semibold">Profit Margin: </strong>
                      {friendly.profitLine}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <p className="text-slate-700">
                      <strong className="text-slate-900 font-semibold">Government Schemes: </strong>
                      {friendly.schemesLine}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <p className="text-slate-700">
                      <strong className="text-slate-900 font-semibold">Raw Materials: </strong>
                      {friendly.materialsLine}
                    </p>
                  </div>
                </div>

                {/* Coming Soon Notice */}
                {comingSoonMessage && (
                  <div
                    role="alert"
                    className="mt-2.5 flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-900"
                  >
                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{comingSoonMessage}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleStartAssessment(selectedCategory.name)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#15803D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition-all cursor-pointer"
                >
                  <span>Start Assessment</span>
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ) : (
            /* ── VIEW B: ALL BUSINESS CATEGORIES GRID ── */
            <>
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

              {/* 4X2 Category Grid */}
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
                    const catTrend = getLiveCategoryTrend(cat.id, liveInsights?.categories);
                    const catDisplayTrend = catTrend ?? cat.trendPercent;

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
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                            : 'border-slate-200/80 bg-white hover:border-emerald-500 hover:bg-slate-50/70 hover:shadow-xs'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                              isSelected
                                ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                                : 'bg-slate-50 border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-200'
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
                            <span className="mr-0.5 text-[9px]">↑</span>{catDisplayTrend}%
                          </span>
                          <div
                            className={cn(
                              'transition-all',
                              isSelected ? 'text-emerald-700 translate-x-0.5' : 'text-slate-300 group-hover:text-emerald-700'
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
