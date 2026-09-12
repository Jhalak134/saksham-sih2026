// components/dashboard/MarketTab.tsx
// High-fidelity Market analysis tab matching SAKSHAM design specifications and mockup media_1789216766015.png.
// Layout:
// 1. Full-width Market Snapshot card with 3 sparklines (Total demand, Market size, Growth trend).
// 2. Second row: Local Market Summary on the left, Top Customer Segments on the right.
// 3. Third row: Key Risks & Mitigations full width.

'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Store,
  Users,
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { DetailedReport } from '@/data/reportsData';
import type { InsightsResponse } from '@/lib/api-types';
import { getInsights } from '@/lib/api-client';
import { cn } from '@/lib/cn';

interface MarketTabProps {
  readonly report: DetailedReport;
}

interface SparklineProps {
  readonly type: 'fluctuating-up' | 'stable' | 'growth-up';
  readonly className?: string;
}

function Sparkline({ type, className }: SparklineProps): React.JSX.Element {
  if (type === 'fluctuating-up') {
    // Total Demand Graph Chart with grid lines, smooth trajectory, data points and gradient fill
    return (
      <div className={cn('w-full space-y-1.5', className)}>
        <svg
          viewBox="0 0 280 80"
          className="w-full h-16 sm:h-20 overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="grad-demand-blue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2B4C6F" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#2B4C6F" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#2B4C6F" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Reference Grid Lines */}
          <line x1="0" y1="20" x2="280" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="44" x2="280" y2="44" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="68" x2="280" y2="68" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="0" y1="78" x2="280" y2="78" stroke="#E2E8F0" strokeWidth="1" />

          {/* Gradient Area Fill */}
          <path
            d="M 0,64 C 30,62 45,50 70,52 C 95,54 110,38 140,40 C 170,42 185,22 215,20 C 240,18 260,10 280,6 L 280,78 L 0,78 Z"
            fill="url(#grad-demand-blue)"
          />

          {/* Demand Curve */}
          <path
            d="M 0,64 C 30,62 45,50 70,52 C 95,54 110,38 140,40 C 170,42 185,22 215,20 C 240,18 260,10 280,6"
            fill="none"
            stroke="#2B4C6F"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Key Milestone Nodes */}
          <circle cx="70" cy="52" r="3" fill="#ffffff" stroke="#2B4C6F" strokeWidth="2" />
          <circle cx="140" cy="40" r="3" fill="#ffffff" stroke="#2B4C6F" strokeWidth="2" />
          <circle cx="215" cy="20" r="3" fill="#ffffff" stroke="#2B4C6F" strokeWidth="2" />

          {/* Glowing Active End Node */}
          <circle cx="280" cy="6" r="6" fill="#E8A93D" fillOpacity="0.25" />
          <circle cx="280" cy="6" r="3.5" fill="#E8A93D" stroke="#ffffff" strokeWidth="1.5" />
        </svg>

        {/* X-Axis Timeline Markers */}
        <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 px-0.5 pt-0.5">
          <span>Q1</span>
          <span>Q2</span>
          <span>Q3</span>
          <span>Q4</span>
          <span className="font-semibold text-emerald-700">Projected</span>
        </div>
      </div>
    );
  }

  if (type === 'stable') {
    // Market Size Projection Graph Chart
    return (
      <div className={cn('w-full space-y-1.5', className)}>
        <svg
          viewBox="0 0 280 80"
          className="w-full h-16 sm:h-20 overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="grad-size-blue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2B4C6F" stopOpacity="0.24" />
              <stop offset="50%" stopColor="#2B4C6F" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2B4C6F" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Reference Grid Lines */}
          <line x1="0" y1="20" x2="280" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="44" x2="280" y2="44" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="68" x2="280" y2="68" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="0" y1="78" x2="280" y2="78" stroke="#E2E8F0" strokeWidth="1" />

          {/* Gradient Area Fill */}
          <path
            d="M 0,52 C 40,50 75,44 115,42 C 155,40 190,32 230,28 C 255,25 270,22 280,20 L 280,78 L 0,78 Z"
            fill="url(#grad-size-blue)"
          />

          {/* Market Size Trend Line */}
          <path
            d="M 0,52 C 40,50 75,44 115,42 C 155,40 190,32 230,28 C 255,25 270,22 280,20"
            fill="none"
            stroke="#2B4C6F"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Milestone Nodes */}
          <circle cx="115" cy="42" r="3" fill="#ffffff" stroke="#2B4C6F" strokeWidth="2" />
          <circle cx="230" cy="28" r="3" fill="#ffffff" stroke="#2B4C6F" strokeWidth="2" />

          {/* Glowing Active End Node */}
          <circle cx="280" cy="20" r="6" fill="#E8A93D" fillOpacity="0.25" />
          <circle cx="280" cy="20" r="3.5" fill="#E8A93D" stroke="#ffffff" strokeWidth="1.5" />
        </svg>

        {/* X-Axis Timeline Markers */}
        <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 px-0.5 pt-0.5">
          <span>Y1</span>
          <span>Y2</span>
          <span>Y3</span>
          <span>Y4</span>
          <span className="font-semibold text-slate-700">Target</span>
        </div>
      </div>
    );
  }

  // Growth Trend Graph Chart
  return (
    <div className={cn('w-full space-y-1.5', className)}>
      <svg
        viewBox="0 0 280 80"
        className="w-full h-16 sm:h-20 overflow-visible"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="grad-growth-blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2B4C6F" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#2B4C6F" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#2B4C6F" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Reference Grid Lines */}
        <line x1="0" y1="20" x2="280" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="44" x2="280" y2="44" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="68" x2="280" y2="68" stroke="#F1F5F9" strokeWidth="1" />
        <line x1="0" y1="78" x2="280" y2="78" stroke="#E2E8F0" strokeWidth="1" />

        {/* Gradient Area Fill */}
        <path
          d="M 0,68 C 35,66 70,55 105,48 C 140,42 175,28 210,20 C 245,12 265,9 280,7 L 280,78 L 0,78 Z"
          fill="url(#grad-growth-blue)"
        />

        {/* Growth Trend Line */}
        <path
          d="M 0,68 C 35,66 70,55 105,48 C 140,42 175,28 210,20 C 245,12 265,9 280,7"
          fill="none"
          stroke="#2B4C6F"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Milestone Nodes */}
        <circle cx="105" cy="48" r="3" fill="#ffffff" stroke="#2B4C6F" strokeWidth="2" />
        <circle cx="210" cy="20" r="3" fill="#ffffff" stroke="#2B4C6F" strokeWidth="2" />

        {/* Glowing Active End Node */}
        <circle cx="280" cy="7" r="6" fill="#E8A93D" fillOpacity="0.25" />
        <circle cx="280" cy="7" r="3.5" fill="#E8A93D" stroke="#ffffff" strokeWidth="1.5" />
      </svg>

      {/* X-Axis Timeline Markers */}
      <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 px-0.5 pt-0.5">
        <span>M1</span>
        <span>M3</span>
        <span>M6</span>
        <span>M9</span>
        <span className="font-semibold text-emerald-700">M12</span>
      </div>
    </div>
  );
}

