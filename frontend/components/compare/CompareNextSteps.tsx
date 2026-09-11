// components/compare/CompareNextSteps.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { getCategoryIcon } from '@/components/discover/CategoryIcons';

interface CompareNextStepsProps {
  readonly category1: string;
  readonly category2: string;
}

export function CompareNextSteps({
  category1,
  category2,
}: CompareNextStepsProps): React.JSX.Element {
  return (
    <aside
      className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 rounded-2xl border border-[#FDE68A] bg-[#FEFCE8] p-5 sm:p-6 shadow-xs"
      aria-label="Next steps call to action"
    >
      {/* Left side: Lightbulb + Text */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FEF08A] text-[#CA8A04] shadow-2xs"
          aria-hidden="true"
        >
          <Lightbulb size={24} strokeWidth={2.25} />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Ready to take the next step?
          </h3>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-700">
            Start a detailed assessment for one of these opportunities.
          </p>
        </div>
      </div>

      {/* Right side: Action Buttons (Stacked full-width on mobile, flex row on desktop) */}
      <div className="flex w-full lg:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Category 1 Button (Primary solid gold) */}
        <Link
          href={`/new-assessment?category=${encodeURIComponent(category1)}`}
          className="flex flex-1 sm:flex-initial items-center justify-center gap-2.5 rounded-xl bg-[#F59E0B] px-5 py-3 text-sm font-bold text-slate-950 shadow-2xs transition hover:bg-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.99]"
          aria-label={`Start assessment for ${category1}`}
        >
          <span className="flex items-center justify-center text-slate-950">
            {getCategoryIcon(category1, 18, 'text-slate-950')}
          </span>
          <span>Start {category1} Assessment</span>
          <ArrowRight size={16} strokeWidth={2.25} />
        </Link>

        {/* Category 2 Button (Subtle border/light gold) */}
        <Link
          href={`/new-assessment?category=${encodeURIComponent(category2)}`}
          className="flex flex-1 sm:flex-initial items-center justify-center gap-2.5 rounded-xl border border-[#F59E0B]/70 bg-[#FFFBEB] px-5 py-3 text-sm font-bold text-slate-900 shadow-2xs transition hover:bg-[#FEF3C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.99]"
          aria-label={`Start assessment for ${category2}`}
        >
          <span className="flex items-center justify-center text-slate-900">
            {getCategoryIcon(category2, 18, 'text-slate-900')}
          </span>
          <span>Start {category2} Assessment</span>
          <ArrowRight size={16} strokeWidth={2.25} />
        </Link>
      </div>
    </aside>
  );
}
