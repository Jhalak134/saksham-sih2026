// components/saved/SavedCategoryCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, ChevronRight } from 'lucide-react';
import { Sparkline } from '@/components/discover/Sparkline';
import { getCategoryIcon } from '@/components/discover/CategoryIcons';
import type { CategoryRow } from '@/lib/discover-types';
import { cn } from '@/lib/cn';

interface SavedCategoryCardProps {
  category: CategoryRow;
  onBookmarkToggle: (categoryName: string) => void;
}

interface ThemeConfig {
  bg: string;
  text: string;
  border: string;
}

function getIconTheme(name: string): ThemeConfig {
  const lower = name.toLowerCase();
  if (lower.includes('dairy') || lower.includes('milk')) {
    return { bg: 'bg-sky-100/70', text: 'text-sky-700', border: 'border-sky-200/60' };
  }
  if (lower.includes('tailor') || lower.includes('garment') || lower.includes('textile')) {
    return { bg: 'bg-amber-100/70', text: 'text-amber-800', border: 'border-amber-200/60' };
  }
  if (lower.includes('retail') || lower.includes('store') || lower.includes('shop')) {
    return { bg: 'bg-rose-100/70', text: 'text-rose-700', border: 'border-rose-200/60' };
  }
  if (lower.includes('food') || lower.includes('process')) {
    return { bg: 'bg-emerald-100/70', text: 'text-emerald-700', border: 'border-emerald-200/60' };
  }
  return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
}

function getTagClass(tag: string | null): string {
  if (!tag) return 'bg-slate-100 text-slate-700';
  const lower = tag.toLowerCase();
  if (lower.includes('high') || lower.includes('grow')) {
    return 'bg-sky-100/70 text-sky-700';
  }
  return 'bg-slate-100 text-slate-600';
}

export function SavedCategoryCard({
  category,
  onBookmarkToggle,
}: SavedCategoryCardProps): React.JSX.Element {
  const theme = getIconTheme(category.category);
  const tagClass = getTagClass(category.tag);

  return (
    <div className="group relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs">
      {/* Clickable Area: Left details */}
      <Link
        href={`/new-assessment?category=${encodeURIComponent(category.category)}`}
        className="flex flex-1 items-start sm:items-center gap-3.5 min-w-0"
        aria-label={`View details for ${category.category}`}
      >
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors',
            theme.bg,
            theme.text,
            theme.border
          )}
          aria-hidden="true"
        >
          {getCategoryIcon(category.category, 24, theme.text)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
            {category.category}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        </div>
      </Link>

      {/* Metrics & Actions */}
      <div className="flex shrink-0 items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {/* Trend + Sparkline + Tag */}
        <div className="flex flex-col items-start sm:items-end">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB]">
            <span>▲</span>
            <span>{category.trendPercent}%</span>
          </div>

          <div className="my-0.5 flex items-center gap-1">
            <span className="text-[10px] sm:text-[11px] text-slate-400">Market growth</span>
            <div className="hidden sm:block">
              <Sparkline
                values={category.sparkline}
                direction={category.direction}
                width={48}
                height={18}
                fill={false}
              />
            </div>
          </div>

          {category.tag && (
            <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', tagClass)}>
              {category.tag}
            </span>
          )}
        </div>

        {/* Bookmark button + Navigation Chevron */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBookmarkToggle(category.category);
            }}
            aria-label={`Remove ${category.category} from saved`}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#FACC15] hover:scale-110 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Bookmark size={20} className="fill-[#FACC15] text-[#FACC15]" aria-hidden="true" />
          </button>

          <Link
            href={`/new-assessment?category=${encodeURIComponent(category.category)}`}
            aria-label={`Go to assessment for ${category.category}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
          >
            <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
