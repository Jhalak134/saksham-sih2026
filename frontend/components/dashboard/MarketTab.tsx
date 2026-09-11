// components/dashboard/MarketTab.tsx
// Market analysis tab with Market Snapshot, Local Summary, Segments, and Risks.

'use client';

import React from 'react';
import { AlertTriangle, TrendingUp, Users, Store, MapPin } from 'lucide-react';
import type { DetailedReport } from '@/data/reportsData';
import { cn } from '@/lib/cn';

interface MarketTabProps {
  readonly report: DetailedReport;
}

export function MarketTab({ report }: MarketTabProps): React.JSX.Element {
  const { snapshot, localSummary, segments, risks } = report.market;

  return (
    <div className="space-y-6">
      {/* 1. Snapshot + Local Summary: stacked on mobile, side-by-side on desktop (md:flex-row) */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Market Snapshot Card */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Market Snapshot</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <p className="text-xs text-slate-500">Total demand</p>
              <p className="mt-1 text-sm font-bold text-emerald-700">{snapshot.totalDemand}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Market size</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{snapshot.marketSize}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Growth trend</p>
              <p className="mt-1 text-xs font-semibold text-sky-700">{snapshot.growthTrend}</p>
            </div>
          </div>
        </div>

        {/* Local Market Summary Card */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Local Market Summary</h3>
          </div>
          <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <p className="text-[11px] text-slate-500">Households</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {localSummary.estimatedHouseholds.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Competitors</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{localSummary.mappedCompetitors}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Markets</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{localSummary.nearbyMarkets}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Opportunity</p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">{localSummary.marketOpportunity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Customer Segments */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">Top Customer Segments</h3>
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-3">
          {segments.map((seg) => (
            <div key={seg.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700">{seg.name}</span>
                <span className="font-semibold text-slate-900">{seg.percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-700 transition-all duration-300"
                  style={{ width: `${seg.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Key Risks Identification */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Key Risks &amp; Mitigations</h3>
        </div>
        <div className="space-y-2.5 border-t border-slate-100 pt-3">
          {risks.map((risk) => (
            <div
              key={risk.title}
              className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 border border-slate-100"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800">{risk.title}</p>
                {risk.description && (
                  <p className="mt-0.5 text-[11px] text-slate-500">{risk.description}</p>
                )}
              </div>
              <span
                className={cn(
                  'shrink-0 rounded px-2 py-0.5 text-[10px] font-medium border',
                  risk.level === 'High'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : risk.level === 'Medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}
              >
                {risk.level} Risk
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
