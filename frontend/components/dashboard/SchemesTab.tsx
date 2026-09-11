// components/dashboard/SchemesTab.tsx
// Government & concessional financing schemes tab.

'use client';

import React from 'react';
import { Award, CheckCircle2, AlertCircle, FileText, ArrowUpRight } from 'lucide-react';
import type { DetailedReport } from '@/data/reportsData';
import { cn } from '@/lib/cn';

interface SchemesTabProps {
  readonly report: DetailedReport;
}

export function SchemesTab({ report }: SchemesTabProps): React.JSX.Element {
  const { schemes } = report;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Matched Concessional Schemes</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Government-backed channelizing agency and priority sector schemes matched to your profile.
        </p>
      </div>

      <div className="space-y-3">
        {schemes.map((scheme) => (
          <div
            key={scheme.id}
            className={cn(
              'rounded-xl border bg-white p-5 space-y-3 transition-all',
              scheme.eligible
                ? 'border-emerald-200 shadow-sm'
                : 'border-slate-200 opacity-90'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    scheme.eligible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{scheme.name}</h4>
                  <p className="text-[11px] text-slate-500">{scheme.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {scheme.highlight && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
                    {scheme.highlight}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold',
                    scheme.eligible
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {scheme.eligible ? (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Eligible</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} />
                      <span>Threshold check required</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Scheme Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Project Cost</p>
                <p className="font-semibold text-slate-800 mt-0.5">{scheme.maxProjectCost}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Loan Share</p>
                <p className="font-semibold text-slate-800 mt-0.5">{scheme.maxLoan}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Interest Rate</p>
                <p className="font-semibold text-emerald-700 mt-0.5">{scheme.interestRate}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Tenure &amp; Moratorium</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {scheme.tenure} ({scheme.moratorium} mor.)
                </p>
              </div>
            </div>

            {/* Reasoning: why eligible / why not — mirrors the eligibility-vs-suitability
                transparency principle used on the Financials tab. */}
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[11px] leading-relaxed text-slate-600">
                <span
                  className={cn(
                    'font-semibold',
                    scheme.eligible ? 'text-emerald-700' : 'text-slate-700'
                  )}
                >
                  {scheme.eligible ? 'Why you qualify: ' : 'Why not yet: '}
                </span>
                {scheme.reasoning}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}