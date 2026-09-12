// components/discover/ExploreIndiaSection.tsx
// Top section of the Discover screen: Interactive India Map on Left + Dynamic State Info Bar on Right.

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { INDIA_STATES, INDIA_VIEWBOX, type MapLocation } from '@/data/indiaMapData';
import {
  getStateOpportunityProfile,
  getOpportunityLevelColor,
  type StateOpportunityProfile,
  type OpportunityLevel,
} from '@/data/stateOpportunitiesData';
import {
  TrendingUp,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface ExploreIndiaSectionProps {
  readonly selectedState: string | null;
  readonly onStateSelect: (state: string | null) => void;
  readonly availableCapital?: string;
}

const ALL_STATES_LIST = [
  { id: 'up', name: 'Uttar Pradesh' },
  { id: 'rj', name: 'Rajasthan' },
  { id: 'mh', name: 'Maharashtra' },
  { id: 'gj', name: 'Gujarat' },
  { id: 'mp', name: 'Madhya Pradesh' },
  { id: 'br', name: 'Bihar' },
  { id: 'ka', name: 'Karnataka' },
  { id: 'tn', name: 'Tamil Nadu' },
  { id: 'pb', name: 'Punjab' },
  { id: 'wb', name: 'West Bengal' },
  { id: 'ap', name: 'Andhra Pradesh' },
  { id: 'ts', name: 'Telangana' },
  { id: 'hr', name: 'Haryana' },
  { id: 'kl', name: 'Kerala' },
  { id: 'or', name: 'Odisha' },
  { id: 'jh', name: 'Jharkhand' },
  { id: 'ct', name: 'Chhattisgarh' },
  { id: 'uk', name: 'Uttarakhand' },
  { id: 'hp', name: 'Himachal Pradesh' },
  { id: 'as', name: 'Assam' },
];

export function ExploreIndiaSection({
  selectedState,
  onStateSelect,
  availableCapital = '₹1,00,000',
}: ExploreIndiaSectionProps): React.JSX.Element {
  const router = useRouter();
  const [hoveredState, setHoveredState] = useState<MapLocation | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Active state profile (defaults to Uttar Pradesh or currently selected state)
  const currentProfile: StateOpportunityProfile = useMemo(() => {
    return getStateOpportunityProfile(selectedState ?? 'Uttar Pradesh');
  }, [selectedState]);

  // Hovered state profile
  const hoveredProfile = useMemo(() => {
    return hoveredState ? getStateOpportunityProfile(hoveredState.name) : null;
  }, [hoveredState]);

  const handleStateClick = (state: MapLocation) => {
    onStateSelect(state.name);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onStateSelect(val);
  };

  const handleStartAssessment = () => {
    router.push(`/new-assessment?state=${encodeURIComponent(currentProfile.name)}`);
  };

  return (
    <section aria-label="Explore opportunities across India" className="w-full">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 md:p-7 shadow-xs">
        {/* Header with Title & State Dropdown */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              Explore opportunities across India
            </h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              Click on a state to see key trends, schemes and business opportunities.
            </p>
          </div>

          {/* State Dropdown Selector */}
          <div className="flex items-center gap-3">
            <div className="relative inline-block w-52">
              <select
                value={currentProfile.name}
                onChange={handleDropdownChange}
                aria-label="Select state"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 pr-9 text-xs md:text-sm font-semibold text-slate-800 shadow-xs transition-all hover:bg-slate-100 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 cursor-pointer"
              >
                {ALL_STATES_LIST.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Main Grid: Map Area (Left) + Dynamic Info Bar (Right) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* ─────────────────── LEFT: INTERACTIVE INDIA MAP ─────────────────── */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-[#F8FAFC]/70 border border-slate-100 p-4 md:p-5 relative overflow-hidden min-h-[380px] md:min-h-[440px]">
            {/* Map Top Indicator */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-700">
                  Interactive Heatmap · {currentProfile.name}
                </span>
              </div>

              {/* Floating Zoom Controls */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.0))}
                  aria-label="Zoom in"
                  className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                  aria-label="Zoom out"
                  className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Minus size={12} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  aria-label="Reset zoom"
                  className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw size={11} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Map Canvas SVG */}
            <div className="relative my-2 flex flex-1 items-center justify-center overflow-hidden">
              <svg
                viewBox={INDIA_VIEWBOX}
                preserveAspectRatio="xMidYMid meet"
                className="h-full max-h-[360px] md:max-h-[390px] w-full transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
                role="img"
                aria-label="Interactive India Map"
              >
                <g id="india-states-heat">
                  {INDIA_STATES.map((state: MapLocation) => {
                    const profile = getStateOpportunityProfile(state.name);
                    const isSelected =
                      currentProfile.name.toLowerCase() === state.name.toLowerCase() ||
                      currentProfile.id === state.id;
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
                          'cursor-pointer transition-all duration-200 focus:outline-none',
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

              {/* Hover Tooltip Overlay */}
              {hoveredState && (
                <div className="pointer-events-none absolute bottom-2 left-2 z-20 flex flex-col rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-md backdrop-blur-md">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{hoveredState.name}</span>
                    {hoveredProfile && (
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                          hoveredProfile.opportunityLevel === 'High' && 'bg-emerald-100 text-emerald-800',
                          hoveredProfile.opportunityLevel === 'Medium' && 'bg-green-100 text-green-800',
                          hoveredProfile.opportunityLevel === 'Emerging' && 'bg-emerald-50 text-emerald-700',
                          hoveredProfile.opportunityLevel === 'Lower' && 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {hoveredProfile.opportunityLevel} opportunity
                      </span>
                    )}
                  </div>
                  <span className="mt-0.5 text-[10.5px] text-slate-500">
                    Click to load state opportunities & schemes
                  </span>
                </div>
              )}
            </div>

            {/* Opportunity Level Legend (matching the mockup) */}
            <div className="mt-1 flex flex-wrap items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Opportunity level:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-[#15803D]" />
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-[#4ADE80]" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-[#BBF7D0]" />
                  <span>Emerging</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-[#E2E8F0]" />
                  <span>Lower</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────── RIGHT: DYNAMIC STATE INFO BAR ─────────────────── */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-xs">
            <div>
              {/* State Header & Opportunity Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-emerald-600 shrink-0" />
                  <h3 className="text-lg font-bold text-slate-900">{currentProfile.name}</h3>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold tracking-tight',
                    currentProfile.opportunityLevel === 'High' && 'bg-emerald-100 text-emerald-800 border border-emerald-300',
                    currentProfile.opportunityLevel === 'Medium' && 'bg-green-100 text-green-800 border border-green-200',
                    currentProfile.opportunityLevel === 'Emerging' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    currentProfile.opportunityLevel === 'Lower' && 'bg-slate-100 text-slate-700 border border-slate-200'
                  )}
                >
                  <Sparkles size={11} className="mr-1 inline" />
                  {currentProfile.opportunityLevel} opportunity
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {currentProfile.description}
              </p>

              {/* 3 Top Movers Trend Stats */}
              <div className="my-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3.5">
                {currentProfile.topMovers.map((mover) => (
                  <div key={mover.title} className="flex flex-col">
                    <span className="text-base md:text-lg font-extrabold text-emerald-600 flex items-center">
                      <AnimatedCounter
                        key={`${currentProfile.name}-${mover.title}`}
                        value={mover.percent}
                        prefix="+"
                        suffix="%"
                      />
                    </span>
                    <span className="text-[11px] font-medium text-slate-800 line-clamp-1 leading-tight mt-0.5">
                      {mover.title}
                    </span>
                    {mover.subtitle && (
                      <span className="text-[9.5px] text-slate-400 line-clamp-1">
                        {mover.subtitle}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Schemes & Subsidies */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Key Subsidies & Schemes in {currentProfile.name}</span>
                </div>
                <div className="space-y-1.5">
                  {currentProfile.activeSchemes.slice(0, 3).map((scheme) => (
                    <div
                      key={scheme}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px] text-slate-700 border border-slate-100/90"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{scheme}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Feasibility Highlights */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-emerald-50/60 p-2.5 border border-emerald-100">
                  <span className="text-[10.5px] font-medium text-emerald-800">Feasible Locations</span>
                  <p className="text-sm font-bold text-emerald-950 mt-0.5">
                    <AnimatedCounter
                      key={`${currentProfile.name}-feasible`}
                      value={currentProfile.feasibleUnitsCount}
                      suffix="+"
                    />{' '}
                    near you
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[10.5px] font-medium text-slate-500">Target Capital</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {currentProfile.recommendedCapital}
                  </p>
                </div>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleStartAssessment}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#15803D] px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-sm hover:bg-[#166534] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.99]"
              >
                <span>Start Assessment for {currentProfile.name}</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
