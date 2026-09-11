// components/install/AndroidInstallCard.tsx
'use client';

import React from 'react';
import { Download, Sparkles, Smartphone } from 'lucide-react';
import { InstallAppIcon } from './InstallAppIcon';

interface AndroidInstallCardProps {
  onInstall: () => void;
  isInstallable?: boolean;
}

export function AndroidInstallCard({
  onInstall,
  isInstallable,
}: AndroidInstallCardProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="android-install-heading"
      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs"
    >
      <div>
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700"
            aria-hidden="true"
          >
            {/* Android Icon */}
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993 0 .5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.0833 12 8.0833s-3.5902.3283-5.1368.8664L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.75h24c-.3432-4.0911-2.6889-7.5633-6.1185-9.4286" />
            </svg>
          </div>
          <div>
            <h2
              id="android-install-heading"
              className="text-sm sm:text-base font-bold text-slate-900"
            >
              Android (Chrome)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Install SAKSHAM with a single tap.
            </p>
          </div>
        </div>

        {/* Illustrated Phone Mockup */}
        <div className="relative my-4 flex justify-center items-center py-2">
          {/* Sparkles on sides */}
          <Sparkles
            size={18}
            className="absolute right-4 top-2 text-amber-400 animate-pulse"
            aria-hidden="true"
          />

          <div className="w-56 rounded-t-2xl border-4 border-b-0 border-slate-700 bg-slate-100 p-2 shadow-sm">
            {/* Phone URL bar */}
            <div className="mb-2 flex items-center justify-between rounded-full bg-white px-3 py-1 border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400">🔒</span>
              <span className="text-[11px] font-medium text-slate-700 truncate">
                saksham.app
              </span>
              <span className="text-[10px] text-slate-400 font-bold">⋮</span>
            </div>

            {/* Install Prompt Mockup Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs text-center">
              <div className="flex justify-center mb-1.5">
                <InstallAppIcon size="sm" />
              </div>
              <p className="text-xs font-bold text-slate-900">Install app</p>
              <p className="text-[10px] text-slate-500 mb-2">SAKSHAM</p>
              <div className="flex justify-center gap-4 text-[11px] font-semibold">
                <span className="text-slate-500">Cancel</span>
                <span className="text-blue-600 font-bold">Install</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onInstall}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-5 py-3 text-xs sm:text-sm font-bold text-slate-900 transition-all hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shadow-2xs cursor-pointer"
          >
            <Download size={16} strokeWidth={2.5} />
            <span>Install App</span>
          </button>
          <p className="mt-2 text-center text-[11px] sm:text-xs text-slate-500 leading-tight">
            You&apos;ll see your browser&apos;s install prompt. Tap &quot;Install&quot; to add SAKSHAM to your home screen.
          </p>
        </div>
      </div>

      {/* Footer troubleshooting */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
          Don&apos;t see the install prompt?
        </h3>
        <p className="mt-1 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
          Look for &quot;Add to Home Screen&quot; or &quot;Install App&quot; in your browser&apos;s menu (usually the three dots in the top right).
        </p>
      </div>
    </section>
  );
}
