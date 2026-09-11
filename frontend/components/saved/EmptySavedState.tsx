// components/saved/EmptySavedState.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Bookmark } from 'lucide-react';

export function EmptySavedState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center">
      {/* Illustration Circle */}
      <div className="relative mb-6 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-[#FEF3C7]">
        {/* Sparkle rays */}
        <div className="absolute right-3 top-3 flex gap-0.5 text-amber-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="18" y1="6" x2="15" y2="9" />
            <line x1="22" y1="12" x2="18" y2="12" />
          </svg>
        </div>

        <Bookmark
          size={40}
          strokeWidth={2.5}
          className="text-amber-500"
          aria-hidden="true"
        />
      </div>

      {/* Heading & Subtitle */}
      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
        You haven’t saved any categories yet.
      </h2>
      <p className="mt-2 max-w-sm text-xs sm:text-sm text-slate-500 leading-relaxed">
        Browse through opportunities and bookmark the ones you want to revisit later.
      </p>

      {/* Action button */}
      <Link
        href="/discover"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3 text-xs sm:text-sm font-bold text-slate-900 transition-colors hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shadow-2xs"
      >
        <span>Browse categories</span>
        <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
      </Link>
    </div>
  );
}
