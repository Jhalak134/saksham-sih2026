// components/assessment/AssessmentCompleted.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Check, CheckCircle2, Circle, ArrowRight, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

// ─── Checklist config ─────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  subtext: string;
}

const CHECKLIST: readonly ChecklistItem[] = [
  { id: 'idea',     label: 'Analyzing your idea',               subtext: 'Understanding your business concept' },
  { id: 'market',   label: 'Checking local market data',        subtext: 'Looking at demand and competition' },
  { id: 'finance',  label: 'Evaluating financials',             subtext: 'Estimating costs, profits and break-even' },
  { id: 'schemes',  label: 'Finding relevant government schemes',subtext: 'Matching with your eligibility' },
  { id: 'report',   label: 'Preparing your report',             subtext: 'Almost there...' },
] as const;

const STEP_DELAY_MS = 500;

// ─── Checklist row ────────────────────────────────────────────────────────────

interface ChecklistRowProps {
  item: ChecklistItem;
  done: boolean;
  active: boolean;
}

function ChecklistRow({ item, done, active }: ChecklistRowProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-start gap-3 py-1.5 transition-opacity',
        !done && !active ? 'opacity-40' : 'opacity-100'
      )}
    >
      {done ? (
        <CheckCircle2
          size={18}
          strokeWidth={2.25}
          className="mt-0.5 shrink-0 text-amber-500 fill-amber-50"
          aria-hidden="true"
        />
      ) : (
        <Circle
          size={18}
          strokeWidth={2}
          className={cn(
            'mt-0.5 shrink-0',
            active ? 'animate-pulse text-amber-400' : 'text-slate-300'
          )}
          aria-hidden="true"
        />
      )}
      <div>
        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
        <p className="text-xs text-slate-500">{item.subtext}</p>
      </div>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard(): React.JSX.Element {
  return (
    <div className="flex w-full items-center gap-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5">
      {/* Thumbnail placeholder */}
      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-lg border border-amber-200/50 bg-amber-100/60 shadow-2xs">
        <span className="text-2xl" aria-hidden="true">🐄</span>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-bold text-slate-900">Dairy Processing Unit</p>
        <p className="text-xs text-slate-500">📍 Kheragarh, Agra</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            Completed
          </span>
          <span className="rounded-md bg-[#F2B705] px-2 py-0.5 text-[11px] font-bold text-slate-950">
            Fit 78
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── AssessmentCompleted ──────────────────────────────────────────────────────

/** The fake report ID used for the "View your report" CTA until real IDs exist. */
const FAKE_REPORT_ID = 'assess_001';

export function AssessmentCompleted(): React.JSX.Element {
  const [completedCount, setCompletedCount] = useState(0);
  const allDone = completedCount >= CHECKLIST.length;

  useEffect(() => {
    if (completedCount >= CHECKLIST.length) return;
    const timer = setTimeout(() => {
      setCompletedCount((c) => c + 1);
    }, STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [completedCount]);

  return (
    <div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8 lg:p-9">
      {/* Success icon */}
      <div className="flex flex-col items-center gap-2.5">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            'border-4 border-amber-100 bg-amber-50 shadow-2xs',
            'transition-all duration-500',
            allDone ? 'scale-100 opacity-100' : 'scale-90 opacity-90'
          )}
          aria-hidden={!allDone}
        >
          <Check
            size={28}
            strokeWidth={3}
            className="text-amber-500"
            aria-hidden="true"
          />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Assessment created!
          </p>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            We&apos;ve analyzed your information and prepared your detailed report.
          </p>
        </div>
      </div>

      {/* View report CTA */}
      <Link
        href={`/reports/${FAKE_REPORT_ID}`}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl',
          'bg-[#F2B705] px-6 py-3.5 text-sm font-bold text-slate-950 shadow-2xs',
          'hover:bg-[#D99A00] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
          !allDone && 'pointer-events-none opacity-50'
        )}
      >
        View your report
        <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
      </Link>

      {/* Summary card */}
      <SummaryCard />

      {/* Animated checklist */}
      <div
        className="flex w-full flex-col gap-0.5"
        role="status"
        aria-live="polite"
        aria-label="Assessment progress"
      >
        {CHECKLIST.map((item, idx) => (
          <ChecklistRow
            key={item.id}
            item={item}
            done={idx < completedCount}
            active={idx === completedCount}
          />
        ))}
      </div>

      {/* Confidence note */}
      <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5">
        <BarChart2
          size={15}
          strokeWidth={2}
          className="shrink-0 text-slate-500"
          aria-hidden="true"
        />
        <p className="text-xs text-slate-600">
          Based on available local data · <strong>Confidence: Medium</strong>
        </p>
      </div>

      {/* Take the next step */}
      <div className="flex w-full items-start gap-3 rounded-xl border border-amber-200/50 bg-amber-50/40 p-4">
        <BarChart2
          size={18}
          strokeWidth={2}
          className="mt-0.5 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-bold text-slate-900">
            Take the next step
          </p>
          <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
            Explore your full report with insights, market analysis, financials and more.
          </p>
        </div>
      </div>
    </div>
  );
}
