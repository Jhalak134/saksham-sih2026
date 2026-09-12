// components/dashboard/SchemesTab.tsx
// Government & concessional financing schemes tab.
// Connected to live backend endpoints: GET /api/v1/schemes, POST /schemes/calculate-emi, POST /schemes/match.

'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { DetailedReport } from '@/data/reportsData';
import type { OfficialScheme } from '@/lib/api-types';
import { getSchemes } from '@/lib/api-client';
import { SchemeEmiCalculator } from './SchemeEmiCalculator';
import { SchemeMarginMatcher } from './SchemeMarginMatcher';
import { cn } from '@/lib/cn';

interface SchemesTabProps {
  readonly report: DetailedReport;
}

export function SchemesTab({ report }: SchemesTabProps): React.JSX.Element {
  const { schemes: matchedSchemes } = report;
  const [officialSchemes, setOfficialSchemes] = useState<OfficialScheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchemes();
      setOfficialSchemes(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to schemes service';
      setError(msg);
      setOfficialSchemes([]);
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
        const data = await getSchemes();
        if (isMounted) setOfficialSchemes(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to connect to schemes service';
        if (isMounted) {
          setError(msg);
          setOfficialSchemes([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Matched Concessional Schemes</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Government-backed channelizing agency and priority sector schemes matched to your profile.
        </p>
      </div>

      {/* ── 1. Matched Scheme for This Assessment (Persisted & Authoritative) ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-700" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recommended Scheme for Your Assessment
          </h4>
        </div>

        {matchedSchemes.map((scheme) => (
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

            {/* Reasoning */}
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

      {/* ── 2. All Official Schemes from Backend (GET /api/v1/schemes) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-slate-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Official Statutory Credit Schemes (Live Database)
            </h4>
          </div>
          <button
            type="button"
            onClick={loadSchemes}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-xs text-slate-500">
            <Loader2 size={16} className="animate-spin text-emerald-700" />
            <span>Loading official credit schemes from backend...</span>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-xl bg-rose-50 p-4 border border-rose-200 text-xs text-rose-900">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Failed to load official schemes from backend</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadSchemes}
              className="shrink-0 rounded-lg bg-rose-100 px-3 py-1.5 font-bold text-rose-800 hover:bg-rose-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && officialSchemes.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No official schemes currently registered in database.
          </div>
        )}

        {!loading && !error && officialSchemes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {officialSchemes.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold text-slate-900">{s.name}</h5>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    {s.interest_rate}% p.a.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs">
                  <div>
                    <span className="text-[10.5px] text-slate-400">Max Project Cost</span>
                    <p className="font-semibold text-slate-800">
                      ₹{s.max_project_cost.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400">Max Loan Ceiling</span>
                    <p className="font-semibold text-slate-800">
                      ₹{s.max_loan_amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400">Tenure</span>
                    <p className="font-semibold text-slate-800">{s.tenure_months} Months</p>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400">Moratorium</span>
                    <p className="font-semibold text-slate-800">{s.moratorium_months} Months</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">Margin: </span>
                  <span>{s.margin_requirement || '10% own promoter contribution'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Interactive EMI Simulator (POST /api/v1/schemes/calculate-emi) ── */}
      {officialSchemes.length > 0 && (
        <SchemeEmiCalculator
          schemes={officialSchemes}
          defaultSchemeId={Number(report.schemes[0]?.id) || 1}
        />
      )}

      {/* ── 4. Alternative Margin Matcher (POST /api/v1/schemes/match) ── */}
      <SchemeMarginMatcher category={report.category} />

      {/* ── 5. Statutory Disclaimer ── */}
      <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
        <p className="font-bold text-slate-800">Statutory Eligibility &amp; Underwriting Policy</p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          A scheme match indicates policy parameter alignment under official guidelines; final sanction
          requires designated bank pre-approval, proforma invoices, and formal credit appraisal.
          Calculations are executed deterministically by the SAKSHAM financial engine.
        </p>
      </div>
    </div>
  );
}
