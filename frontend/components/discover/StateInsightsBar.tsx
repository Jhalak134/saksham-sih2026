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
  Users,
  TrendingUp,
  Briefcase,
  Sprout,
  Landmark,
  Target,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { getStateOpportunityProfile } from '@/data/stateOpportunitiesData';
import { getInsights, getSchemes } from '@/lib/api-client';
import type { InsightsResponse, OfficialScheme } from '@/lib/api-types';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { SakshamAIChatModal } from '@/components/chat/SakshamAIChatModal';


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
    <div className="flex h-full w-full flex-col justify-between space-y-4">
      
      {/* ── Top Header: State Location & Pilot Status ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <MapPin size={17} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {selectedDistrict ? `${selectedDistrict}, ${activeStateName}` : activeStateName}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {selectedDistrict ? 'District Level Focus' : 'State Opportunities & Pilot Insights'}
            </p>
          </div>
        </div>

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

      {/* Non-Pilot State Summary Banner */}
      {!isUP && profile?.headline && (
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
          <h4 className="font-bold text-slate-900">{profile.headline}</h4>
          <p className="text-slate-500 mt-0.5 leading-relaxed">{profile.description}</p>
        </div>
      )}

      {/* ── CARD 1: State Economic Pulse (Direct 4 Statements, No Intro Lines) ── */}
      <div className="rounded-2xl border border-emerald-100/90 bg-[#F4FBF7] p-4 sm:p-5 relative overflow-hidden shadow-2xs">
        
        {/* Card Header & Right Illustration */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="text-emerald-700">
              <BarChart3 size={18} strokeWidth={2.5} />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              State Economic Pulse
            </h4>
          </div>

          {/* Illustration on right (State silhouette + Document + Upward bar chart) */}
          <div className="relative w-28 h-14 shrink-0 flex items-center justify-end" aria-hidden="true">
            <svg viewBox="0 0 140 85" className="w-full h-full" fill="none">
              <path d="M40 20 C60 10, 110 15, 130 35 C140 55, 115 80, 85 75 C60 70, 30 75, 20 55 C10 35, 25 25, 40 20 Z" fill="#E6F5EC" opacity="0.6"/>
              <g transform="translate(45, 25)">
                <rect x="0" y="0" width="34" height="42" rx="4" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5"/>
                <line x1="6" y1="8" x2="20" y2="8" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="15" x2="28" y2="15" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="6" y1="21" x2="24" y2="21" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="33" r="3" fill="#3B82F6"/>
                <path d="M12 35 L17 40" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
              </g>
              <g transform="translate(86, 12)">
                <rect x="5" y="38" width="8" height="26" rx="2" fill="#A7F3D0"/>
                <rect x="18" y="24" width="8" height="40" rx="2" fill="#6EE7B7"/>
                <rect x="31" y="10" width="8" height="54" rx="2" fill="#34D399"/>
                <path d="M-6 40 L10 26 L22 30 L38 12" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M30 12 L38 12 L38 20" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
          </div>
        </div>

        {/* The 4 Merged Inline Data Statements */}
        <div className="space-y-3">
          
          {/* Statement 1: Jobs & Labor Force (PLFS) */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <Users size={14} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs sm:text-[12.5px] text-slate-800 leading-snug">
                Jobs have grown steadily, with labor force participation at <span className="font-bold text-slate-950">41.2%</span>, up <span className="font-bold text-slate-950">2.8%</span> from last period.
              </p>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Source: Periodic Labour Force Survey (PLFS 2022–23)
              </span>
            </div>
          </div>

          {/* Statement 2: GSDP Growth (GSDP Survey) */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp size={14} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs sm:text-[12.5px] text-slate-800 leading-snug">
                The state economy is expanding, with GSDP growth of <span className="font-bold text-slate-950">7.6%</span> year-over-year.
              </p>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Source: State GSDP Estimates (2023–24)
              </span>
            </div>
          </div>

          {/* Statement 3: MSME Registrations (Udyam Data) */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <Briefcase size={14} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs sm:text-[12.5px] text-slate-800 leading-snug">
                More people are starting businesses — new MSME registrations are up <span className="font-bold text-slate-950">28%</span> from last year.
              </p>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Source: Udyam Registration Data (2023–24)
              </span>
            </div>
          </div>

          {/* Statement 4: State Priority Sectors & Scheme Backing */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <Sprout size={14} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs sm:text-[12.5px] text-slate-800 leading-snug">
                The state is actively backing dairy, ODOP clusters, and PMFME-supported food processing.
              </p>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Source: State Scheme Documents (ODOP, PMFME, State Budget)
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Backend Error Alert with Retry button */}
      {error && (
        <div role="alert" className="my-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-2">
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
      )}


      {/* ── SUBGRID: State Priority Sectors + Active Schemes ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Card A: State Priority Sectors with Shining Effect */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5">
              <Sprout size={15} className="text-emerald-700" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                State Priority Sectors
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Key sectors driving growth in {activeStateName}.
            </p>

            {/* Sector Pills with Shining Effect */}
            <div className="flex flex-wrap gap-1.5 pt-2.5">
              {[
                'Dairy & Allied',
                'Food Processing',
                'Agri-Business',
                'ODOP (One District One Product)',
                'Handicrafts & Textiles',
                'Rural Services',
              ].map((sector) => (
                <button
                  key={sector}
                  type="button"
                  className="shining-sector-pill rounded-lg bg-[#EEF4FA] hover:bg-[#E2EDF7] border border-slate-200/70 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-2xs transition-colors cursor-pointer"
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card B: Active Schemes & Credit Facilities */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5">
              <Landmark size={15} className="text-slate-800" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Active Schemes &amp; Credit Facilities
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Government support available in {activeStateName}.
            </p>

            {/* Schemes List with Swapped Color Accent (Mustard Yellow -> Vibrant Blue #1D70B8) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
                  <Target size={13} className="text-slate-700 shrink-0" />
                  <span className="truncate text-[11.5px]">Micro Finance Scheme</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="font-bold text-[#1D70B8] text-[11.5px]">
                    {liveSchemes?.[0]?.interest_rate ? `${liveSchemes[0].interest_rate}% p.a.` : '6.5% p.a.'}
                  </span>
                  <ChevronRight size={13} className="text-slate-400" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
                  <Target size={13} className="text-slate-700 shrink-0" />
                  <span className="truncate text-[11.5px]">Term Loan Scheme</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="font-bold text-[#1D70B8] text-[11.5px]">
                    {liveSchemes?.[1]?.interest_rate ? `${liveSchemes[1].interest_rate}% p.a.` : '8.0% p.a.'}
                  </span>
                  <ChevronRight size={13} className="text-slate-400" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
                  <Target size={13} className="text-slate-700 shrink-0" />
                  <span className="truncate text-[11.5px]">PMFME Scheme</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="font-bold text-[#1D70B8] text-[11.5px]">35% Capital Subsidy</span>
                  <ChevronRight size={13} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Button (Swapped Color Palette: Yellow -> Blue #1D70B8) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartAssessment}
              aria-label={`Start assessment for ${activeStateName}`}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D70B8] hover:bg-[#185E9B] active:scale-[0.99] text-white px-4 py-2.5 text-xs sm:text-[13px] font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>{`Start Assessment for ${activeStateName}`}</span>
              <ArrowRight size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>

      </div>

      {/* Baseline Demographics & Provenance */}
      {isUP && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50/90 px-3 py-2 border border-slate-200/70 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <Info size={12} className="text-slate-400" />
            <span>Census 2011 Baseline (Mathura)</span>
          </span>
          <span className="font-bold text-slate-700">
            <AnimatedCounter value={874} /> <span className="font-normal text-slate-500">micro locations</span>
          </span>
        </div>
      )}

      {/* Coming Soon Notice Alert (Shown when non-UP state is clicked for assessment) */}
      {comingSoonMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 animate-in fade-in slide-in-from-top-1"
        >
          <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Pilot Boundary Notice: </span>
            <span>{comingSoonMessage}</span>
          </div>
        </div>
      )}

      {/* SAKSHAM AI Complete Screen Assistant Modal */}
      <SakshamAIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />
    </div>
  );
}

