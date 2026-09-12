// components/discover/IndiaMap.tsx
// National Interactive Map: All India National Heatmap (State opportunities & sector insights)

'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { INDIA_STATES, INDIA_VIEWBOX, type MapLocation } from '@/data/indiaMapData';
import {
  getStateOpportunityProfile,
  getOpportunityLevelColor,
} from '@/data/stateOpportunitiesData';
import { Plus, Minus, X, ArrowLeft, RotateCcw, Sparkles, Map } from 'lucide-react';

interface IndiaMapProps {
  readonly selectedState: string | null;
  readonly onStateSelect: (state: string | null) => void;
  readonly selectedDistrict?: string | null;
  readonly onDistrictSelect?: (district: string | null) => void;
  readonly className?: string;
}

export function IndiaMap({
  selectedState,
  onStateSelect,
  onDistrictSelect,
  className,
}: IndiaMapProps): React.JSX.Element {
  // Hover state for India SVG states
  const [hoveredState, setHoveredState] = useState<MapLocation | null>(null);

  // Zoom for All-India SVG - default 1.2x so it fills container completely
  const [svgZoomLevel, setSvgZoomLevel] = useState<number>(1.2);

  // Click handler for states on the national map
  const handleStateClick = (state: MapLocation) => {
    if (selectedState && selectedState.toLowerCase() === state.name.toLowerCase()) {
      // Toggle off if already selected
      onStateSelect(null);
      if (onDistrictSelect) onDistrictSelect(null);
    } else {
      onStateSelect(state.name);
      if (onDistrictSelect) onDistrictSelect(null);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setSvgZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setSvgZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetZoom = () => {
    setSvgZoomLevel(1.2);
  };

  return (
    <div className={cn("relative flex h-full min-h-[480px] md:min-h-[540px] w-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs overflow-hidden map-shine-border", className)}>
      {/* ── TOP CONSOLIDATED HEADER & BREADCRUMB SURFACE ── */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 pb-1">
        {/* Navigation Breadcrumb Trail */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedState ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  onStateSelect(null);
                  if (onDistrictSelect) onDistrictSelect(null);
                  setSvgZoomLevel(1.2);
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs cursor-pointer"
                aria-label="Back to India Map"
              >
                <ArrowLeft size={13} strokeWidth={2.5} />
                <span>All India</span>
              </button>

              <span className="text-slate-300">/</span>

              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>{selectedState}</span>
                {selectedState.toLowerCase().includes('uttar pradesh') ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-300">
                    <Sparkles size={10} className="text-emerald-700" />
                    Pilot Live
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                    Selected State
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50/80 text-blue-600 border border-blue-200/60">
                <Map size={16} strokeWidth={2} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">National Opportunities Heatmap</h3>
              <span className="sr-only">Interactive India Map</span>
            </div>
          )}
        </div>

        {/* Selected State Chip */}
        <div className="flex items-center gap-1.5">
          {selectedState && (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs">
              <span>{selectedState}</span>
              <button
                type="button"
                onClick={() => {
                  onStateSelect(null);
                  if (onDistrictSelect) onDistrictSelect(null);
                }}
                aria-label={`Remove ${selectedState} filter`}
                className="flex h-3.5 w-3.5 items-center justify-center rounded text-emerald-600 hover:text-emerald-900 transition-colors cursor-pointer"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MAP ZOOM & RESET CONTROLS ── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-xs backdrop-blur-md">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
          title="Zoom in"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
        <div className="h-px w-4 bg-slate-200" />
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
          title="Zoom out"
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <div className="h-px w-4 bg-slate-200" />
        <button
          type="button"
          onClick={handleResetZoom}
          aria-label="Reset zoom"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
          title="Reset zoom"
        >
          <RotateCcw size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── MAP CANVAS CONTAINER (ALL-INDIA NATIONAL HEATMAP) ── */}
      <div
        className="relative flex flex-1 h-full min-h-[320px] w-full items-center justify-center my-2 rounded-xl overflow-hidden"
        role="region"
        aria-label="India & State Map"
      >
        <div className="relative flex h-full w-full items-center justify-center">
          <svg
            viewBox={INDIA_VIEWBOX}
            preserveAspectRatio="xMidYMid meet"
            className="h-full max-h-[520px] w-full transition-transform duration-200"
            style={{ transform: `scale(${svgZoomLevel})` }}
            role="img"
            aria-label="Interactive India Map"
          >
            <g id="india-states">
              {INDIA_STATES.map((state: MapLocation) => {
                const profile = getStateOpportunityProfile(state.name);
                const isSelected =
                  selectedState &&
                  (selectedState.toLowerCase() === state.name.toLowerCase() ||
                    selectedState.toLowerCase() === state.id.toLowerCase());
                const colors = getOpportunityLevelColor(profile.opportunityLevel);

                return (
                  <path
                    key={state.id}
                    id={state.id}
                    d={state.path}
                    aria-label={state.name}
                    onClick={() => handleStateClick(state)}
                    onMouseEnter={() => setHoveredState(state)}
                    onMouseLeave={() => setHoveredState(null)}
                    fill={isSelected ? '#15803D' : colors.fill}
                    stroke={isSelected ? '#0F5132' : colors.stroke}
                    strokeWidth={isSelected ? 2.5 : 1}
                    className={cn(
                      'cursor-pointer transition-all duration-150 focus:outline-none',
                      isSelected
                        ? 'filter drop-shadow-[0_2px_8px_rgba(21,128,61,0.4)]'
                        : 'hover:brightness-95'
                    )}
                  >
                    <title>{`${state.name} — ${profile.opportunityLevel} Opportunity`}</title>
                  </path>
                );
              })}
            </g>
          </svg>

          {/* Hover Tooltip for India States */}
          {hoveredState && (
            <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex flex-col rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-2 w-2 rounded-full',
                    hoveredState.name.toLowerCase().includes('uttar pradesh')
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-emerald-400'
                  )}
                />
                <span className="text-xs font-bold text-slate-900">{hoveredState.name}</span>
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.2 text-[9px] font-bold',
                    getStateOpportunityProfile(hoveredState.name).opportunityLevel === 'High' &&
                      'bg-emerald-100 text-emerald-800',
                    getStateOpportunityProfile(hoveredState.name).opportunityLevel === 'Medium' &&
                      'bg-green-100 text-green-800',
                    getStateOpportunityProfile(hoveredState.name).opportunityLevel === 'Emerging' &&
                      'bg-emerald-50 text-emerald-700',
                    getStateOpportunityProfile(hoveredState.name).opportunityLevel === 'Lower' &&
                      'bg-slate-100 text-slate-700'
                  )}
                >
                  {getStateOpportunityProfile(hoveredState.name).opportunityLevel} Opportunity
                </span>
              </div>
              <span className="mt-1 text-[10.5px] text-slate-500">
                Click state to inspect market metrics & opportunities
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM OPPORTUNITY LEGEND BAR ── */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-600 px-1 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700">Opportunity Level:</span>
          <span className="sr-only">Opportunity Level Heatmap:</span>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] bg-[#15803D]" />
              <span className="text-slate-700 font-medium">High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] bg-[#4ADE80]" />
              <span className="text-slate-700 font-medium">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] bg-[#BBF7D0]" />
              <span className="text-slate-700 font-medium">Emerging</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] bg-[#E2E8F0]" />
              <span className="text-slate-700 font-medium">Lower</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
