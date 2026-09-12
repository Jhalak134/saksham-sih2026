// components/screens/Discover.tsx
// Discover screen:
// 1. TOP HALF: 3-Level IndiaMap Heatmap (Left) + Dynamic State/District Info Bar (Right)
// 2. BOTTOM HALF: Space for Featured Article / Category Details (Left) + 4 Categories with "See all" scroll (Right)

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useShell } from '@/lib/shell-context';
import { IndiaMap } from '@/components/discover/IndiaMap';
import { StateInsightsBar } from '@/components/discover/StateInsightsBar';
import { ArticleCategorySection } from '@/components/discover/ArticleCategorySection';
import { CompareBar } from '@/components/discover/CompareBar';

export function DiscoverScreen(): React.JSX.Element {
  const {
    browsingLocation,
    setBrowsingLocation,
    setCompareCount,
    capital,
  } = useShell();

  // Selected state on the map - defaults to null so Level 1 National Heatmap loads first!
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Selected district on the state map (e.g. Mathura)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  // Compared categories
  const [compared, setCompared] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    setCompareCount(compared.size);
  }, [compared, setCompareCount]);

  const handleStateSelect = useCallback(
    (state: string | null) => {
      setSelectedState(state);
      setSelectedDistrict(null);
      if (state) {
        setBrowsingLocation(state);
      } else {
        setBrowsingLocation('Uttar Pradesh');
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
        setBrowsingLocation('Uttar Pradesh');
      }
    },
    [selectedState, setBrowsingLocation]
  );

  const handleClearCompare = useCallback(() => {
    setCompared(new Set());
  }, []);

  const formattedCapital = capital ? `₹${capital.toLocaleString('en-IN')}` : '₹1,00,000';

  return (
    <div className="min-h-full w-full bg-[#F8FAFC]/60 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
      <div className="w-full space-y-6 md:space-y-8">
        {/* 1. TOP HALF: 3-Level Interactive Map Heatmap (Left) + Dynamic State Info Bar (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7">
            <IndiaMap
              selectedState={selectedState}
              onStateSelect={handleStateSelect}
              selectedDistrict={selectedDistrict}
              onDistrictSelect={handleDistrictSelect}
            />
          </div>
          <div className="lg:col-span-5">
            <StateInsightsBar
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              browsingLocation={browsingLocation}
              availableCapital={formattedCapital}
            />
          </div>
        </div>

        {/* 2. BOTTOM HALF: Space for Live News Carousel / Category Details (Left) + 4 Categories with "See all" scroll (Right) */}
        <ArticleCategorySection
          stateName={selectedState ?? 'Uttar Pradesh'}
          selectedDistrict={selectedDistrict}
          availableCapital={formattedCapital}
        />

        {/* 3. Bottom comparison bar if items are compared */}
        {compared.size > 0 && (
          <CompareBar selected={compared} onClear={handleClearCompare} />
        )}
      </div>
    </div>
  );
}
