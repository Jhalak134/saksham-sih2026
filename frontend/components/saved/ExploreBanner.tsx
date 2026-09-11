// components/saved/ExploreBanner.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight, ChevronRight } from 'lucide-react';

export function ExploreBanner(): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-[#FFFDF5] p-4 sm:p-5 shadow-2xs">
      {/* Left side */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-amber-500"
          aria-hidden="true"
        >
          <Lightbulb size={22} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
            Explore more opportunities
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Find more business ideas and save the ones that interest you.
          </p>
        </div>
      </div>

      {/* Desktop action button */}
      <Link
        href="/discover"
        className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#FACC15] px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 transition-colors hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shadow-2xs"
      >
        <span>Browse categories</span>
        <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
      </Link>

      {/* Mobile arrow */}
      <Link
        href="/discover"
        aria-label="Browse categories"
        className="flex sm:hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-amber-100/60 transition-colors"
      >
        <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
  );
}
