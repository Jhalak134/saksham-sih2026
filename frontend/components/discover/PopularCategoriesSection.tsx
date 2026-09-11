// components/discover/PopularCategoriesSection.tsx
// Popular business categories 8-card grid matching the design mockup.

'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
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

export interface PopularCategoryItem {
  readonly id: string;
  readonly name: string;
  readonly growthPercent: number;
  readonly locationsCount: number;
  readonly iconType: 'dairy' | 'textiles' | 'retail' | 'agri' | 'food' | 'handicrafts' | 'solar' | 'services';
}

export const DEFAULT_POPULAR_CATEGORIES: readonly PopularCategoryItem[] = [
  {
    id: 'dairy',
    name: 'Dairy & Livestock',
    growthPercent: 34,
    locationsCount: 5,
    iconType: 'dairy',
  },
  {
    id: 'textiles',
    name: 'Textiles & Handloom',
    growthPercent: 21,
    locationsCount: 3,
    iconType: 'textiles',
  },
  {
    id: 'retail',
    name: 'Retail & Kirana',
    growthPercent: 6,
    locationsCount: 8,
    iconType: 'retail',
  },
  {
    id: 'agri',
    name: 'Agri Processing',
    growthPercent: 18,
    locationsCount: 4,
    iconType: 'agri',
  },
  {
    id: 'food',
    name: 'Food & Beverages',
    growthPercent: 12,
    locationsCount: 6,
    iconType: 'food',
  },
  {
    id: 'handicrafts',
    name: 'Handicrafts',
    growthPercent: 15,
    locationsCount: 3,
    iconType: 'handicrafts',
  },
  {
    id: 'solar',
    name: 'Solar & Clean Energy',
    growthPercent: 28,
    locationsCount: 4,
    iconType: 'solar',
  },
  {
    id: 'services',
    name: 'Services & Repairs',
    growthPercent: 9,
    locationsCount: 7,
    iconType: 'services',
  },
];

function renderCategoryIcon(type: PopularCategoryItem['iconType']): React.JSX.Element {
  switch (type) {
    case 'dairy':
      return <MilkCartonIcon size={24} className="text-slate-800" />;
    case 'textiles':
      return <SpoolIcon size={24} className="text-slate-800" />;
    case 'retail':
      return <StoreIcon size={24} className="text-slate-800" />;
    case 'agri':
      return <LeafIcon size={24} className="text-slate-800" />;
    case 'food':
      return <UtensilsIcon size={24} className="text-slate-800" />;
    case 'handicrafts':
      return <PotteryIcon size={24} className="text-slate-800" />;
    case 'solar':
      return <SolarSunIcon size={24} className="text-slate-800" />;
    case 'services':
      return <WrenchToolIcon size={24} className="text-slate-800" />;
    default:
      return <LeafIcon size={24} className="text-slate-800" />;
  }
}

interface PopularCategoriesSectionProps {
  readonly onCategorySelect?: (categoryName: string) => void;
}

export function PopularCategoriesSection({
  onCategorySelect,
}: PopularCategoriesSectionProps): React.JSX.Element {
  const router = useRouter();

  const handleCardClick = (categoryName: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryName);
    } else {
      router.push(`/new-assessment?idea=${encodeURIComponent(categoryName)}`);
    }
  };

  return (
    <section aria-label="Popular business categories" className="w-full">
      {/* Header */}
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-base md:text-lg font-bold text-slate-900">
          Popular business categories
        </h2>
        <button
          type="button"
          onClick={() => router.push('/new-assessment')}
          className="flex items-center gap-1 text-xs md:text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md"
        >
          <span>View all categories</span>
          <span className="text-xs">→</span>
        </button>
      </div>

      {/* 2 rows x 4 columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
        {DEFAULT_POPULAR_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(cat.name)}
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick(cat.name)}
            aria-label={`${cat.name} category`}
            className="group relative flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm cursor-pointer"
          >
            {/* Left: Icon */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-emerald-50/60 group-hover:border-emerald-200 transition-colors">
                {renderCategoryIcon(cat.iconType)}
              </div>

              {/* Title & Growth Subtext */}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                  {cat.name}
                </h3>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <span className="mr-0.5 text-[10px]">↑</span>
                    {cat.growthPercent}%
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                  Feasible at {cat.locationsCount} locations near you
                </p>
              </div>
            </div>

            {/* Right Chevron */}
            <div className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all pl-2 shrink-0">
              <ChevronRight size={16} strokeWidth={2.2} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
