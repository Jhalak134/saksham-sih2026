// components/install/AlreadyInstalledBanner.tsx
import React from 'react';
import Link from 'next/link';
import { Info, ExternalLink } from 'lucide-react';

export function AlreadyInstalledBanner(): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 mt-0.5"
            aria-hidden="true"
          >
            <Info size={18} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Already installed?
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              If SAKSHAM is already on your home screen, you&apos;ll see it in your apps list and this browser may open it directly.
            </p>
          </div>
        </div>

        <Link
          href="/discover"
          className="self-end sm:self-center shrink-0 flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <span>Open SAKSHAM</span>
          <ExternalLink size={14} className="text-slate-500" />
        </Link>
      </div>
    </div>
  );
}
