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
  const barColor =
    value >= 7.5
      ? 'bg-emerald-600'
      : value >= 5.0
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800 flex items-center">
          <AnimatedCounter value={value} decimals={1} />
          <span>/10</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor)}
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
      : 'bg-rose-50 text-rose-800 border-rose-200';

  return (
    <div className="space-y-6">
      {/* 1. Score Section: stacked on mobile, side-by-side on desktop (md:flex-row) */}
      <div className="flex flex-col md:flex-row gap-6 rounded-xl border border-slate-200 bg-white p-5 md:p-6">
        {/* Ring & Verdict side */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left md:w-1/2 justify-between">
          <div>
            <div className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border', viabilityBadgeStyle)}>
              <ShieldCheck size={14} />
              <span>{report.viabilityLabel}</span>
            </div>
            <p className="mt-2 text-xs md:text-sm text-slate-600 max-w-sm">
              {report.viabilityDescription}
            </p>
          </div>

          <div className="my-4 flex items-center gap-4">
            <ScoreRing score={report.fitScore} />
            <div className="text-left">
              <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {report.confidence} confidence
              </span>
              <p className="mt-1 text-xs text-slate-500">Based on local supply & demand data</p>
            </div>
          </div>

          {/* Teaser CTA */}
          <button
            type="button"
            onClick={onNavigateFinancials}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            <span>Recommended: ₹{report.recommendation.recommendedProjectCost.toLocaleString('en-IN')} project</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Breakdown bars side */}
        <div className="border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pl-6 md:pt-0 md:w-1/2 flex flex-col justify-center space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Fit Score Breakdown
          </h3>
          <BreakdownBar label="Market Opportunity" value={report.breakdown.marketOpportunity} />
          <BreakdownBar label="Competition" value={report.breakdown.competition} />
          <BreakdownBar label="Capital Fit" value={report.breakdown.capitalFit} />
          <BreakdownBar label="Supply Risk" value={report.breakdown.supplyRisk} />
        </div>
      </div>

      {/* 2. AI Advisory & Grounded Evidence Section (Rendered when live AI insights exist) */}
      {report.aiInsights && <AIAdvisorySection aiInsights={report.aiInsights} />}

      {/* 3. Final Recommendation Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Final Recommendation</h3>
          <p className="mt-1 text-xs md:text-sm text-slate-600 font-medium">
            {report.recommendation.verdict}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
          {/* Supporting Factors */}
          <div className="space-y-2">
            <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>Supporting factors</span>
            </p>
            <ul className="space-y-1.5 text-slate-600 pl-5 list-disc marker:text-emerald-500">
              {report.recommendation.supportingFactors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </div>

          {/* Points to Consider */}
          <div className="space-y-2">
            <p className="font-semibold text-amber-800 flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>Points to consider</span>
            </p>
            <ul className="space-y-1.5 text-slate-600 pl-5 list-disc marker:text-amber-500">
              {report.recommendation.pointsToConsider.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Key Insights */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Insights</h3>
        <div className="space-y-2">
          {report.keyInsights.map((insight) => (
            <p key={insight} className="text-xs text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              {insight}
            </p>
          ))}
        </div>
      </div>
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
