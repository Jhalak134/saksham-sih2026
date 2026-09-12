// components/dashboard/FinancialsTab.tsx
// High-fidelity Financial analysis tab matching SAKSHAM design specifications and reference media_1789217626216.png.
// Layout:
// 1. Top Row: Financial Structure (Max Eligibility) on the left, Recommended Structure (Suitability) on the right.
// 2. Middle Row: Projected Financials (Year 1) grouped bar chart with interactive M6 tooltip.
// 3. Bottom Row: Break-even Analysis with clock badge and bold mustard-yellow target payback.

'use client';

import React, { useState } from 'react';
import { Landmark, BarChart2, Clock } from 'lucide-react';
import type { DetailedReport, MonthFinancial } from '@/data/reportsData';
import { cn } from '@/lib/cn';

interface FinancialsTabProps {
  readonly report: DetailedReport;
}

export function FinancialsTab({ report }: FinancialsTabProps): React.JSX.Element {
  const { maxEligibility, suitability, breakEvenMonths, breakEvenNote, monthlyProjections } =
    report.financials;

  const defaultProjections: MonthFinancial[] = [
    { month: 1, revenue: 24000, expenses: 30000 },
    { month: 2, revenue: 32000, expenses: 32000 },
    { month: 3, revenue: 36000, expenses: 36000 },
    { month: 4, revenue: 42000, expenses: 40000 },
    { month: 5, revenue: 48000, expenses: 45000 },
    { month: 6, revenue: 55000, expenses: 47000 },
    { month: 7, revenue: 60000, expenses: 50000 },
    { month: 8, revenue: 67000, expenses: 52000 },
    { month: 9, revenue: 73000, expenses: 56000 },
    { month: 10, revenue: 80000, expenses: 60000 },
    { month: 11, revenue: 86000, expenses: 62000 },
    { month: 12, revenue: 94000, expenses: 68000 },
  ];

  const projections =
    monthlyProjections && monthlyProjections.length === 12
      ? monthlyProjections
      : defaultProjections;

  // Track active month for tooltip (defaults to M6 matching mockup)
  const [activeMonth, setActiveMonth] = useState<number>(6);

  const activeData = projections.find((m) => m.month === activeMonth) || projections[5];

  // Max value for chart scaling (defaults to 1,00,000 matching Y-axis in mockup)
  const yMax = 100000;
  const yTicks = [100000, 80000, 60000, 40000, 20000, 0];

  return (
    <div className="space-y-5 md:space-y-6">
      {/* ── 1. Top Row: Max Eligibility & Suitability Cards (2-column on desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Card 1: Financial Structure (Max Eligibility) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-[#2B4C6F]" />
                <h3 className="text-base font-bold text-slate-900">
                  Financial Structure (Max Eligibility)
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                Borrowing Ceiling
              </span>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              Based on maximum statutory leverage allowable for your profile.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
            <div>
              <p className="text-xs font-semibold text-slate-800">Project Cost</p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                ₹{maxEligibility.projectCost.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Scheme</p>
              <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                {maxEligibility.schemeName}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Max Loan Amount</p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                ₹{maxEligibility.maxLoanAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                ({maxEligibility.loanSharePercent}% share)
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Recommended Structure (Suitability) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-[#2B4C6F]" />
                <h3 className="text-base font-bold text-slate-900">
                  Recommended Structure (Suitability)
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                Recommended
              </span>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              Suggested for sustainable unit economics, lower debt pressure, and fast break-even.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-4 text-center">
            <div>
              <p className="text-xs font-semibold text-slate-800">Suggested Size</p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                ₹{suitability.suggestedProjectSize.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Own Margin</p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                ₹{suitability.ownContribution.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                ({suitability.ownContributionPercent}%)
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Bank Loan</p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                ₹{suitability.bankFinance.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                ({suitability.bankFinancePercent}%)
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Est. Repayment</p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                ₹{suitability.estimatedMonthlyRepayment.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                /mo ({suitability.tenureYears} yrs)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Middle Row: Projected Financials (Year 1) Grouped Bar Chart ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-[#2B4C6F]" />
              <h3 className="text-base font-bold text-slate-900">Projected Financials (Year 1)</h3>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-700 font-medium">
              Monthly projected revenue vs. operational expenses.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs sm:text-sm font-semibold text-slate-900">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#2B4C6F]" />
              <span>Revenue</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#E8A93D]" />
              <span>Expenses</span>
            </span>
          </div>
        </div>

        {/* Chart Area with Y-axis and Interactive Tooltip */}
        <div className="relative border-t border-slate-100 pt-6">
          <div className="flex">
            {/* Y-axis Labels */}
            <div className="flex flex-col justify-between text-right pr-3 sm:pr-4 h-56 text-[11px] font-semibold text-slate-500 shrink-0 select-none pb-7">
              {yTicks.map((tick) => (
                <span key={tick}>₹{tick.toLocaleString('en-IN')}</span>
              ))}
            </div>

            {/* Chart Bars Grid */}
            <div className="relative flex-1 h-56">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                {yTicks.map((tick) => (
                  <div key={tick} className="w-full border-b border-dashed border-slate-200/80 h-0" />
                ))}
              </div>

              {/* 12 Months Columns */}
              <div className="relative h-full flex items-end justify-between gap-1 sm:gap-2 z-10 pb-7">
                {projections.map((m) => {
                  const revHeight = Math.min(100, Math.max(8, (m.revenue / yMax) * 100));
                  const expHeight = Math.min(100, Math.max(8, (m.expenses / yMax) * 100));
                  const isSelected = activeMonth === m.month;

                  return (
                    <div
                      key={m.month}
                      onClick={() => setActiveMonth(m.month)}
                      onMouseEnter={() => setActiveMonth(m.month)}
                      className="group flex-1 flex flex-col items-center h-full justify-end cursor-pointer relative"
                    >
                      {/* Interactive Tooltip Positioned above Active Month */}
                      {isSelected && (
                        <div className="absolute -top-16 sm:-top-20 z-30 left-1/2 -translate-x-1/2 bg-[#1E293B] text-white p-2.5 sm:p-3 rounded-xl shadow-xl border border-slate-700/80 whitespace-nowrap pointer-events-none min-w-[155px]">
                          <div className="text-[11px] font-bold text-slate-300 pb-1 border-b border-slate-700">
                            M{m.month}
                          </div>
                          <div className="mt-1.5 space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2 h-2 rounded-full bg-[#2B4C6F]" />
                                Revenue
                              </span>
                              <span className="font-bold text-white">
                                ₹{m.revenue.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2 h-2 rounded-full bg-[#E8A93D]" />
                                Expenses
                              </span>
                              <span className="font-bold text-white">
                                ₹{m.expenses.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          {m.revenue >= m.expenses && (
                            <div className="mt-2 text-[10px] font-semibold text-amber-300 bg-white/10 px-2 py-0.5 rounded text-center">
                              Revenue exceeds expenses
                            </div>
                          )}
                          {/* Tooltip Down Arrow */}
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1E293B] border-r border-b border-slate-700/80 rotate-45" />
                        </div>
                      )}

                      {/* Dotted indicator line when selected */}
                      {isSelected && (
                        <div className="absolute inset-y-0 w-px border-l border-dashed border-slate-400/80 pointer-events-none -z-10" />
                      )}

                      {/* Grouped Bars */}
                      <div className="flex items-end gap-1 w-full justify-center max-w-[32px]">
                        {/* Revenue Bar (Deep Dull Blue #2B4C6F) */}
                        <div
                          className={cn(
                            'w-3 sm:w-3.5 rounded-t transition-all duration-300 bg-[#2B4C6F]',
                            isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : 'opacity-95 group-hover:opacity-100'
                          )}
                          style={{ height: `${revHeight}%` }}
                        />
                        {/* Expenses Bar (Mustard Yellow #E8A93D) */}
                        <div
                          className={cn(
                            'w-3 sm:w-3.5 rounded-t transition-all duration-300 bg-[#E8A93D]',
                            isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : 'opacity-95 group-hover:opacity-100'
                          )}
                          style={{ height: `${expHeight}%` }}
                        />
                      </div>

                      {/* X-axis Label */}
                      <span
                        className={cn(
                          'absolute -bottom-6 text-xs font-bold transition-colors select-none',
                          isSelected ? 'text-slate-950 underline decoration-[#E8A93D] decoration-2' : 'text-slate-700'
                        )}
                      >
                        M{m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Row: Break-even Analysis Card ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#D97706] shadow-2xs border border-[#FDE68A]">
            <Clock size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Break-even Analysis</h3>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-700 font-medium">
              {breakEvenNote || "How long until this business pays for itself? Here's our estimate."}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <span className="text-2xl sm:text-3xl font-black text-[#D97706] tracking-tight">
            {breakEvenMonths || 14} months
          </span>
          <p className="text-xs font-bold text-slate-700 mt-0.5">Target payback</p>
        </div>
      </div>
    </div>
  );
}
