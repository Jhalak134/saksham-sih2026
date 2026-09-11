// components/saved/SavedView.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { SavedCategoryCard } from './SavedCategoryCard';
import { ExploreBanner } from './ExploreBanner';
import { EmptySavedState } from './EmptySavedState';
import type { CategoryRow } from '@/lib/discover-types';

export type SortOption = 'growth-desc' | 'name-asc' | 'name-desc';

export function SavedView(): React.JSX.Element {
  const { savedCategories, toggleSaveCategory } = useShell();
  const [sortBy, setSortBy] = useState<SortOption>('growth-desc');

  function handleBookmarkToggle(categoryName: string): void {
    toggleSaveCategory(categoryName);
  }

  const sortedCategories = useMemo(() => {
    const list = [...savedCategories];
    if (sortBy === 'growth-desc') {
      return list.sort((a, b) => b.trendPercent - a.trendPercent);
    }
    if (sortBy === 'name-asc') {
      return list.sort((a, b) => a.category.localeCompare(b.category));
    }
    if (sortBy === 'name-desc') {
      return list.sort((a, b) => b.category.localeCompare(a.category));
    }
    return list;
  }, [savedCategories, sortBy]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Saved
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Categories you’ve bookmarked to revisit.
          </p>
        </div>

        {/* Sort by Dropdown */}
        {savedCategories.length > 0 && (
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort saved categories"
              className="appearance-none rounded-xl border border-slate-200/90 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="growth-desc">Sort by: Highest growth</option>
              <option value="name-asc">Sort by: Name (A-Z)</option>
              <option value="name-desc">Sort by: Name (Z-A)</option>
            </select>
            <ChevronDown
              size={15}
              strokeWidth={2}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {sortedCategories.length === 0 ? (
        <EmptySavedState />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedCategories.map((cat) => (
              <SavedCategoryCard
                key={cat.category}
                category={cat}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </div>

          {/* Explore More Banner */}
          <ExploreBanner />
        </div>
      )}
    </div>
  );
}
