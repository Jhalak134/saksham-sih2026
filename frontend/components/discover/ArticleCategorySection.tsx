// components/discover/ArticleCategorySection.tsx
// Bottom Section:
// - Left (col-span-6): Expanded space for Single Slideable Live News Article (auto 3s) or Selected Category Details per State
// - Right (col-span-6): All 8 Categories in a clean, compact 4X2 grid (normal spacing, full category titles, no huge gaps)

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { StateArticles } from './StateArticles';
import {
  ALL_CATEGORY_DETAILS,
  getCategoryDetail,
  type CategoryDetailData,
} from '@/data/categoryStateData';
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

export function ArticleCategorySection({
  stateName = 'Uttar Pradesh',
  availableCapital = '₹1,00,000',
}: ArticleCategorySectionProps): React.JSX.Element {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);

  const isUP =
    stateName.toLowerCase().includes('uttar pradesh') ||
    stateName.toLowerCase() === 'up';

  const selectedCategory = selectedCategoryId ? getCategoryDetail(selectedCategoryId) : null;

  const handleStartAssessment = (ideaName: string) => {
    if (isUP) {
      setComingSoonMessage(null);
      router.push(`/new-assessment?idea=${encodeURIComponent(ideaName)}&state=${encodeURIComponent(stateName)}`);
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
                    <span>{stateName} Market</span>
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
                      <span className="text-xs font-bold text-emerald-600 flex items-center">
                        <TrendingUp size={13} className="mr-1" />
                        <AnimatedCounter
                          key={selectedCategory.id}
                          value={selectedCategory.trendPercent}
                          prefix="+"
                          suffix="%"
                        />
                        <span className="ml-1">YoY in {stateName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Demand Summary */}
                <p className="mt-3 text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {selectedCategory.demandSummary}
                </p>

                {/* Metric Badges Grid */}
                <div className="my-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10.5px] font-semibold text-slate-500">Target Capital</span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                      {selectedCategory.capitalBracket}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                    <span className="text-[10.5px] font-semibold text-emerald-800">Estimated Margins</span>
                    <p className="text-xs sm:text-sm font-bold text-emerald-950 mt-0.5 truncate">
                      {selectedCategory.profitMargin}
                    </p>
                  </div>
                </div>

                {/* Government Subsidies */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Eligible Schemes & Grants:</span>
                  </div>
                  <div className="space-y-1">
                    {selectedCategory.applicableSchemes.slice(0, 2).map((scheme) => (
                      <div
                        key={scheme}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700 border border-slate-100"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{scheme}</span>
                      </div>
                    ))}
                  </div>
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
            <h4 className="text-sm md:text-base font-bold text-slate-900">
              All Business Categories
            </h4>
            <span className="text-xs font-medium text-slate-400">Click to view details</span>
          </div>

          {/* 4X2 Category Grid (4 rows x 2 columns with normal spacing and full titles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
            {ALL_CATEGORY_DETAILS.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;

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
                      <span className="mr-0.5 text-[9px]">↑</span>
                      <AnimatedCounter
                        key={cat.id}
                        value={cat.trendPercent}
                        suffix="%"
                      />
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
        </div>
      </div>
    </section>
  );
}
