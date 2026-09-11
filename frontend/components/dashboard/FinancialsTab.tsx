// components/dashboard/FinancialsTab.tsx
// Financial analysis tab highlighting Eligibility vs. Suitability, Year 1 chart & break-even.

'use client';

import React from 'react';
import { IndianRupee, Landmark, CheckCircle, Clock } from 'lucide-react';
import type { DetailedReport } from '@/data/reportsData';
import { cn } from '@/lib/cn';

interface FinancialsTabProps {
  readonly report: DetailedReport;
}

export function FinancialsTab({ report }: FinancialsTabProps): React.JSX.Element {
  const { maxEligibility, suitability, breakEvenMonths, breakEvenNote, monthlyProjections } =
    report.financials;

  const maxRevenue = Math.max(...monthlyProjections.map((m) => Math.max(m.revenue, m.expenses)), 50000);

  return (
    <div className="space-y-6">
      {/* 1. Eligibility vs. Suitability: stacked on mobile, side-by-side on desktop (md:flex-row) */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Max Eligibility Card (Standard border) */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Financial Structure (Max Eligibility)
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Borrowing Ceiling
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Based on maximum statutory leverage allowable for your profile.
          </p>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <p className="text-[11px] text-slate-500">Project Cost</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                ₹{maxEligibility.projectCost.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Scheme</p>
              <p className="mt-1 text-xs font-semibold text-slate-800">
                {maxEligibility.schemeName}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Max Loan Amount</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                ₹{maxEligibility.maxLoanAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-400">({maxEligibility.loanSharePercent}% share)</p>
            </div>
          </div>
        </div>

        {/* Recommended Structure (Suitability) Card (Green border & highlight) */}
        <div className="flex-1 rounded-xl border-2 border-emerald-500 bg-emerald-50/20 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-700" />
              <h3 className="text-sm font-bold text-emerald-950">
                Recommended Structure (Suitability)
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {report.repaymentBurdenCategory && (
                <span
                  className={cn(
                    'text-[11px] font-bold px-2 py-0.5 rounded border',
                    report.repaymentBurdenCategory === 'Low' &&
                      'bg-emerald-100 text-emerald-800 border-emerald-200',
                    report.repaymentBurdenCategory === 'Moderate' &&
                      'bg-amber-100 text-amber-800 border-amber-200',
                    report.repaymentBurdenCategory === 'High' &&
                      'bg-rose-100 text-rose-800 border-rose-200',
                    report.repaymentBurdenCategory === 'Very High' &&
                      'bg-red-100 text-red-900 border-red-300'
                  )}
                >
                  Burden: {report.repaymentBurdenCategory}
                </span>
              )}
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Best Fit
              </span>
            </div>
          </div>

          <p className="text-xs text-emerald-900/80">
            Suggested for sustainable unit economics, lower debt pressure, and fast break-even.
          </p>

          <div className="grid grid-cols-4 gap-2 border-t border-emerald-200/60 pt-3 text-center">
            <div>
              <p className="text-[10px] text-slate-600">Suggested Size</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                ₹{suitability.suggestedProjectSize.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-600">Own Margin</p>
              <p className="mt-1 text-sm font-bold text-emerald-800">
                ₹{suitability.ownContribution.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-400">({suitability.ownContributionPercent}%)</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-600">Bank Loan</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                ₹{suitability.bankFinance.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-400">({suitability.bankFinancePercent}%)</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-600">Est. Repayment</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                ₹{suitability.estimatedMonthlyRepayment.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-400">/mo ({suitability.tenureYears} yrs)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Projected Financials Chart (Year 1) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Projected Financials (Year 1)</h3>
            <p className="text-xs text-slate-500">Monthly projected revenue vs. operational expenses</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-600" /> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Expenses
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex h-36 items-end gap-1.5 md:gap-3 overflow-x-auto pb-2">
            {monthlyProjections.map((m) => {
              const revHeight = (m.revenue / maxRevenue) * 100;
              const expHeight = (m.expenses / maxRevenue) * 100;

              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1 min-w-[28px]">
                  <div className="flex h-28 items-end gap-0.5 w-full justify-center">
                    <div
                      className="w-2.5 md:w-3.5 rounded-t bg-sky-600 transition-all duration-300"
                      style={{ height: `${revHeight}%` }}
                      title={`Month ${m.month} Revenue: ₹${m.revenue.toLocaleString('en-IN')}`}
                    />
                    <div
                      className="w-2.5 md:w-3.5 rounded-t bg-slate-300 transition-all duration-300"
                      style={{ height: `${expHeight}%` }}
                      title={`Month ${m.month} Expenses: ₹${m.expenses.toLocaleString('en-IN')}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">M{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Break-even Analysis */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Break-even Analysis</h3>
            <p className="text-xs text-slate-500">{breakEvenNote}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-emerald-700 md:text-xl">
            {breakEvenMonths} months
          </span>
          <p className="text-[10px] text-slate-400">Target payback</p>
        </div>
      </div>
    </div>
  );
}
