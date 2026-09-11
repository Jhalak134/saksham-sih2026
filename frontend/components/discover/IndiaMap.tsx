// components/discover/IndiaMap.tsx
// Interactive India & State Vector Maps with district drill-down and location pins.

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { INDIA_STATES, INDIA_VIEWBOX, type MapLocation } from '@/data/indiaMapData';
import { getStateDistricts, type DistrictLocation } from '@/data/stateDistrictsData';
import { Plus, Minus, X, ArrowLeft, MapPin, Search, RotateCcw } from 'lucide-react';

interface IndiaMapProps {
  readonly selectedState: string | null;
  readonly onStateSelect: (state: string | null) => void;
  readonly selectedDistrict?: string | null;
  readonly onDistrictSelect?: (district: string | null) => void;
}

export function IndiaMap({
  selectedState,
  onStateSelect,
  selectedDistrict = null,
  onDistrictSelect,
}: IndiaMapProps): React.JSX.Element {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictLocation | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const stateData = useMemo(() => {
    return selectedState ? getStateDistricts(selectedState) : null;
  }, [selectedState]);

  const filteredDistricts = useMemo(() => {
    if (!stateData) return [];
    if (!districtFilter.trim()) return stateData.districts;
    const query = districtFilter.trim().toLowerCase();
    return stateData.districts.filter((d) =>
      d.name.toLowerCase().includes(query) ||
      (d.tag && d.tag.toLowerCase().includes(query))
    );
  }, [stateData, districtFilter]);

  function handleStateClick(name: string): void {
    if (selectedState && selectedState.toLowerCase() === name.toLowerCase()) {
      onStateSelect(null);
    } else {
      onStateSelect(name);
      setDistrictFilter('');
      setZoomLevel(1);
    }
  }

  function handleDistrictClick(districtName: string): void {
    if (onDistrictSelect) {
      if (selectedDistrict && selectedDistrict.toLowerCase() === districtName.toLowerCase()) {
        onDistrictSelect(null);
      } else {
        onDistrictSelect(districtName);
      }
    }
  }

  function handleZoomIn(): void {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  }

  function handleZoomOut(): void {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  }

  function handleResetZoom(): void {
    setZoomLevel(1);
  }

  return (
    <div className="relative flex h-full min-h-[440px] md:min-h-[500px] w-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 md:p-5 shadow-xs overflow-hidden">
      {/* Top Header / Navigation Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        {selectedState && stateData ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onStateSelect(null);
                if (onDistrictSelect) onDistrictSelect(null);
                setDistrictFilter('');
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-label="Back to India Map"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>All India</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900">{selectedState}</span>
              <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200/80">
                {stateData.districtCount} Districts
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">India Overview</h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Click any state to explore districts & pins
            </span>
          </div>
        )}

        {/* Selected State & District Chips */}
        <div className="flex items-center gap-2">
          {selectedState && (
            <div className="flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 shadow-xs">
              <span>{selectedState}</span>
              <button
                type="button"
                onClick={() => {
                  onStateSelect(null);
                  if (onDistrictSelect) onDistrictSelect(null);
                }}
                aria-label={`Remove ${selectedState} filter`}
                className="flex h-3.5 w-3.5 items-center justify-center rounded text-sky-600 hover:text-sky-900 transition-colors"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {selectedDistrict && onDistrictSelect && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-xs">
              <MapPin size={11} className="text-amber-600" />
              <span>{selectedDistrict}</span>
              <button
                type="button"
                onClick={() => onDistrictSelect(null)}
                aria-label={`Remove ${selectedDistrict} filter`}
                className="flex h-3.5 w-3.5 items-center justify-center rounded text-amber-700 hover:text-amber-950 transition-colors"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* State View Filter Input (if in state mode) */}
      {selectedState && stateData && (
        <div className="relative z-10 mt-2 px-1">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              placeholder={`Filter ${stateData.districtCount} districts...`}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
            />
            {districtFilter && (
              <button
                type="button"
                onClick={() => setDistrictFilter('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600"
                aria-label="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Zoom Controls on Left */}
      <div className="absolute left-4 bottom-4 z-20 flex flex-col rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Plus size={14} strokeWidth={2.2} />
        </button>
        <div className="h-px w-full bg-slate-200" />
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Minus size={14} strokeWidth={2.2} />
        </button>
        {zoomLevel !== 1 && (
          <>
            <div className="h-px w-full bg-slate-200" />
            <button
              type="button"
              onClick={handleResetZoom}
              aria-label="Reset zoom"
              className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw size={12} strokeWidth={2.2} />
            </button>
          </>
        )}
      </div>

      {/* Main Vector Map Display */}
      <div className="relative flex flex-1 h-full w-full items-center justify-center py-2 overflow-hidden">
        {selectedState && stateData ? (
          /* ── STATE DISTRICT LEVEL MAP ── */
          <svg
            viewBox={stateData.viewBox}
            preserveAspectRatio="xMidYMid meet"
            className="h-full max-h-[440px] w-full transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
            role="img"
            aria-label={`${selectedState} District Map`}
          >
            {/* District Polygons */}
            <g id="state-districts">
              {filteredDistricts.map((district: DistrictLocation) => {
                const isSelected =
                  selectedDistrict !== null &&
                  selectedDistrict.toLowerCase() === district.name.toLowerCase();
                const isHovered = hoveredDistrict?.id === district.id;

                return (
                  <path
                    key={district.id}
                    id={`dist-${district.id}`}
                    d={district.path}
                    aria-label={district.name}
                    onClick={() => handleDistrictClick(district.name)}
                    onMouseEnter={() => setHoveredDistrict(district)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                    className={cn(
                      'cursor-pointer transition-colors duration-150 focus:outline-none',
                      isSelected
                        ? 'fill-[#BFDBFE] stroke-[#1D4ED8] stroke-[2]'
                        : isHovered
                        ? 'fill-[#E0F2FE] stroke-[#0284C7] stroke-[1.8]'
                        : district.hub
                        ? 'fill-[#F8FAFC] stroke-[#64748B] stroke-[1.2] hover:fill-[#E0F2FE]'
                        : 'fill-[#FFFFFF] stroke-[#94A3B8] stroke-[1] hover:fill-[#F1F5F9]'
                    )}
                  >
                    <title>{district.name}{district.tag ? ` (${district.tag})` : ''}</title>
                  </path>
                );
              })}
            </g>

            {/* District Centroid Location Pins */}
            <g id="district-pins" className="pointer-events-none">
              {filteredDistricts.map((district: DistrictLocation) => {
                const isSelected =
                  selectedDistrict !== null &&
                  selectedDistrict.toLowerCase() === district.name.toLowerCase();
                const isHovered = hoveredDistrict?.id === district.id;
                const showHub = district.hub;

                return (
                  <g
                    key={`pin-${district.id}`}
                    transform={`translate(${district.center.x}, ${district.center.y})`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => handleDistrictClick(district.name)}
                    onMouseEnter={() => setHoveredDistrict(district)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Pin for ${district.name}`}
                  >
                    {/* Animated Pulse Ring for Hub Districts */}
                    {showHub && (
                      <circle
                        r={isSelected || isHovered ? 14 : 9}
                        className={cn(
                          'animate-ping opacity-30',
                          isSelected ? 'fill-blue-600' : 'fill-amber-500'
                        )}
                      />
                    )}

                    {/* Outer Pin Body */}
                    <circle
                      r={isSelected || isHovered ? 9 : showHub ? 7 : 5}
                      className={cn(
                        'transition-all duration-150',
                        isSelected
                          ? 'fill-[#2563EB] stroke-white stroke-[2]'
                          : isHovered
                          ? 'fill-[#0284C7] stroke-white stroke-[1.5]'
                          : showHub
                          ? 'fill-[#D97706] stroke-white stroke-[1.5]'
                          : 'fill-[#64748B] stroke-white stroke-[1]'
                      )}
                    />

                    {/* Inner Dot */}
                    <circle
                      r={isSelected || isHovered ? 3.5 : showHub ? 2.5 : 1.8}
                      className="fill-white"
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        ) : (
          /* ── ALL INDIA NATIONAL MAP ── */
          <svg
            viewBox={INDIA_VIEWBOX}
            preserveAspectRatio="xMidYMid meet"
            className="h-full max-h-[450px] w-full transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
            role="img"
            aria-label="Interactive India Map"
          >
            <g id="india-states">
              {INDIA_STATES.map((state: MapLocation) => {
                const isSelected =
                  selectedState !== null &&
                  (selectedState.toLowerCase() === state.name.toLowerCase() ||
                    (selectedState.toLowerCase().includes('uttar pradesh') && state.id === 'up'));

                const isHovered = hoveredState === state.id;

                return (
                  <path
                    key={state.id}
                    id={state.id}
                    d={state.path}
                    aria-label={state.name}
                    onClick={() => handleStateClick(state.name)}
                    onMouseEnter={() => setHoveredState(state.id)}
                    onMouseLeave={() => setHoveredState(null)}
                    className={cn(
                      'cursor-pointer transition-colors duration-150 focus:outline-none',
                      isSelected
                        ? 'fill-[#BFDBFE] stroke-[#1D4ED8] stroke-[2]'
                        : isHovered
                        ? 'fill-[#E0F2FE] stroke-[#0284C7] stroke-[1.8]'
                        : 'fill-[#F8FAFC] stroke-[#64748B] stroke-[1.2] hover:fill-[#E0F2FE]'
                    )}
                  >
                    <title>{state.name} — Click to explore districts</title>
                  </path>
                );
              })}
            </g>
          </svg>
        )}

        {/* Dynamic Tooltip on Hover */}
        {hoveredDistrict && (
          <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex flex-col rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-xs">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-sky-600" />
              <span className="text-xs font-bold text-slate-900">{hoveredDistrict.name}</span>
            </div>
            {hoveredDistrict.tag && (
              <span className="text-[11px] font-medium text-amber-700">
                {hoveredDistrict.tag}
              </span>
            )}
            <span className="mt-0.5 text-[10px] text-slate-400">
              Click to select location
            </span>
          </div>
        )}
      </div>

      {/* Bottom helper text */}
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 px-1">
        <span>
          {selectedState && stateData
            ? `${filteredDistricts.length} districts displayed with location pins`
            : 'Select any state to open district breakdown & pin clusters'}
        </span>
        <span className="text-slate-400 hidden sm:inline">
          {selectedState ? 'Click pin or district to filter' : 'Vector Map'}
        </span>
      </div>
    </div>
  );
}

