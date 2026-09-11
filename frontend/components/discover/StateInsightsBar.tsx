// components/discover/StateInsightsBar.tsx
// Dynamic Info Bar at the right side of the IndiaMap, updating per selected State/District/Village.
// Powered by authentic Census 2011 demographics and Invest India ODOP (One District One Product) data.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Users,
  GraduationCap,
  PackageCheck,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { getStateOpportunityProfile } from '@/data/stateOpportunitiesData';
import { formatPopulationIndian } from '@/data/stateCensusODOPData';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface StateInsightsBarProps {
  readonly selectedState: string | null;
  readonly selectedDistrict?: string | null;
  readonly browsingLocation: string;
  readonly availableCapital?: string;
}

export function StateInsightsBar({
  selectedState,
  selectedDistrict = null,
  browsingLocation,
  availableCapital = '₹1,00,000',
}: StateInsightsBarProps): React.JSX.Element {
  const router = useRouter();
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);

  const activeStateName = selectedState ?? 'Uttar Pradesh';
  const profile = getStateOpportunityProfile(activeStateName);

  // Check if active region is Uttar Pradesh (Active Pilot)
  const isUP =
    activeStateName.toLowerCase().includes('uttar pradesh') ||
    activeStateName.toLowerCase() === 'up';

  const handleStartAssessment = () => {
    if (isUP) {
      setComingSoonMessage(null);
      router.push(`/new-assessment?state=${encodeURIComponent(activeStateName)}`);
    } else {
      setComingSoonMessage(
        `Sorry, assessments are currently active only in Uttar Pradesh (Pilot Region). Expansion to ${activeStateName} is coming soon!`
      );
      // Auto clear after 4.5 seconds
      setTimeout(() => {
        setComingSoonMessage(null);
      }, 4500);
    }
  };

  const popFormatted = formatPopulationIndian(profile.census?.population);

  return (
    <div className="flex h-full min-h-[460px] md:min-h-[520px] flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-xs">
      <div>
        {/* Header: Location & Pilot / Opportunity Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <MapPin size={17} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {activeStateName}
              </h3>
              <p className="text-[11px] text-slate-500">
                State Opportunities & Pilot Insights
              </p>
            </div>
          </div>

          {/* Pilot or Opportunity Tier Badge */}
          {isUP ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 shadow-xs">
              <Sparkles size={11} className="text-emerald-600" />
              Pilot Live
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
              Coming Soon
            </span>
          )}
        </div>

        {/* State Summary Headline */}
        <div className="mt-3.5">
          <h4 className="text-xs font-bold text-slate-900">
            {profile.headline}
          </h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {profile.description}
          </p>
        </div>

        {/* 3 Top Movers Trend Stats with Animated Numeric Counters */}
        <div className="my-3.5 grid grid-cols-3 gap-2 border-y border-slate-100 py-3">
          {profile.topMovers.map((mover) => (
            <div key={mover.title} className="flex flex-col">
              <span className="text-base md:text-lg font-extrabold text-emerald-600 flex items-center">
                <AnimatedCounter
                  key={`${activeStateName}-${mover.title}`}
                  value={mover.percent}
                  prefix="+"
                  suffix="%"
                />
              </span>
              <span className="text-[11px] font-semibold text-slate-800 line-clamp-1 leading-tight mt-0.5">
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

        {/* Real Census 2011 & ODOP Highlights Strip */}
        <div className="mb-3.5 rounded-xl bg-slate-50/80 p-2.5 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-700">
            <span className="flex items-center gap-1 text-slate-800">
              <Users size={12} className="text-emerald-600" />
              <span>Census Demographics</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Official 2011 Data</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-lg bg-white px-1.5 py-1 shadow-2xs border border-slate-100">
              <span className="text-[9.5px] text-slate-400 block leading-tight">Population</span>
              <span className="text-xs font-bold text-slate-900">
                {popFormatted.unit ? (
                  <AnimatedCounter
                    key={`${activeStateName}-pop`}
                    value={popFormatted.value}
                    decimals={popFormatted.unit === 'Cr' ? 2 : 1}
                    suffix={` ${popFormatted.unit}`}
                  />
                ) : (
                  popFormatted.full
                )}
              </span>
            </div>

            <div className="rounded-lg bg-white px-1.5 py-1 shadow-2xs border border-slate-100">
              <span className="text-[9.5px] text-slate-400 block leading-tight">Literacy</span>
              <span className="text-xs font-bold text-slate-900">
                {profile.census?.literacy_percent ? (
                  <AnimatedCounter
                    key={`${activeStateName}-lit`}
                    value={profile.census.literacy_percent}
                    decimals={1}
                    suffix="%"
                  />
                ) : (
                  'N/A'
                )}
              </span>
            </div>

            <div className="rounded-lg bg-white px-1.5 py-1 shadow-2xs border border-slate-100">
              <span className="text-[9.5px] text-slate-400 block leading-tight">Density</span>
              <span className="text-xs font-bold text-slate-900">
                {profile.census?.density_per_km2 ? (
                  <AnimatedCounter
                    key={`${activeStateName}-density`}
                    value={profile.census.density_per_km2}
                    suffix="/km²"
                  />
                ) : (
                  'N/A'
                )}
              </span>
            </div>
          </div>

          {/* Invest India ODOP Product Tag */}
          {profile.odop && (
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/50 text-[10.5px]">
              <span className="flex items-center gap-1 font-semibold text-slate-700 truncate">
                <PackageCheck size={11} className="text-emerald-600 shrink-0" />
                <span>ODOP ({profile.odop.leading_odop_sector}):</span>
                <span className="text-slate-900 font-bold truncate">
                  {profile.odop.flagship_example_district_product}
                </span>
              </span>
              <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200">
                <AnimatedCounter
                  key={`${activeStateName}-odop-count`}
                  value={profile.odop.districts_captured_in_odop_list}
                  suffix=" Dists"
                />
              </span>
            </div>
          )}
        </div>

        {/* Key Active Schemes & Subsidies */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Active Schemes & Subsidies</span>
          </div>
          <div className="space-y-1">
            {profile.activeSchemes.slice(0, 3).map((scheme) => (
              <div
                key={scheme}
                className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px] text-slate-700 border border-slate-100/90"
              >
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span className="truncate">{scheme}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feasibility & Target Metrics with Counter Animation */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-100">
            <span className="text-[10.5px] font-medium text-emerald-800">Feasible Clusters</span>
            <p className="text-sm font-bold text-emerald-950 mt-0.5">
              <AnimatedCounter
                key={`${activeStateName}-feasible`}
                value={profile.feasibleUnitsCount}
                suffix="+"
              />{' '}
              micro locations
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10.5px] font-medium text-slate-500">Target Capital</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {profile.recommendedCapital}
            </p>
          </div>
        </div>

        {/* Coming Soon Notice Alert (Shown when non-UP state is clicked for assessment) */}
        {comingSoonMessage && (
          <div
            role="alert"
            className="mt-3.5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 animate-in fade-in slide-in-from-top-1"
          >
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Pilot Boundary Notice: </span>
              <span>{comingSoonMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Start Assessment CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleStartAssessment}
          aria-label={`Start assessment for ${activeStateName}`}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 active:scale-[0.99] cursor-pointer',
            isUP
              ? 'bg-[#15803D] text-white hover:bg-[#166534] focus-visible:ring-emerald-400'
              : 'bg-slate-800 text-white hover:bg-slate-900 focus-visible:ring-slate-400'
          )}
        >
          <span>
            {isUP ? `Start Assessment for ${activeStateName}` : `Start Assessment (${activeStateName})`}
          </span>
          <ArrowRight size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
