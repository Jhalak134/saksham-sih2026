// components/discover/CategoryCard.tsx
// Category card matching the 3-column desktop layout in the approved mockup.

'use client';

import { ChevronRight, Bookmark } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Sparkline } from './Sparkline';
import { getCategoryIcon } from './CategoryIcons';
import type { CategoryRow } from '@/lib/discover-types';

interface CategoryCardProps {
  readonly row: CategoryRow;
  readonly isCompared: boolean;
  readonly onCompareToggle: () => void;
  readonly onBookmarkToggle: () => void;
  readonly onClick: () => void;
}

export function CategoryCard({
  row,
  onBookmarkToggle,
  onClick,
}: CategoryCardProps): React.JSX.Element {
  const isUp = row.direction === 'up';
  const isDown = row.direction === 'down';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`${row.category} category card`}
      className="group relative flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm cursor-pointer"
    >
      {/* Left side: Icon + Name & Description */}
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFC] text-slate-800 border border-slate-100 group-hover:bg-slate-100 transition-colors">
          {getCategoryIcon(row.category, 24, 'text-slate-800')}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 truncate">
            {row.category}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 leading-snug line-clamp-2">
            {row.description}
          </p>
        </div>
      </div>

      {/* Right side: Sparkline + Trend Text + Bookmark + Chevron */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <div className="hidden sm:flex">
          <Sparkline
            values={row.sparkline}
            direction={row.direction}
            width={52}
            height={24}
            fill={false}
          />
        </div>

        <div className="flex flex-col items-end whitespace-nowrap min-w-[56px]">
          <span
            className={cn(
              'text-xs font-bold',
              isUp ? 'text-[#2563EB]' : isDown ? 'text-slate-700' : 'text-slate-500'
            )}
          >
            {isUp && '▲ '}
            {isDown && '▼ '}
            {Math.abs(row.trendPercent)}%
          </span>
          {row.tag && (
            <span className="text-[11px] font-medium text-slate-500">
              {row.tag}
            </span>
          )}
        </div>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBookmarkToggle();
          }}
          aria-label={
            row.bookmarked
              ? `Remove ${row.category} from saved`
              : `Save ${row.category} category`
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:scale-110 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Bookmark
            size={18}
            className={cn(
              row.bookmarked
                ? 'fill-[#FACC15] text-[#FACC15]'
                : 'text-slate-400 hover:text-amber-500'
            )}
            aria-hidden="true"
          />
        </button>

        <div className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all">
          <ChevronRight size={16} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
