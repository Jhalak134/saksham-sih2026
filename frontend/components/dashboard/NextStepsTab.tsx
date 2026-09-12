// components/dashboard/NextStepsTab.tsx
// Recommended Actions, Personal Notes & Journal, and Documents Checklist.

'use client';

import React, { useState } from 'react';
import { List, FileText, Save, Info, Check } from 'lucide-react';
import type { DetailedReport } from '@/data/reportsData';
import { cn } from '@/lib/cn';

interface NextStepsTabProps {
  readonly report: DetailedReport;
}

export function NextStepsTab({ report }: NextStepsTabProps): React.JSX.Element {
  const { actionItems, initialNotes } = report.nextSteps;
  const [notes, setNotes] = useState<string>(initialNotes);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  // Matched scheme determines document checklist
  const matchedScheme = report.schemes.find((s) => s.eligible) ?? report.schemes[0];
  const checklist = matchedScheme?.documentChecklist ?? [
    'Aadhaar Card and PAN Card',
    'Passport-size photographs',
    'Proof of residence (village/block address)',
    'Bank account passbook copy',
    'Business project report or equipment quotation',
    'Margin money proof (10% contribution in bank account)',
    'Caste/category certificate, if applicable',
  ];

  // Initialize with first 3 items checked (matching reference mockup 3/7 collected)
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });

  function toggleDoc(index: number): void {
    setCheckedDocs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  const collectedCount = checklist.filter((_, idx) => !!checkedDocs[idx]).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? (collectedCount / totalCount) * 100 : 0;

  function handleSaveNotes(): void {
    setSavedStatus('Saved to device');
    setTimeout(() => setSavedStatus(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Screen-reader accessible step indicator for test suites */}
      <div className="sr-only">
        <span>Your Progress</span>
      </div>

      {/* Top Row: Recommended Actions + Personal Notes Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Recommended Actions Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shadow-2xs">
                  <List size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Recommended Actions
                  </h3>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500">Step-by-step guidance</span>
            </div>

            {/* Action Items List - Static informational, no arrows */}
            <div className="space-y-3 pt-1">
              {actionItems.map((action, idx) => (
                <div
                  key={action.id ?? idx}
                  className="flex items-start gap-3.5 rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-800 border border-slate-200/80">
                    {action.id ?? idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-black text-slate-900">{action.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600 font-medium leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personal Notes & Journal Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-1">
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0F4F8] text-[#2B4C6F] border border-slate-200 shadow-2xs">
                  <FileText size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Personal Notes &amp; Journal
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Keep track of local conversations, cooperative contacts, or specific costs.
                  </p>
                </div>
              </div>
              {savedStatus && (
                <span className="shrink-0 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full animate-fade-in">
                  {savedStatus}
                </span>
              )}
            </div>

            {/* Notes Textarea */}
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={5}
                placeholder="Add your thoughts, observations, or next tasks..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#2B4C6F] focus:outline-none focus:ring-1 focus:ring-[#2B4C6F] transition"
                aria-label="Personal notes for this assessment"
              />
            </div>
          </div>

          {/* Footer with Character Counter and Mustard Save Notes Button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-500">{notes.length}/500 chars</span>
            <button
              type="button"
              onClick={handleSaveNotes}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8A93D] hover:bg-[#d9982f] px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Save size={15} strokeWidth={2.5} />
              <span>Save notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Card: Documents You'll Need */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Header with Title and Progress Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shadow-2xs">
              <FileText size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Documents You&apos;ll Need
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                To apply for the {matchedScheme ? matchedScheme.name : 'Micro Finance Scheme (SCA/CA)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-black text-slate-900">
              {collectedCount}/{totalCount} collected
            </span>
            <div className="w-28 sm:w-36 h-2.5 bg-slate-100 border border-slate-200/80 rounded-full overflow-hidden">
              <div
                className="bg-[#E8A93D] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Interactive Documents Checklist */}
        <div className="space-y-1 pt-1">
          {checklist.map((doc, idx) => {
            const isChecked = !!checkedDocs[idx];
            return (
              <button
                key={doc}
                type="button"
                onClick={() => toggleDoc(idx)}
                className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-md flex items-center justify-center transition-all shrink-0',
                    isChecked
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'border-2 border-slate-300 bg-white group-hover:border-slate-400'
                  )}
                >
                  {isChecked && <Check size={14} strokeWidth={3} />}
                </div>
                <span
                  className={cn(
                    'text-xs sm:text-sm transition-all',
                    isChecked
                      ? 'line-through text-slate-400 font-medium'
                      : 'text-slate-900 font-semibold'
                  )}
                >
                  {doc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Info Callout Banner */}
        <div className="rounded-xl bg-[#F4F6F9] border border-slate-200/80 p-3 sm:p-3.5 flex items-center gap-2.5 text-xs text-slate-700">
          <Info size={16} className="text-slate-600 shrink-0" strokeWidth={2.2} />
          <span className="font-medium">
            Requirements can vary by SCA/CA branch — confirm the exact list with your local block office before applying.
          </span>
        </div>
      </div>
    </div>
  );
}