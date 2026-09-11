// components/compare/CompareAssessmentCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Landmark,
  ExternalLink,
} from 'lucide-react';
import { getCategoryIcon } from '@/components/discover/CategoryIcons';
import { formatCurrency } from '@/lib/format';
import type { BackendAssessmentResponse } from '@/lib/api-types';

interface CompareAssessmentCardProps {
  readonly assessment: BackendAssessmentResponse;
}

function getRatingBadgeStyle(rating: string): string {
  const lower = rating.toLowerCase();
  if (lower.includes('highly feasible') || lower.includes('strong')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (lower.includes('feasible')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function getBurdenBadgeStyle(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('low risk')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (lower.includes('moderate')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export function CompareAssessmentCard({
  assessment,
}: CompareAssessmentCardProps): React.JSX.Element {
  const fin = assessment.financial;
  const feas = assessment.feasibility;
  const vil = assessment.village;
  const cat = assessment.category;
  const rating = assessment.rating ?? 'Feasible';
  const confidence = assessment.confidence ?? assessment.confidence_level ?? 'High';
  const fitScore = assessment.fitScore ?? assessment.fit_score ?? 0;
  const compCount = assessment.competitor_count ?? 0;
  const aiInsights = assessment.ai_insights;

  const groundingStatus = aiInsights?.grounding_status ?? 'unverified';
  const isGrounded = groundingStatus === 'grounded';

  return (
    <article
      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition hover:border-slate-300"
      aria-label={`Assessment comparison card #${assessment.id}`}
    >
      <div className="space-y-5">
        {/* Header: ID, Category, Location */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              {getCategoryIcon(cat?.name ?? 'General', 24, 'text-amber-600')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  Assessment #{assessment.id}
                </span>
                <span className="text-xs text-slate-400">
                  {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString('en-IN') : 'Recent'}
                </span>
              </div>
              <h3 className="mt-1 text-base sm:text-lg font-bold text-slate-900">
                {cat?.name ?? 'Rural Enterprise'}
              </h3>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                <span>
                  {vil ? `${vil.name}, Block ${vil.block_name}` : 'Mathura District'}
                </span>
              </p>
            </div>
          </div>

          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            Census 2011 Baseline
          </span>
        </div>

        {/* Fit Score & Rating */}
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Feasibility Score
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {fitScore.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold ${getRatingBadgeStyle(rating)}`}
            >
              {rating}
            </span>
            <span className="text-[11px] text-slate-500">{confidence} confidence</span>
          </div>
        </div>

        {/* Financial Highlights (Authoritative Backend Figures) */}
        <div className="space-y-2.5 text-xs">
          <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-500">
            Authoritative Financials
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-100">
              <span className="text-slate-500 text-[11px]">Own Margin Capital</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {fin ? formatCurrency(fin.available_margin) : 'N/A'}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-100">
              <span className="text-slate-500 text-[11px]">Total Project Cost</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {fin ? formatCurrency(fin.project_cost) : 'N/A'}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-100">
              <span className="text-slate-500 text-[11px]">Concessional Loan</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {fin ? formatCurrency(fin.max_loan_amount) : 'N/A'}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-100">
              <span className="text-slate-500 text-[11px]">Monthly EMI</span>
              <div className="font-bold text-emerald-700 mt-0.5">
                {fin ? `₹${fin.monthly_emi.toLocaleString('en-IN')}` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Scheme & Repayment Burden */}
          {fin && (
            <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-950 flex items-center gap-1">
                  <Landmark size={13} className="text-blue-700" />
                  {fin.scheme_name}
                </span>
                <span className="text-[11px] font-bold text-blue-800">
                  {fin.interest_rate}% p.a.
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-blue-900">
                <span>Tenure: {fin.tenure_months} mo ({fin.moratorium_months} mo moratorium)</span>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${getBurdenBadgeStyle(fin.repayment_burden_category)}`}
                >
                  {fin.repayment_burden_category}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Feasibility Breakdown */}
        {feas?.breakdown && (
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-500">
              Feasibility Breakdown
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-600">Market</span>
                <span className="font-bold text-slate-900">{feas.breakdown.market_opportunity}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-600">Competition</span>
                <span className="font-bold text-slate-900">{feas.breakdown.competition}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-600">Capital Fit</span>
                <span className="font-bold text-slate-900">{feas.breakdown.capital_fit}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-600">Infrastructure</span>
                <span className="font-bold text-slate-900">{feas.breakdown.infrastructure}</span>
              </div>
            </div>
          </div>
        )}

        {/* Competitor Catchment */}
        <div className="flex items-center justify-between text-xs rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <span className="text-slate-600">Mapped Competitors</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900">{compCount}</span>
            <span className="text-[10px] text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
              OSM Mapped Coverage
            </span>
          </div>
        </div>

        {/* AI Advisory Provenance */}
        <div className="flex items-center justify-between text-xs rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <span className="text-slate-600">AI Advisory Grounding</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isGrounded
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {isGrounded ? '🟢 Grounded Evidence' : '⚪ Rule-based'}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <Link
          href={`/reports/${assessment.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
          aria-label={`View full report for Assessment #${assessment.id}`}
        >
          <span>View Full Assessment Report</span>
          <ExternalLink size={14} />
        </Link>
      </div>
    </article>
  );
}