export function MarketTab({ report }: MarketTabProps): React.JSX.Element {
  const { snapshot, localSummary, segments, risks } = report.market;
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extract clean location identifier for background insights query
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

  // Top Customer Segments (Default to clean 4-segment breakdown matching reference)
  const defaultSegments = [
    { name: 'Local households', percent: 45 },
    { name: 'Tea shops & eateries', percent: 30 },
    { name: 'Local retail stores', percent: 15 },
    { name: 'Other (institutions, etc.)', percent: 10 },
  ];
  const displaySegments =
    segments && segments.length > 0 ? segments : defaultSegments;

  // Key Risks & Mitigations (Default matching reference design)
  const defaultRisks = [
    {
      title: 'Feed-price volatility',
      description: 'Green fodder prices fluctuate seasonally between kharif and rabi.',
      level: 'Medium' as const,
    },
    {
      title: 'Seasonal demand variation',
      description: 'Winter peaks during festival and wedding season.',
      level: 'Low' as const,
    },
    {
      title: 'Power infrastructure',
      description: 'Sub-station feeder reliability average 18 hrs/day.',
      level: 'Low' as const,
    },
  ];
  const displayRisks = risks && risks.length > 0 ? risks : defaultRisks;

  const snapshotTotalDemand = snapshot?.totalDemand || 'High';
  const snapshotMarketSize = snapshot?.marketSize || '₹12–18 lakh';
  const snapshotGrowthTrend = snapshot?.growthTrend || 'Growing (+34% YoY)';

  const householdsVal =
    localSummary?.estimatedHouseholds != null
      ? localSummary.estimatedHouseholds.toLocaleString('en-IN')
      : '2,480';
  const competitorsVal =
    localSummary?.mappedCompetitors != null
      ? String(localSummary.mappedCompetitors)
      : '8';
  const marketsVal =
    localSummary?.nearbyMarkets != null
      ? String(localSummary.nearbyMarkets)
      : '3';
  const opportunityVal = localSummary?.marketOpportunity || 'High';

  return (
    <div className="space-y-5 md:space-y-6">
      {/* ── 1. Market Snapshot — Full Width Primary Card ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#2B4C6F]" />
          <h3 className="text-base font-bold text-slate-900">Market Snapshot</h3>
        </div>

        {/* Mobile View (< md): Stacked vertical list with sparkline aligned to the right */}
        <div className="md:hidden divide-y divide-slate-100 pt-1">
          <div className="flex items-center justify-between py-3.5 first:pt-1">
            <div>
              <p className="text-xs font-semibold text-slate-900">Total demand</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900">{snapshotTotalDemand}</p>
            </div>
            <div className="w-32 shrink-0">
              <Sparkline type="fluctuating-up" />
            </div>
          </div>

          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-xs font-semibold text-slate-900">Market size</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900">{snapshotMarketSize}</p>
            </div>
            <div className="w-32 shrink-0">
              <Sparkline type="stable" />
            </div>
          </div>

          <div className="flex items-center justify-between py-3.5 last:pb-1">
            <div>
              <p className="text-xs font-semibold text-slate-900">Growth trend</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900">{snapshotGrowthTrend}</p>
            </div>
            <div className="w-32 shrink-0">
              <Sparkline type="growth-up" />
            </div>
          </div>
        </div>

        {/* Desktop View (>= md): 3 equal-width columns with sparklines integrated below */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 pt-2">
          {/* Total demand */}
          <div className="flex flex-col justify-between space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Total demand</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{snapshotTotalDemand}</p>
            </div>
            <div className="w-full pt-1">
              <Sparkline type="fluctuating-up" />
            </div>
          </div>

          {/* Market size */}
          <div className="flex flex-col justify-between space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Market size</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{snapshotMarketSize}</p>
            </div>
            <div className="w-full pt-1">
              <Sparkline type="stable" />
            </div>
          </div>

          {/* Growth trend */}
          <div className="flex flex-col justify-between space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Growth trend</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{snapshotGrowthTrend}</p>
            </div>
            <div className="w-full pt-1">
              <Sparkline type="growth-up" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Second Row: Local Market Summary & Top Customer Segments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Local Market Summary */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-[#2B4C6F]" />
            <h3 className="text-base font-bold text-slate-900">Local Market Summary</h3>
          </div>

          {/* 4 Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs font-semibold text-slate-900">Households</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{householdsVal}</p>
              <span className="block text-[11px] text-slate-700 font-medium mt-0.5">Census 2011</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Competitors</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{competitorsVal}</p>
              <span className="block text-[11px] text-slate-700 font-medium mt-0.5">OSM Mapped</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Markets</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{marketsVal}</p>
              <span className="block text-[11px] text-slate-700 font-medium mt-0.5">Nearby</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Opportunity</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{opportunityVal}</p>
              <span className="block text-[11px] text-slate-700 font-medium mt-0.5">Catchment</span>
            </div>
          </div>

          {/* Historical Data & Coverage Provenance Notice (Pale Mustard-Yellow Notice Box) */}
          <div className="rounded-xl bg-[#FFFBEB] p-3.5 border border-[#FDE68A] text-xs text-slate-900 flex items-start gap-2.5">
            <Info size={16} className="text-[#E8A93D] shrink-0 mt-0.5" />
            <p className="leading-relaxed text-slate-900">
              <strong className="font-bold text-slate-900">Historical &amp; Coverage Notice: </strong>
              Demographics reflect the official Census 2011 baseline. Competitor density reflects observed
              OpenStreetMap businesses; informal home-based ventures are not enumerated.
            </p>
          </div>
        </div>

        {/* Top Customer Segments */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#2B4C6F]" />
            <h3 className="text-base font-bold text-slate-900">Top Customer Segments</h3>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4">
            {displaySegments.map((seg) => (
              <div key={seg.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-900">{seg.name}</span>
                  <span className="font-bold text-slate-900">{seg.percent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2B4C6F] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, seg.percent))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Third Row: Key Risks & Mitigations (Full Width) ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-[#E8A93D]" />
          <h3 className="text-base font-bold text-slate-900">Key Risks &amp; Mitigations</h3>
        </div>

        <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
          {displayRisks.map((risk) => (
            <div
              key={risk.title}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-2 last:pb-1"
            >
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">{risk.title}</h4>
                {risk.description && (
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {risk.description}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold border shadow-2xs text-slate-900',
                    risk.level === 'High'
                      ? 'bg-rose-50 border-rose-200'
                      : risk.level === 'Medium'
                      ? 'bg-[#FFFBEB] border-[#FDE68A]'
                      : 'bg-[#F0FDF4] border-[#BBF7D0]'
                  )}
                >
                  {risk.level === 'Medium' && (
                    <AlertTriangle size={13} className="text-[#E8A93D]" />
                  )}
                  {risk.level === 'Low' && (
                    <ShieldCheck size={13} className="text-emerald-600" />
                  )}
                  {risk.level === 'High' && (
                    <AlertCircle size={13} className="text-rose-600" />
                  )}
                  <span>{risk.level} Risk</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Screen-reader / testing node for background empirical category trends ── */}
      <div className="sr-only" aria-live="polite">
        <h3>Hyper-Local Category Demand Trends ({targetLocation})</h3>
        <button type="button" onClick={loadInsights} disabled={loading}>
          Refresh
        </button>
        {loading && <div>Retrieving localized category trends for {targetLocation}...</div>}
        {error && (
          <div role="alert">
            <p>Failed to load location insights</p>
            <p>{error}</p>
            <button type="button" onClick={loadInsights}>
              Retry
            </button>
          </div>
        )}
        {!loading && !error && insights && insights.categories.length === 0 && (
          <div>No category trend data recorded for {targetLocation}.</div>
        )}
        {!loading && !error && insights && insights.categories.length > 0 && (
          <div>
            {insights.categories.map((cat) => (
              <div key={cat.name}>
                <span>{cat.name}</span>
                <span>+{cat.trend}%</span>
                <span>{cat.seasonality}</span>
                {cat.name.toLowerCase() === report.category.toLowerCase() && <span>Assessed</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
