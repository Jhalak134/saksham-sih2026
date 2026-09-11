// components/settings/AboutCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Info, Layers, ExternalLink, ChevronRight } from 'lucide-react';

export function AboutCard(): React.JSX.Element {
  return (
    <section
      aria-labelledby="about-heading"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-800"
          aria-hidden="true"
        >
          <Info size={20} strokeWidth={2} />
        </div>
        <div>
          <h2
            id="about-heading"
            className="text-sm sm:text-base font-bold text-slate-900"
          >
            About
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            App information and resources.
          </p>
        </div>
      </div>

      {/* Rows Container */}
      <div className="flex flex-col gap-3">
        {/* Version Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 mt-0.5"
              aria-hidden="true"
            >
              <Layers size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                Version
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-medium">
                SAKSHAM v1.0.0
              </p>
            </div>
          </div>
          <span className="text-xs sm:text-sm italic text-slate-400 sm:text-right shrink-0">
            You&apos;re on the latest version.
          </span>
        </div>

        {/* How SAKSHAM Works Row */}
        <Link
          href="/how-it-works"
          className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 mt-0.5 group-hover:bg-white group-hover:border-slate-300 transition-colors"
              aria-hidden="true"
            >
              <ExternalLink size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug group-hover:text-amber-900 transition-colors">
                How SAKSHAM Works
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Learn more about the platform and how it helps rural entrepreneurs.
              </p>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="shrink-0 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
