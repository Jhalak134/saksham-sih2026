// components/dashboard/MarketTab.tsx
// Market analysis tab with Market Snapshot, Local Summary, Segments, Risks, and Hyper-Local Category Demand Trends.
// Connected to backend GET /api/v1/insights/{location} with strict historical and OSM data provenance labeling.

'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  Store,
  MapPin,
  AlertCircle,
  Activity,
  RefreshCw,
  Loader2,
  Info,
} from 'lucide-react';
import type { DetailedReport } from '@/data/reportsData';
import type { InsightsResponse } from '@/lib/api-types';
import { getInsights } from '@/lib/api-client';
import { cn } from '@/lib/cn';

interface MarketTabProps {
  readonly report: DetailedReport;
}

export function MarketTab({ report }: MarketTabProps): React.JSX.Element {
  const { snapshot, localSummary, segments, risks } = report.market;
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extract clean location identifier for insights query
  const targetLocation = report.location.split(',')[0].trim() || report.location;

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInsights(targetLocation);
      setInsights(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to insights service';
      setError(msg);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getInsights(targetLocation);
        if (isMounted) setInsights(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to connect to insights service';
        if (isMounted) {
          setError(msg);
          setInsights(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [targetLocation]);

  return (
    <div className="space-y-6">
      {/* ── 1. Snapshot + Local Summary: stacked on mobile, side-by-side on desktop ── */}
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

        {/* Local Market Summary Card (with Provenance Labeling) */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store size={16} className="text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Local Market Summary</h3>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
              Verified Village Catchment
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <p className="text-[11px] text-slate-500">Households</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {localSummary.estimatedHouseholds.toLocaleString('en-IN')}
              </p>
              <span className="block text-[9px] text-slate-400 font-normal">Census 2011</span>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Competitors</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{localSummary.mappedCompetitors}</p>
              <span className="block text-[9px] text-slate-400 font-normal">OSM Mapped</span>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Markets</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{localSummary.nearbyMarkets}</p>
              <span className="block text-[9px] text-slate-400 font-normal">Nearby</span>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Opportunity</p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">{localSummary.marketOpportunity}</p>
              <span className="block text-[9px] text-slate-400 font-normal">Catchment</span>
            </div>
          </div>

          {/* Historical Data & Coverage Provenance Notice */}
          <div className="rounded-lg bg-amber-50/70 p-2.5 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold">Historical &amp; Coverage Notice: </span>
              Demographics reflect the official Census 2011 baseline. Competitor density reflects verified
              OpenStreetMap observed businesses; informal home-based ventures are not enumerated.
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Hyper-Local Category Demand Trends (Live GET /api/v1/insights/{location}) ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Hyper-Local Category Demand Trends ({targetLocation})
              </h3>
              <p className="text-[11px] text-slate-500">
                Empirical activity trajectory and seasonality classifications from backend insights engine.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadInsights}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-6 text-xs text-slate-500">
            <Loader2 size={16} className="animate-spin text-emerald-700" />
            <span>Retrieving localized category trends for {targetLocation}...</span>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-lg bg-rose-50 p-3 border border-rose-200 text-xs text-rose-900">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Failed to load location insights</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadInsights}
              className="shrink-0 rounded bg-rose-100 px-2.5 py-1 font-bold text-rose-800 hover:bg-rose-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && insights && insights.categories.length === 0 && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No category trend data recorded for {targetLocation}.
          </div>
        )}

        {!loading && !error && insights && insights.categories.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {insights.categories.map((cat) => {
                const isSelected =
                  cat.name.toLowerCase() === report.category.toLowerCase();
                return (
                  <div
                    key={cat.name}
                    className={cn(
                      'rounded-xl border p-3 space-y-1.5 transition-all',
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {cat.name}
                      </span>
                      {isSelected && (
                        <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                          Assessed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-extrabold flex items-center gap-0.5">
                        <span className="text-[10px]">↑</span> +{cat.trend}%
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {cat.seasonality}
                      </span>
                    </div>

                    {/* Sparkline Visual */}
                    <div className="flex items-end gap-1 h-4 pt-1">
                      {cat.sparkline.map((val, idx) => {
                        const maxVal = Math.max(...cat.sparkline, 1);
                        const heightPct = Math.round((val / maxVal) * 100);
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'flex-1 rounded-xs transition-all',
                              isSelected ? 'bg-emerald-600' : 'bg-slate-300'
                            )}
                            style={{ height: `${Math.max(15, heightPct)}%` }}
                            title={`Trend step ${idx + 1}: ${val}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transparency / Limitation note */}
            <p className="text-[10.5px] text-slate-400 italic">
              Note: Category demand trajectories represent regional activity baselines from district industrial profiles.
              Seasonality flags are aligned with official MSME operating cycles.
            </p>
          </div>
        )}
      </div>

      {/* ── 3. Top Customer Segments ── */}
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

      {/* ── 4. Key Risks Identification ── */}
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
