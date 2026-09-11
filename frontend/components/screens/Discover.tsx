// components/screens/Discover.tsx
// Discover screen matching the approved desktop mockup layout.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useShell } from '@/lib/shell-context';
import { MOCK_INSIGHTS } from '@/data/mockDiscover';
import { TopMovers } from '@/components/discover/TopMovers';
import { IndiaMap } from '@/components/discover/IndiaMap';
import { InsightsPanel } from '@/components/discover/InsightsPanel';
import { CategoryList } from '@/components/discover/CategoryList';
import { CompareBar } from '@/components/discover/CompareBar';

export function DiscoverScreen(): React.JSX.Element {
  const {
    browsingLocation,
    setBrowsingLocation,
    setCompareCount,
    isCategorySaved,
    toggleSaveCategory,
  } = useShell();

  // Selected state on the map
  const [selectedState, setSelectedState] = useState<string | null>(
    MOCK_INSIGHTS.stateSelected
  );

  // Selected district on the state map
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  // Categories selected for comparison
  const [compared, setCompared] = useState<ReadonlySet<string>>(
    new Set(['Dairy', 'Textiles'])
  );

  useEffect(() => {
    setCompareCount(compared.size);
  }, [compared, setCompareCount]);

  const scope = selectedDistrict
    ? `${selectedDistrict}, ${selectedState}`
    : selectedState ?? 'India';
  const movers = MOCK_INSIGHTS.topMovers;

  const handleStateSelect = useCallback(
    (state: string | null) => {
      setSelectedState(state);
      setSelectedDistrict(null);
      if (state) {
        setBrowsingLocation(state);
      } else {
        setBrowsingLocation('Kheragarh');
      }
    },
    [setBrowsingLocation]
  );

  const handleDistrictSelect = useCallback(
    (district: string | null) => {
      setSelectedDistrict(district);
      if (district && selectedState) {
        setBrowsingLocation(`${district}, ${selectedState}`);
      } else if (selectedState) {
        setBrowsingLocation(selectedState);
      } else {
        setBrowsingLocation('Kheragarh');
      }
    },
    [selectedState, setBrowsingLocation]
  );

  const handleCompareToggle = useCallback((category: string) => {
    setCompared((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompared(new Set());
  }, []);

  const categoriesWithBookmarkState = MOCK_INSIGHTS.categories.map((c) => ({
    ...c,
    bookmarked: isCategorySaved(c.category),
  }));

  return (
    <div className="min-h-full w-full bg-[#F8FAFC]/60 px-6 py-6 md:px-8 md:py-7">
      <div className="w-full space-y-6">
        {/* 1. Top Movers Section */}
        <TopMovers movers={movers} scope={scope} />

        {/* 2. Middle Grid: India Map (Left) + Location Insights (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <IndiaMap
            selectedState={selectedState}
            onStateSelect={handleStateSelect}
            selectedDistrict={selectedDistrict}
            onDistrictSelect={handleDistrictSelect}
          />

          <InsightsPanel
            location={browsingLocation}
            data={MOCK_INSIGHTS.insights}
          />
        </div>

        {/* 3. Categories 3-Column Grid */}
        <CategoryList
          categories={categoriesWithBookmarkState}
          comparedCategories={compared}
          onCompareToggle={handleCompareToggle}
          onBookmarkToggle={toggleSaveCategory}
        />

        {/* 4. Comparison Bar at Bottom */}
        <CompareBar selected={compared} onClear={handleClearCompare} />
      </div>
    </div>
  );
}
