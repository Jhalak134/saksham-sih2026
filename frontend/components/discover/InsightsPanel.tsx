// components/discover/InsightsPanel.tsx
// Insights panel with local market metrics and conversational search trigger.

import { MapPin, ArrowUp, ArrowRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { InsightsData } from '@/lib/discover-types';

interface InsightsPanelProps {
  readonly location: string;
  readonly data: InsightsData;
  readonly onChangeLocation?: () => void;
  readonly onAskSaksham?: () => void;
}

function getDemandBadgeClass(level: 'Low' | 'Medium' | 'High'): string {
  if (level === 'High') return 'bg-[#E0F2FE] text-[#0369A1]';
  if (level === 'Medium') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-700';
}

export function InsightsPanel({
  location,
  data,
  onChangeLocation,
  onAskSaksham,
}: InsightsPanelProps): React.JSX.Element {
  return (
    <div className="flex h-full min-h-[380px] flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Insights for {location}
            </h2>
            <div className="flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              <MapPin size={12} className="text-slate-500" aria-hidden="true" />
              <span>{location}</span>
            </div>
          </div>
          {onChangeLocation && (
            <button
              type="button"
              onClick={onChangeLocation}
              className="text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
              Change
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Real data. Local context. Updated regularly.
        </p>
      </div>

      {/* 3 Metric Columns */}
      <div className="my-5 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
        {/* Metric 1: Population */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500">Population</span>
          <span className="mt-1.5 text-2xl font-bold text-slate-900">
            {data.population.toLocaleString('en-IN')}
          </span>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span className={cn('flex items-center font-bold text-[#2563EB]')}>
              <ArrowUp size={12} strokeWidth={2.5} className="mr-0.5" />
              {data.populationGrowthPercent}%
            </span>
            <span>vs last year</span>
          </div>
        </div>

        {/* Metric 2: Key Demand */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500">Key demand</span>
          <span className="mt-1.5 text-base font-bold text-slate-900 truncate">
            {data.keyDemand.category}
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn('inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold', getDemandBadgeClass(data.keyDemand.level))}>
              {data.keyDemand.level}
            </span>
            <span>in your area</span>
          </div>
        </div>

        {/* Metric 3: Nearby Markets */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500">Nearby markets</span>
          <span className="mt-1.5 text-2xl font-bold text-slate-900">
            {data.nearbyMarkets}
          </span>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={13} className="text-slate-400" />
            <span>within 50 km</span>
          </div>
        </div>
      </div>

      {/* Ask SAKSHAM Prompt Callout */}
      <button
        type="button"
        onClick={onAskSaksham}
        className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/90 bg-[#F8FAFC] px-4 py-3 text-left transition-all hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <div className="flex items-center gap-3">
          <MessageSquare size={17} className="text-slate-500 group-hover:text-slate-800" />
          <span className="text-xs font-medium text-slate-700">
            Not sure where to start? Ask SAKSHAM anything.
          </span>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200/70 text-slate-600 group-hover:bg-slate-300 group-hover:text-slate-900 transition-all">
          <ArrowRight size={14} strokeWidth={2.25} />
        </div>
      </button>
    </div>
  );
}
