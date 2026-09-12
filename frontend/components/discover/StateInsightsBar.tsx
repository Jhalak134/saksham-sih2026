// components/discover/StateInsightsBar.tsx
// Dynamic Info Bar at the right side of the IndiaMap, updating per selected State/District/Village.
// Connected to backend GET /api/v1/insights/{location} and GET /api/v1/schemes.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { getStateOpportunityProfile } from '@/data/stateOpportunitiesData';
import { getInsights, getSchemes } from '@/lib/api-client';
import type { InsightsResponse, OfficialScheme, CategoryDetailsResponse } from '@/lib/api-types';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { SakshamAIChatModal } from '@/components/chat/SakshamAIChatModal';


interface StateInsightsBarProps {
  readonly selectedState: string | null;
  readonly selectedDistrict?: string | null;
  readonly browsingLocation: string;
  readonly availableCapital?: string;
  readonly selectedCategory?: CategoryDetailsResponse | null;
}

export function StateInsightsBar({
  selectedState,
  selectedDistrict = null,
  browsingLocation,
  availableCapital = '₹1,00,000',
  selectedCategory = null,
}: StateInsightsBarProps): React.JSX.Element {
  const router = useRouter();
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);


  // Live backend data states
  const [liveInsights, setLiveInsights] = useState<InsightsResponse | null>(null);
  const [liveSchemes, setLiveSchemes] = useState<OfficialScheme[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeStateName = selectedState ?? 'Uttar Pradesh';
  const profile = getStateOpportunityProfile(activeStateName);

  // Check if active region is Uttar Pradesh (Active Pilot)
  const isUP =
    activeStateName.toLowerCase().includes('uttar pradesh') ||
    activeStateName.toLowerCase() === 'up' ||
    Boolean(selectedDistrict && selectedDistrict.toLowerCase().includes('mathura'));

  const targetLocation = selectedDistrict || activeStateName || 'Uttar Pradesh';

  const loadLiveData = useCallback(async (isMounted: () => boolean) => {
    if (!isUP) return;
    setLoading(true);
    setError(null);
    try {
      const [insightsRes, schemesRes] = await Promise.all([
        getInsights(targetLocation),
        getSchemes(),
      ]);
      if (isMounted()) {
        setLiveInsights(insightsRes);
        setLiveSchemes(schemesRes);
        setError(null);
      }
    } catch (err: unknown) {
      if (isMounted()) {
        const msg = err instanceof Error ? err.message : 'Unable to connect to SAKSHAM backend services';
        setError(msg);
        setLiveInsights(null);
        setLiveSchemes(null);
      }
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, [isUP, targetLocation]);

  useEffect(() => {
    let mounted = true;
    if (isUP) {
      loadLiveData(() => mounted);
    } else {
      setLiveInsights(null);
      setLiveSchemes(null);
      setError(null);
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [isUP, loadLiveData]);

  const handleStartAssessment = () => {
    if (isUP) {
      setComingSoonMessage(null);
      const districtParam = selectedDistrict ? `&district=${encodeURIComponent(selectedDistrict)}` : '';
      router.push(`/new-assessment?state=${encodeURIComponent(activeStateName)}${districtParam}`);
    } else {
      setComingSoonMessage(
        `Sorry, assessments are currently active only in Uttar Pradesh (Pilot Region). Expansion to ${activeStateName} is coming soon!`
      );
      setTimeout(() => {
        setComingSoonMessage(null);
      }, 4500);
    }
  };

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
                {selectedDistrict ? `${selectedDistrict}, ${activeStateName}` : activeStateName}
              </h3>
              <p className="text-[11px] text-slate-500">
                {selectedDistrict ? 'District Level Focus' : 'State Opportunities & Pilot Insights'}
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

        {/* 3 Top Movers Trend Stats */}
        {!isUP ? (
          <div className="my-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3.5">
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
        ) : loading ? (
          <div className="my-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3.5 animate-pulse">
            <div className="space-y-1.5">
              <div className="h-5 w-12 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-200 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-12 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-200 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-12 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-200 rounded" />
            </div>
          </div>
        ) : error ? (
          <div role="alert" className="my-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle size={14} className="text-red-600 shrink-0" />
              <span>Unable to load live pilot data</span>
            </div>
            <p className="text-[11px] text-red-700 leading-snug">{error}</p>
            <button
              type="button"
              onClick={() => loadLiveData(() => true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-2.5 py-1 text-xs font-bold text-red-800 hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        ) : liveInsights && Array.isArray(liveInsights.categories) && liveInsights.categories.length > 0 ? (
          <div className="my-4 border-y border-slate-100 py-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Top Growth Categories</span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                Observed Regional Indicator
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {liveInsights.categories.slice(0, 3).map((mover) => {
                const numericTrend =
                  typeof mover.trend === 'number'
                    ? mover.trend
                    : parseFloat(String(mover.trend)) || 0;

                return (
                  <div key={mover.name} className="flex flex-col">
                    <span className="text-base md:text-lg font-extrabold text-emerald-600 flex items-center">
                      <AnimatedCounter
                        key={`${activeStateName}-${mover.name}`}
                        value={numericTrend}
                        prefix={numericTrend >= 0 ? '+' : ''}
                        suffix="%"
                      />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-800 line-clamp-1 leading-tight mt-0.5">
                      {mover.name}
                    </span>
                    {mover.seasonality && (
                      <span className="text-[9.5px] text-slate-400 line-clamp-1">
                        {mover.seasonality}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="my-4 border-y border-slate-100 py-3 text-center text-xs text-slate-500">
            No category trends recorded for this location yet.
          </div>
        )}

        {/* Key Active Schemes & Subsidies */}
        {!isUP ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Active Schemes &amp; Subsidies</span>
            </div>
            <div className="space-y-1.5">
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
        ) : loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-8 w-full bg-slate-100 rounded-lg" />
            <div className="h-8 w-full bg-slate-100 rounded-lg" />
          </div>
        ) : error ? null : Array.isArray(liveSchemes) && liveSchemes.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Active Schemes &amp; Credit Facilities</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 border border-emerald-200">
                Official Concessional Credit
              </span>
            </div>
            <div className="space-y-1.5">
              {liveSchemes.slice(0, 2).map((scheme) => (
                <div
                  key={scheme.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px] text-slate-700 border border-slate-100/90"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                    <span className="truncate font-medium">{scheme.name}</span>
                  </div>
                  <span className="text-[10.5px] font-bold text-emerald-700 shrink-0 ml-2">
                    <AnimatedCounter
                      key={`scheme-${scheme.id}`}
                      value={
                        typeof scheme.interest_rate === 'number'
                          ? scheme.interest_rate
                          : parseFloat(String(scheme.interest_rate)) || 7
                      }
                      decimals={1}
                      suffix="% p.a."
                    />
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px] text-slate-700 border border-slate-100/90">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                  <span className="truncate font-medium">PMFME Scheme</span>
                </div>
                <span className="text-[10.5px] font-medium text-slate-500 shrink-0 ml-2">
                  35% Capital Subsidy
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-xs text-slate-500 py-2">
            No active concessional schemes available in database.
          </div>
        )}

        {/* Feasibility & Target Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-100">
            <span className="text-[10.5px] font-medium text-emerald-800">
              {selectedCategory
                ? `${selectedCategory.name} Clusters`
                : isUP
                ? 'Census Village Clusters'
                : 'Feasible Clusters'}
            </span>
            <p className="text-sm font-bold text-emerald-950 mt-0.5 flex items-center">
              {selectedCategory ? (
                <>
                  <AnimatedCounter
                    key={`cat-${selectedCategory.id}-clusters`}
                    value={selectedCategory.feasible_locations_count}
                  />{' '}
                  <span className="ml-1">micro locations</span>
                </>
              ) : isUP ? (
                <>
                  <AnimatedCounter
                    key="up-census-clusters"
                    value={874}
                  />{' '}
                  <span className="ml-1">micro locations</span>
                </>
              ) : (
                <>
                  <AnimatedCounter
                    key={`${activeStateName}-clusters`}
                    value={profile.feasibleUnitsCount}
                    suffix="+"
                  />{' '}
                  <span className="ml-1">micro locations</span>
                </>
              )}
            </p>
            {selectedCategory ? (
              <span className="text-[9.5px] text-emerald-700/80 block mt-0.5">
                Category Viability Model ({selectedCategory.state_name || 'Pilot'})
              </span>
            ) : isUP && (
              <span className="text-[9.5px] text-emerald-700/80 block mt-0.5">
                Census 2011 Baseline (Mathura)
              </span>
            )}
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10.5px] font-medium text-slate-500">Target Capital</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {selectedCategory ? selectedCategory.capital_bracket : availableCapital}
            </p>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">
              {selectedCategory ? 'Benchmark Capital' : 'Promoter Margin Buffer'}
            </span>
          </div>
        </div>

        {/* Historical & Provenance Callout (Data Honesty) */}
        {isUP && (
          <div className="mt-3 rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-[10.5px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <Info size={13} className="text-slate-500 shrink-0" />
              <span>Data Provenance &amp; Pilot Notice:</span>
            </p>
            <p className="leading-relaxed text-slate-600">
              Demographics reflect official Census 2011 baseline (874 verified villages). Category trends represent regional baseline indicators from observed economic activity.
            </p>
          </div>
        )}

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

      {/* Start Assessment CTA & AI Assistance */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
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

        <button
          type="button"
          onClick={() => setIsAIChatOpen(true)}
          aria-label="Open AI Assistance Chatbot"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500 via-[#FBAC05] to-emerald-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-xs hover:shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Sparkles size={16} className="text-amber-100 animate-pulse" />
          <span>AI Assistance</span>
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-white/95">
            Chat Assistant
          </span>
        </button>
      </div>

      {/* SAKSHAM AI Complete Screen Assistant Modal */}
      {isAIChatOpen && (
        <SakshamAIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      )}
    </div>
  );
}

