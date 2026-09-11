// components/discover/FeaturedArticleTrendsSection.tsx
// Bottom section: Featured article hero card + 3 category trend cards (Textiles, Retail, Agri Processing).

'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowRight, TrendingUp } from 'lucide-react';
import { SpoolIcon, StoreIcon, LeafIcon } from './CategoryIcons';
import { getStateOpportunityProfile } from '@/data/stateOpportunitiesData';

interface FeaturedArticleTrendsSectionProps {
  readonly stateName?: string;
  readonly availableCapital?: string;
  readonly onCategorySelect?: (category: string) => void;
}

export function FeaturedArticleTrendsSection({
  stateName = 'Uttar Pradesh',
  availableCapital = '₹1,00,000',
  onCategorySelect,
}: FeaturedArticleTrendsSectionProps): React.JSX.Element {
  const router = useRouter();
  const profile = getStateOpportunityProfile(stateName);
  const article = profile.featuredArticle;

  const handleHeroAction = () => {
    router.push(
      `/new-assessment?idea=${encodeURIComponent(profile.topCategory)}&state=${encodeURIComponent(profile.name)}`
    );
  };

  const handleTrendClick = (catName: string) => {
    if (onCategorySelect) {
      onCategorySelect(catName);
    } else {
      router.push(`/new-assessment?idea=${encodeURIComponent(catName)}&state=${encodeURIComponent(profile.name)}`);
    }
  };

  return (
    <section aria-label="Featured insights and top movers" className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ─────────────────── LEFT: FEATURED ARTICLE HERO BANNER ─────────────────── */}
        <div className="lg:col-span-8 flex flex-col md:flex-row items-stretch rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300">
          {/* Image Container */}
          <div className="relative w-full md:w-5/12 min-h-[200px] md:min-h-[250px] bg-slate-100 shrink-0">
            <Image
              src="/images/dairy-farmer.jpg"
              alt="Rural entrepreneur in Uttar Pradesh tending dairy cows"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 40vw"
              priority
            />
          </div>

          {/* Text Content */}
          <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
            <div>
              {/* Rising Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-xs">
                <TrendingUp size={13} className="text-emerald-600" />
                <span>{article.badge}</span>
              </div>

              {/* Main Headline */}
              <h3 className="mt-3 text-lg md:text-xl font-bold text-slate-900 leading-snug">
                {article.title}
              </h3>

              {/* Subtitle description */}
              <p className="mt-2 text-xs md:text-sm text-slate-600 leading-relaxed">
                {article.description}
              </p>
            </div>

            {/* CTA Button */}
            <div className="mt-5 pt-3">
              <button
                type="button"
                onClick={handleHeroAction}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs md:text-sm font-bold text-slate-800 shadow-xs transition-all hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.98]"
              >
                <span>See what this means for {availableCapital}</span>
                <ArrowRight size={14} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────── RIGHT: 3 QUICK TREND CARDS ─────────────────── */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3.5">
          {/* 1. Textiles */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleTrendClick('Textiles')}
            onKeyDown={(e) => e.key === 'Enter' && handleTrendClick('Textiles')}
            className="group flex flex-1 items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-emerald-50/60 group-hover:border-emerald-200 transition-colors">
                <SpoolIcon size={24} className="text-slate-800" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Textiles</h4>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <span className="mr-0.5 text-[10px]">↑</span> 21%
                </span>
                <p className="text-[10.5px] text-slate-500">Registrations up in your region</p>
              </div>
            </div>
            <div className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all">
              <ChevronRight size={17} strokeWidth={2.2} />
            </div>
          </div>

          {/* 2. Retail */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleTrendClick('Retail')}
            onKeyDown={(e) => e.key === 'Enter' && handleTrendClick('Retail')}
            className="group flex flex-1 items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-emerald-50/60 group-hover:border-emerald-200 transition-colors">
                <StoreIcon size={24} className="text-slate-800" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Retail</h4>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <span className="mr-0.5 text-[10px]">↑</span> 6%
                </span>
                <p className="text-[10.5px] text-slate-500">Steady demand in nearby districts</p>
              </div>
            </div>
            <div className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all">
              <ChevronRight size={17} strokeWidth={2.2} />
            </div>
          </div>

          {/* 3. Agri Processing */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleTrendClick('Agri Processing')}
            onKeyDown={(e) => e.key === 'Enter' && handleTrendClick('Agri Processing')}
            className="group flex flex-1 items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-emerald-50/60 group-hover:border-emerald-200 transition-colors">
                <LeafIcon size={24} className="text-slate-800" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Agri Processing</h4>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <span className="mr-0.5 text-[10px]">↑</span> 18%
                </span>
                <p className="text-[10.5px] text-slate-500">Growing with new schemes</p>
              </div>
            </div>
            <div className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all">
              <ChevronRight size={17} strokeWidth={2.2} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
