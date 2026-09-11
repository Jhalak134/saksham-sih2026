// components/discover/ArticleCategorySection.tsx
// Bottom Section:
// - Left: Space for Featured Article or Selected Category Details per State
// - Right: 4 Category cards with "See all" button that unlocks a scrollable list of all categories

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
  Coins,
  MapPin,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  ALL_CATEGORY_DETAILS,
  getCategoryDetail,
  type CategoryDetailData,
} from '@/data/categoryStateData';
import { getStateOpportunityProfile } from '@/data/stateOpportunitiesData';
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

function renderIcon(type: CategoryDetailData['iconType'], size = 24): React.JSX.Element {
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);

  const profile = getStateOpportunityProfile(stateName);
  const article = profile.featuredArticle;

  const isUP =
    stateName.toLowerCase().includes('uttar pradesh') ||
    stateName.toLowerCase() === 'up';

  const selectedCategory = selectedCategoryId ? getCategoryDetail(selectedCategoryId) : null;

  // Initial list is 4 categories; expanded list shows all 8
  const displayedCategories = isExpanded
    ? ALL_CATEGORY_DETAILS
    : ALL_CATEGORY_DETAILS.slice(0, 4);

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
    <section aria-label="Featured article and category opportunities" className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ─────────────────── LEFT: SPACE FOR ARTICLES OR CATEGORY DETAILS ─────────────────── */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all">
          {selectedCategory ? (
            /* ── VIEW A: DETAILED CATEGORY INSIGHTS IN SELECTED STATE ── */
            <div className="flex flex-1 flex-col justify-between p-5 md:p-7">
              <div>
                {/* Back button & State Pill */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md py-1 pr-2"
                  >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                    <span>Back to Featured Story</span>
                  </button>

                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <MapPin size={12} className="text-emerald-600" />
                    <span>{stateName} Market</span>
                  </div>
                </div>

                {/* Category Header */}
                <div className="mt-4 flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-900 shadow-xs">
                    {renderIcon(selectedCategory.iconType, 28)}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">
                      {selectedCategory.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-emerald-600 flex items-center">
                        <TrendingUp size={13} className="mr-1" />
                        +{selectedCategory.trendPercent}% YoY Registrations in {stateName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Demand Summary */}
                <p className="mt-3 text-xs md:text-sm text-slate-600 leading-relaxed">
                  {selectedCategory.demandSummary}
                </p>

                {/* Metric Badges Grid */}
                <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10.5px] font-semibold text-slate-500">Target Capital</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedCategory.capitalBracket}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                    <span className="text-[10.5px] font-semibold text-emerald-800">Estimated Margins</span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">
                      {selectedCategory.profitMargin}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10.5px] font-semibold text-slate-500">Feasible Units Near You</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedCategory.feasibleLocations} locations
                    </p>
                  </div>
                </div>

                {/* Government Subsidies */}
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Eligible Schemes & Grants:</span>
                  </div>
                  <div className="space-y-1">
                    {selectedCategory.applicableSchemes.map((scheme) => (
                      <div
                        key={scheme}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px] text-slate-700 border border-slate-100/90"
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
                    className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900"
                  >
                    <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold">Pilot Boundary: </span>
                      <span>{comingSoonMessage}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStartAssessment(selectedCategory.name)}
                  className="flex items-center gap-2 rounded-xl bg-[#15803D] px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-xs hover:bg-[#166534] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.98]"
                >
                  <span>Start Assessment for {selectedCategory.name}</span>
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs md:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          ) : (
            /* ── VIEW B: DEFAULT FEATURED ARTICLE HERO BANNER ── */
            <div className="flex flex-col md:flex-row items-stretch h-full">
              {/* Photo Image Container */}
              <div className="relative w-full md:w-5/12 min-h-[220px] md:min-h-[280px] bg-slate-100 shrink-0">
                <Image
                  src="/images/dairy-farmer.jpg"
                  alt="Rural entrepreneur in Uttar Pradesh tending dairy cows"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
              </div>

              {/* Article Content */}
              <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                <div>
                  {/* Rising Badge */}
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-xs">
                    <TrendingUp size={13} className="text-emerald-600" />
                    <span>{article.badge}</span>
                  </div>

                  {/* Headline */}
                  <h3 className="mt-3 text-lg md:text-xl font-bold text-slate-900 leading-snug">
                    {article.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="mt-2 text-xs md:text-sm text-slate-600 leading-relaxed">
                    {article.description}
                  </p>

                  {/* Coming Soon Notice (if triggered) */}
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

                {/* CTA Button */}
                <div className="mt-5 pt-3">
                  <button
                    type="button"
                    onClick={() => handleStartAssessment(profile.topCategory)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs md:text-sm font-bold text-slate-800 shadow-xs transition-all hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.98]"
                  >
                    <span>See what this means for {availableCapital}</span>
                    <ArrowRight size={14} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────── RIGHT: 4 CATEGORIES (EXPANDABLE TO ALL) ─────────────────── */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800">
              {isExpanded ? 'All Business Categories' : 'Top Categories in Region'}
            </h4>
            <span className="text-[10.5px] text-slate-400">Click to view details</span>
          </div>

          {/* Categories List (Scrollable if expanded) */}
          <div
            className={cn(
              'space-y-2.5 transition-all duration-200',
              isExpanded && 'max-h-[380px] overflow-y-auto pr-1'
            )}
          >
            {displayedCategories.map((cat) => {
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
                    'group flex items-center justify-between rounded-xl border p-3.5 shadow-xs transition-all cursor-pointer',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-400'
                      : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-slate-50/70'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                        isSelected
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                          : 'bg-slate-50 border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-200'
                      )}
                    >
                      {renderIcon(cat.iconType, 22)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                        {cat.name}
                      </h5>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                        <span className="mr-0.5 text-[9px]">↑</span> {cat.trendPercent}%
                      </span>
                      <p className="text-[10px] text-slate-500 truncate">{cat.subtitle}</p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'transition-all pl-2 shrink-0',
                      isSelected ? 'text-emerald-700 translate-x-0.5' : 'text-slate-400 group-hover:text-emerald-700'
                    )}
                  >
                    <ChevronRight size={16} strokeWidth={2.2} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* "See all categories" / "Show less" Expand Toggle Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
            >
              <span>{isExpanded ? 'Show less categories' : 'See all categories'}</span>
              {isExpanded ? (
                <ChevronUp size={14} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={14} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
