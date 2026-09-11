// components/dashboard/SchemeMarginMatcher.tsx
// Interactive scheme matching tool connecting to backend POST /api/v1/schemes/match.
// Invariant: Backend deterministic engine performs all matching logic. Zero frontend rule duplication.

'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { SchemeMatchResponse } from '@/lib/api-types';
import { matchScheme } from '@/lib/api-client';
import { cn } from '@/lib/cn';

interface SchemeMarginMatcherProps {
  readonly initialMargin?: number;
  readonly category?: string;
}

export function SchemeMarginMatcher({
  initialMargin = 20000,
  category = 'Dairy',
}: SchemeMarginMatcherProps): React.JSX.Element {
  const [margin, setMargin] = useState<number>(initialMargin);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<SchemeMatchResponse | null>(null);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (margin <= 0) {
      setError('Available margin must be greater than zero');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await matchScheme({
        available_margin: margin,
        category,
      });
      setMatchResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scheme matching query failed';
      setError(msg);
      setMatchResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <SlidersHorizontal size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Alternative Margin Matcher (Backend Engine)</h4>
            <p className="text-[11px] text-slate-500">
              Evaluate statutory scheme tiering for different promoter equity buffers (POST /api/v1/schemes/match)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleMatch} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div className="sm:col-span-2">
          <label htmlFor="margin-input" className="block text-xs font-semibold text-slate-700 mb-1">
            Test Available Margin (₹) — 10% Equity Buffer
          </label>
          <input
            id="margin-input"
            type="number"
            min={1000}
            step={5000}
            value={margin}
            onChange={(e) => {
              setMargin(Number(e.target.value));
              setMatchResult(null);
              setError(null);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none"
            placeholder="e.g. 25000"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 focus:outline-none',
              loading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Matching...</span>
              </>
            ) : (
              <>
                <span>Check Match</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 border border-rose-200 text-xs text-rose-800">
          <AlertCircle size={14} className="text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {matchResult && (
        <div className="rounded-xl bg-sky-50/70 border border-sky-200 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
              <CheckCircle2 size={14} className="text-sky-700" />
              <span>Matched Scheme: {matchResult.scheme_name}</span>
            </div>
            <span className="rounded bg-sky-100 px-2 py-0.5 text-[10.5px] font-semibold text-sky-800 border border-sky-300">
              {matchResult.repayment_burden_category}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t border-sky-100 pt-2.5">
            <div>
              <p className="text-[11px] text-sky-800">Statutory Project Size</p>
              <p className="font-bold text-sky-950 mt-0.5">
                ₹{matchResult.project_cost.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-sky-800">Concessional Loan Share</p>
              <p className="font-bold text-sky-950 mt-0.5">
                ₹{matchResult.max_loan_amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-sky-800">Interest Rate</p>
              <p className="font-bold text-sky-950 mt-0.5">{matchResult.interest_rate}% p.a.</p>
            </div>
            <div>
              <p className="text-[11px] text-sky-800">Calculated Monthly EMI</p>
              <p className="font-bold text-sky-950 mt-0.5">
                ₹{matchResult.monthly_emi.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
