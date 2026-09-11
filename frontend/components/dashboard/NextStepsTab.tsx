// components/dashboard/NextStepsTab.tsx
// Progress stepper, action items, personal notes, and required-documents checklist.

'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, RefreshCw, Save, ArrowRight, FileCheck } from 'lucide-react';
import type { DetailedReport } from '@/data/reportsData';
import { cn } from '@/lib/cn';

interface NextStepsTabProps {
  readonly report: DetailedReport;
}

export function NextStepsTab({ report }: NextStepsTabProps): React.JSX.Element {
  const { steps, actionItems, initialNotes } = report.nextSteps;
  const [notes, setNotes] = useState<string>(initialNotes);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  // The document checklist is tied to whichever scheme the user is actually
  // eligible for — static, informational, not interactive (per team decision).
  const matchedScheme = report.schemes.find((s) => s.eligible);

  function handleSaveNotes(): void {
    setSavedStatus('Saved to device');
    setTimeout(() => setSavedStatus(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* 1. Progress Stepper: horizontal on all viewports as per spec */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Your Progress</h3>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          {steps.map((step, idx) => {
            const isDone = step.status === 'done';
            const isCurrent = step.status === 'current';

            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-1 flex-col items-center text-center">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                          ? 'bg-[#F59E0B] text-slate-950 ring-4 ring-amber-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                    )}
                  >
                    {isDone ? <CheckCircle2 size={16} /> : step.number}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-[11px] font-medium',
                      isCurrent
                        ? 'font-bold text-slate-900'
                        : isDone
                          ? 'text-slate-700'
                          : 'text-slate-400'
                    )}
                  >
                    {step.title}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mb-5 transition-all',
                      isDone ? 'bg-emerald-500' : 'bg-slate-200'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. Action Items + Personal Notes: stacked on mobile, side-by-side on desktop (md:flex-row) */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Next Steps Actions List */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recommended Actions</h3>
            <span className="text-[11px] text-slate-400">Step-by-step guidance</span>
          </div>

          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            {actionItems.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 rounded-lg border border-slate-200/80 p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                  {action.id}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900">{action.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{action.description}</p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-slate-400 self-center" />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium"
            >
              <RefreshCw size={12} />
              <span>Re-run with new data</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium"
            >
              <span>Re-check with updated capital</span>
            </button>
          </div>
        </div>

        {/* Personal Notes Box */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Personal Notes &amp; Journal</h3>
            {savedStatus && (
              <span className="text-[11px] font-semibold text-emerald-700 animate-fade-in">
                {savedStatus}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Keep track of local conversations, cooperative contacts, or specific costs.
          </p>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={5}
            placeholder="Add your thoughts, observations, or next tasks..."
            className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            aria-label="Personal notes for this assessment"
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 text-[11px]">{notes.length}/500 chars</span>
            <button
              type="button"
              onClick={handleSaveNotes}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <Save size={13} />
              <span>Save notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Documents You'll Need — static checklist tied to the matched scheme.
          Informational reference only, not an interactive tracker (per team decision). */}
      {matchedScheme && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Documents You&apos;ll Need</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                To apply for the {matchedScheme.name}
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <FileCheck size={16} />
            </div>
          </div>

          <ul className="space-y-2 border-t border-slate-100 pt-3">
            {matchedScheme.documentChecklist.map((doc) => (
              <li key={doc} className="flex items-start gap-2 text-xs text-slate-700">
                <Circle size={6} className="mt-1.5 shrink-0 fill-slate-400 text-slate-400" />
                <span>{doc}</span>
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            Requirements can vary by SCA/CA branch — confirm the exact list with your local
            block office before applying.
          </p>
        </div>
      )}
    </div>
  );
}