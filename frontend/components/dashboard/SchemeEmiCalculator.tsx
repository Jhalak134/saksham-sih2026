// components/dashboard/SchemeEmiCalculator.tsx
// Interactive EMI calculation tool connecting directly to backend POST /api/v1/schemes/calculate-emi.
// Invariant: Zero frontend financial calculations. All math executed by backend deterministic engine.

'use client';

import React, { useState } from 'react';
import { Calculator, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { OfficialScheme, EMICalculationResponse } from '@/lib/api-types';
import { calculateSchemeEmi } from '@/lib/api-client';
import { cn } from '@/lib/cn';

interface SchemeEmiCalculatorProps {
  readonly schemes: readonly OfficialScheme[];
  readonly defaultSchemeId?: number;
  readonly initialLoanAmount?: number;
}

export function SchemeEmiCalculator({
  schemes,
  defaultSchemeId,
  initialLoanAmount = 90000,
}: SchemeEmiCalculatorProps): React.JSX.Element {
  const [selectedSchemeId, setSelectedSchemeId] = useState<number>(
    defaultSchemeId ?? schemes[0]?.id ?? 1
  );
  const [loanAmount, setLoanAmount] = useState<number>(initialLoanAmount);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EMICalculationResponse | null>(null);

  const activeScheme = schemes.find((s) => s.id === selectedSchemeId) ?? schemes[0];

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScheme) {
      setError('Please select a valid scheme');
      return;
    }
    if (loanAmount <= 0) {
      setError('Loan amount must be greater than zero');
      return;
    }
    if (loanAmount > activeScheme.max_loan_amount) {
      setError(
        `Requested loan (₹${loanAmount.toLocaleString('en-IN')}) exceeds statutory ceiling of ₹${activeScheme.max_loan_amount.toLocaleString('en-IN')} for ${activeScheme.name}.`
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const emiData = await calculateSchemeEmi({
        loan_amount: loanAmount,
        interest_rate: activeScheme.interest_rate,
        tenure_months: activeScheme.tenure_months,
        moratorium_months: activeScheme.moratorium_months,
      });
      setResult(emiData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backend EMI calculation failed';
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Calculator size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Official EMI Simulator (Backend Engine)</h4>
            <p className="text-[11px] text-slate-500">
              Direct reducing-balance calculation via POST /api/v1/schemes/calculate-emi
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label htmlFor="scheme-select" className="block text-xs font-semibold text-slate-700 mb-1">
            Target Scheme
          </label>
          <select
            id="scheme-select"
            value={selectedSchemeId}
            onChange={(e) => {
              setSelectedSchemeId(Number(e.target.value));
              setResult(null);
              setError(null);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-none"
          >
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.interest_rate}% p.a.)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="loan-amount" className="block text-xs font-semibold text-slate-700 mb-1">
            Proposed Loan Amount (₹)
          </label>
          <input
            id="loan-amount"
            type="number"
            min={1000}
            step={5000}
            value={loanAmount}
            onChange={(e) => {
              setLoanAmount(Number(e.target.value));
              setResult(null);
              setError(null);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-none"
            placeholder="e.g. 90000"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-800 focus:outline-none',
              loading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <span>Calculate EMI</span>
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

      {result && (
        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <CheckCircle2 size={14} className="text-emerald-700" />
            <span>Backend Calculated Repayment Schedule</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <p className="text-[11px] text-emerald-800">Monthly EMI</p>
              <p className="text-base font-extrabold text-emerald-950 mt-0.5">
                ₹{result.monthly_emi.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-emerald-800">Total Repayment</p>
              <p className="font-bold text-emerald-950 mt-0.5">
                ₹{result.total_repayment.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-emerald-800">Total Interest</p>
              <p className="font-bold text-emerald-950 mt-0.5">
                ₹{result.total_interest.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-emerald-800">Repayment Period</p>
              <p className="font-bold text-emerald-950 mt-0.5">
                {result.repayment_months} Mos (post-moratorium)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
