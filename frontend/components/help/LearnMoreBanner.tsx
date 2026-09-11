// components/help/LearnMoreBanner.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight, ChevronRight } from 'lucide-react';

export function LearnMoreBanner(): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side: Icon + Content */}
        <Link
          href="/how-it-works"
          className="flex items-center sm:items-start gap-3.5 group flex-1"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/70 text-amber-900 group-hover:scale-105 transition-transform"
            aria-hidden="true"
          >
            <Lightbulb size={20} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
              Want to learn more?
            </h3>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
              Check out our detailed guide on how SAKSHAM works.
            </p>
          </div>
          <ChevronRight
            size={18}
            className="sm:hidden shrink-0 text-slate-400 group-hover:text-slate-700"
            aria-hidden="true"
          />
        </Link>

        {/* Desktop CTA Button */}
        <div className="hidden sm:flex shrink-0">
          <Link
            href="/how-it-works"
            className="flex items-center gap-1.5 rounded-xl bg-[#FACC15] px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition-all hover:bg-[#EAB308] hover:gap-2 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span>Go to How It Works</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
