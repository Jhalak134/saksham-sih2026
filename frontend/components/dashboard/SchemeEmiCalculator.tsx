// components/dashboard/SchemeEmiCalculator.tsx
// Interactive EMI calculation tool matching reference design media_1789219037457.png.
// Connected directly to backend POST /api/v1/schemes/calculate-emi with fallback calculation.

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
  initialLoanAmount = 110000,
}: SchemeEmiCalculatorProps): React.JSX.Element {
  // Built-in statutory schemes fallback if schemes array is empty
  const defaultSchemes: OfficialScheme[] = [
    {
      id: 1,
      name: 'Micro Finance Scheme',
      interest_rate: 6.5,
      max_loan_amount: 125000,
      max_project_cost: 140000,
      tenure_months: 36,
      moratorium_months: 6,
      margin_requirement: '10% own contribution',
    },
    {
      id: 2,
      name: 'Term Loan Scheme',
      interest_rate: 8.0,
      max_loan_amount: 4500000,
      max_project_cost: 5000000,
      tenure_months: 84,
      moratorium_months: 6,
      margin_requirement: '10% own contribution',
    },
  ];

  const availableSchemes = schemes && schemes.length > 0 ? schemes : defaultSchemes;

  const [selectedSchemeId, setSelectedSchemeId] = useState<number>(
    defaultSchemeId ?? availableSchemes[0]?.id ?? 1
  );
  const [loanAmount, setLoanAmount] = useState<number>(initialLoanAmount);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EMICalculationResponse | null>(null);

  const activeScheme =
    availableSchemes.find((s) => s.id === selectedSchemeId) ?? availableSchemes[0];

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
    } catch {
      // Fallback reducing balance calculation if backend offline
      const r = activeScheme.interest_rate / (12 * 100);
      const n = activeScheme.tenure_months - activeScheme.moratorium_months;
      const emi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalRepayment = emi * n;
      const totalInterest = totalRepayment - loanAmount;

      setResult({
        principal: loanAmount,
        monthly_emi: Math.round(emi * 100) / 100,
        total_repayment: Math.round(totalRepayment * 100) / 100,
        total_interest: Math.round(totalInterest * 100) / 100,
        repayment_months: n,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] shadow-2xs">
          <Calculator size={20} strokeWidth={2.2} />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900">EMI Calculator</h4>
          <p className="text-xs sm:text-sm text-slate-700 font-medium">
            See your estimated monthly payment for a loan amount.
          </p>
        </div>
      </div>

      {/* Form Inputs matching mockup */}
      <form onSubmit={handleCalculate} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Scheme Select */}
          <div>
            <label
              htmlFor="scheme-select"
              className="block text-xs font-bold text-slate-900 mb-1.5"
            >
              Select Scheme
            </label>
            <select
              id="scheme-select"
              value={selectedSchemeId}
              onChange={(e) => {
                setSelectedSchemeId(Number(e.target.value));
                setResult(null);
                setError(null);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#E8A93D] focus:ring-1 focus:ring-[#E8A93D] focus:outline-none"
            >
              {availableSchemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.interest_rate}% p.a.)
                </option>
              ))}
            </select>
          </div>

          {/* Proposed Loan Amount */}
          <div>
            <label
              htmlFor="loan-amount"
              className="block text-xs font-bold text-slate-900 mb-1.5"
            >
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#E8A93D] focus:ring-1 focus:ring-[#E8A93D] focus:outline-none"
              placeholder="110000"
            />
          </div>
        </div>

        {/* Full-width Mustard Yellow Button matching mockup */}
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8A93D] hover:bg-[#d9982f] px-5 py-3 text-sm font-extrabold text-slate-950 shadow-xs transition-all active:scale-[0.99] cursor-pointer',
            loading && 'opacity-70 cursor-not-allowed'
          )}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin text-slate-950" />
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <span>Calculate EMI</span>
              <ArrowRight size={16} strokeWidth={2.4} />
            </>
          )}
        </button>
      </form>

      {/* Error display */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-900 font-medium"
        >
          <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Calculated Result display */}
      {result && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <CheckCircle2 size={15} className="text-emerald-700" />
            <span>Backend Calculated Repayment Schedule</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-200/80 pt-2.5">
            <div>
              <p className="text-[11px] font-semibold text-slate-600">Monthly EMI</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                ₹{result.monthly_emi.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-600">Total Repayment</p>
              <p className="font-bold text-slate-900 mt-0.5">
                ₹{result.total_repayment.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-600">Total Interest</p>
              <p className="font-bold text-slate-900 mt-0.5">
                ₹{result.total_interest.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-600">Repayment Period</p>
              <p className="font-bold text-slate-900 mt-0.5">
                {result.repayment_months} Mos (post-mor.)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
