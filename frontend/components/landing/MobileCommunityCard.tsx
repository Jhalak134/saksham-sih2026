// components/landing/MobileCommunityCard.tsx
'use client';

import React from 'react';
import { Sprout } from 'lucide-react';

export function MobileCommunityCard(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-8 md:hidden">
      <div className="flex items-center gap-3.5 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 shadow-2xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Sprout size={20} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">
            Stronger businesses. Stronger communities.
          </p>
          <p className="text-[11px] font-medium text-slate-500">
            SAKSHAM — Empowering Grassroots Enterprise
          </p>
        </div>
      </div>
    </div>
  );
}
