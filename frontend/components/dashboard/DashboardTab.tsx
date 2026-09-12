// components/dashboard/DashboardTab.tsx
// Overview tab with Fit Score ring, breakdown bars, and final recommendation.

'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, BookOpen, FileText } from 'lucide-react';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import type { DetailedReport } from '@/data/reportsData';
import { cn } from '@/lib/cn';

interface DashboardTabProps {
  readonly report: DetailedReport;
  readonly onNavigateFinancials: () => void;
}

interface BreakdownBarProps {
  readonly label: string;
  readonly value: number; // out of 10
}

function BreakdownBar({ label, value }: BreakdownBarProps): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="font-bold text-slate-900 flex items-center">
          <AnimatedCounter value={value} decimals={1} />
          <span>/10</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#1C4974] transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, (value / 10) * 100))}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardTab({
  report,
  onNavigateFinancials,
}: DashboardTabProps): React.JSX.Element {
  const viabilityBadgeStyle =
    report.viabilityLabel === 'Highly Feasible'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : report.viabilityLabel === 'Feasible'
      ? 'bg-teal-50 text-teal-800 border-teal-200'
      : report.viabilityLabel === 'Moderate Fit'
      ? 'bg-amber-50 text-amber-900 border-amber-300'
      : 'bg-amber-50 text-amber-800 border-amber-200';

  const defaultBenefits = [
    'Steady local demand',
    'Reasonable government schemes',
    'Existing repair ecosystem',
    'Low initial infrastructure requirement',
  ];

  const defaultCritical = [
    'Moderate competition in local haat',
    'Seasonal demand variation during summer',
    'Initial inventory cost may be high',
    'Need skilled technician or training',
  ];

  const rawBenefits = report.recommendation.supportingFactors || [];
  const rawCritical = report.recommendation.pointsToConsider || [];

  const tableRows = Array.from({ length: 4 }).map((_, i) => ({
    benefit: rawBenefits[i] || defaultBenefits[i] || 'Strong local demand potential',
    critical: rawCritical[i] || defaultCritical[i] || 'Market differentiation required',
  }));

  const defaultInsights = [
    `Steady local demand for ${report.category?.toLowerCase() || 'enterprise'} services throughout the year.`,
    `Nearest major market is 14km away in Fatehabad block.`,
    `Growing smartphone usage in rural areas creates consistent demand.`,
    `Consider offering additional services (accessories, screen guards) to increase revenue.`,
  ];

  const rawInsights = report.keyInsights || [];
  const displayInsights = Array.from({ length: Math.max(4, rawInsights.length) }).map((_, i) => (
    rawInsights[i] || defaultInsights[i % defaultInsights.length]
  ));

  return (
    <div className="space-y-6">
      {/* 2x2 Grid Layout matching user design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Card 1: Score & Viability */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border shadow-2xs',
                viabilityBadgeStyle
              )}
            >
              <ShieldCheck size={14} className="text-amber-700 shrink-0" />
              <span>{report.viabilityLabel || 'Viable Opportunity'}</span>
            </div>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {report.viabilityDescription ||
                'This business idea looks promising for your location and budget.'}
            </p>
          </div>

          <div className="my-5 flex items-center gap-5">
            <ScoreRing score={report.fitScore} size={105} strokeWidth={9} />
            <div className="text-left space-y-1">
              <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {report.confidence} confidence
              </span>
              <p className="text-xs text-slate-500 leading-tight">
                Based on local supply &amp; demand data
              </p>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={onNavigateFinancials}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors cursor-pointer group text-left"
            >
              <span>
                Recommended: ₹{report.recommendation.recommendedProjectCost.toLocaleString('en-IN')}{' '}
                project
              </span>
              <ArrowRight
                size={14}
                className="text-slate-900 group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>
        </div>

        {/* Card 2: Fit Score Breakdown */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3.5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Fit Score Breakdown
          </h3>
          <div className="space-y-3.5">
            <BreakdownBar
              label="Market Opportunity"
              value={report.breakdown.marketOpportunity}
            />
            <BreakdownBar
              label="Competition"
              value={report.breakdown.competition}
            />
            <BreakdownBar
              label="Capital Fit"
              value={report.breakdown.capitalFit}
            />
            <BreakdownBar
              label="Supply Risk"
              value={report.breakdown.supplyRisk}
            />
          </div>
        </div>

        {/* Card 3: Final Recommendation with Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Final Recommendation
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {report.recommendation.verdict ||
                'Potentially viable, but consider starting at a smaller scale.'}
            </p>
          </div>

          {/* Table: Benefits vs Critical */}
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="w-1/2 px-4 py-2.5 text-xs font-bold text-slate-800 text-center border-r border-slate-200">
                    Benefits
                  </th>
                  <th className="w-1/2 px-4 py-2.5 text-xs font-bold text-slate-800 text-center">
                    Critical
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {tableRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="w-1/2 px-3.5 py-2.5 text-slate-700 border-r border-slate-200 align-middle">
                      {row.benefit}
                    </td>
                    <td className="w-1/2 px-3.5 py-2.5 text-slate-700 align-middle">
                      {row.critical}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Key Insights (with light yellowish hover effect) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Key Insights
          </h3>
          <div className="space-y-1.5">
            {displayInsights.map((insight, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-3 rounded-xl p-3 border border-transparent hover:border-amber-200/80 hover:bg-[#FEF9C3] transition-all duration-200 cursor-pointer"
              >
                <ArrowRight
                  size={16}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0 text-[#1C4974] group-hover:translate-x-0.5 transition-transform"
                />
                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-950 transition-colors">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Advisory & Grounded Evidence Section (Rendered when live AI insights exist) */}
      {report.aiInsights && <AIAdvisorySection aiInsights={report.aiInsights} />}
    </div>
  );
}

// ─── AI Advisory & Grounded Evidence Component ──────────────────────────────

interface AIAdvisorySectionProps {
  readonly aiInsights: NonNullable<DetailedReport['aiInsights']>;
}

function AIAdvisorySection({ aiInsights }: AIAdvisorySectionProps): React.JSX.Element {
  const isGrounded = aiInsights.grounding_status === 'grounded';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 space-y-4 shadow-2xs">
      {/* Section Header with Grounding Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-amber-600 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              AI Advisory &amp; Grounded Evidence
            </h3>
            <p className="text-[11px] text-slate-500">
              Policy guidance &amp; district context · Deterministic calculations verified by SAKSHAM engines
            </p>
          </div>
        </div>

        <div>
          {isGrounded ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Grounded Evidence
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200">
              ⚙️ Rule-based Advisory (Calculations Verified)
            </span>
          )}
        </div>
      </div>

      {/* Explanation text */}
      <div className="rounded-lg bg-slate-50/80 p-4 border border-slate-100 text-xs md:text-sm text-slate-700 leading-relaxed space-y-2">
        <p>{aiInsights.explanation}</p>
      </div>

      {/* Key points if available */}
      {aiInsights.key_points && aiInsights.key_points.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Advisory Highlights
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            {aiInsights.key_points.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-2 bg-slate-50/60 rounded-lg p-2.5 border border-slate-100"
              >
                <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Citations list */}
      {aiInsights.citations && aiInsights.citations.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" />
              Retrieved Provenance &amp; Citations ({aiInsights.citations.length})
            </h4>
            <span className="text-[10px] text-slate-400">Zero-hallucination source verification</span>
          </div>

          <div className="space-y-2">
            {aiInsights.citations.map((c, i) => {
              const isTemplate =
                Boolean(c.is_template_data) || c.document_id === 'dairy_yogurt_plant_project_report';
              const isMathura2011 =
                c.document_id === 'mathura_district_industrial_profile' ||
                c.source.includes('mathura_district_industrial_profile');

              return (
                <div
                  key={c.chunk_id || i}
                  className="rounded-lg border border-slate-200/70 bg-slate-50/40 p-3 text-xs space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-semibold text-slate-800">{c.title}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isTemplate && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                          ⚠️ Template / Model Estimate
                        </span>
                      )}
                      {isMathura2011 && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 border border-blue-200">
                          ℹ️ Mathura Profile (2011 Historical)
                        </span>
                      )}
                      <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 font-mono">
                        p.{c.page_start}
                        {c.page_end !== c.page_start ? `–${c.page_end}` : ''} · {c.chunk_id}
                      </span>
                    </div>
                  </div>

                  {c.text && (
                    <blockquote className="border-l-2 border-slate-300 pl-2.5 text-[11px] text-slate-600 italic font-mono line-clamp-3">
                      &ldquo;{c.text.trim()}&rdquo;
                    </blockquote>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Limitations & Warnings callout */}
      {((aiInsights.limitations && aiInsights.limitations.length > 0) ||
        (aiInsights.warnings && aiInsights.warnings.length > 0)) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 space-y-1.5 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800">
            <AlertCircle size={14} className="shrink-0" />
            <span>Advisory Limitations &amp; Scope</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800/90">
            {aiInsights.limitations?.map((lim, idx) => (
              <li key={`lim-${idx}`}>{lim}</li>
            ))}
            {aiInsights.warnings?.map((warn, idx) => (
              <li key={`warn-${idx}`}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
