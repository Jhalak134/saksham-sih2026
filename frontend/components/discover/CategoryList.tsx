// components/discover/CategoryList.tsx
// Renders the categories header and 3-column desktop grid.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryCard } from './CategoryCard';
import type { CategoryRow } from '@/lib/discover-types';

interface CategoryListProps {
  readonly categories: readonly CategoryRow[];
  readonly comparedCategories: ReadonlySet<string>;
  readonly onCompareToggle: (category: string) => void;
  readonly onBookmarkToggle?: (category: string) => void;
}

export function CategoryList({
  categories,
  comparedCategories,
  onCompareToggle,
  onBookmarkToggle,
}: CategoryListProps): React.JSX.Element {
  const router = useRouter();

  const handleCardClick = useCallback(
    (category: string) => {
      onCompareToggle(category);
    },
    [onCompareToggle]
  );

  return (
    <section aria-label="Business categories" className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Categories</h2>
        <button
          type="button"
          onClick={() => router.push('/new-assessment')}
          className="flex items-center gap-1 text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
        >
          See all
          <span className="text-xs">→</span>
        </button>
      </div>

      {/* 3-Column Desktop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((row) => (
          <CategoryCard
            key={row.category}
            row={row}
            isCompared={comparedCategories.has(row.category)}
            onCompareToggle={() => onCompareToggle(row.category)}
            onBookmarkToggle={() => onBookmarkToggle?.(row.category)}
            onClick={() => handleCardClick(row.category)}
          />
        ))}
      </div>
    </section>
  );
}
