// components/install/IosInstallCard.tsx
import React from 'react';
import { Share, PlusSquare, Info } from 'lucide-react';

interface IosInstallCardProps {
  showTip?: boolean;
}

export function IosInstallCard({
  showTip = false,
}: IosInstallCardProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="ios-install-heading"
      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs"
    >
      <div>
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900"
            aria-hidden="true"
          >
            {/* Apple Icon */}
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-1 .04-2.14.65-2.79 1.41-.58.66-1.08 1.77-.95 2.87 1.11.08 2.18-.54 2.75-1.24z" />
            </svg>
          </div>
          <div>
            <h2
              id="ios-install-heading"
              className="text-sm sm:text-base font-bold text-slate-900"
            >
              iOS (Safari)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Follow these steps to add SAKSHAM.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
              1
            </span>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Tap the Share icon
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mb-2">
                Tap <Share size={12} className="inline -mt-0.5" /> at the bottom of your screen.
              </p>

              {/* Safari bar mockup */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-400">
                <span className="text-xs">‹</span>
                <span className="text-xs">›</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200/80 text-blue-600 shadow-2xs ring-2 ring-amber-300">
                  <Share size={14} strokeWidth={2.5} />
                </div>
                <span className="text-xs">📖</span>
                <span className="text-xs">⧉</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
              2
            </span>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Select &quot;Add to Home Screen&quot;
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mb-2">
                Scroll down and tap Add to Home Screen.
              </p>

              {/* Menu row mockup */}
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-2xs">
                <PlusSquare size={16} className="text-slate-700" />
                <span className="text-xs font-semibold text-slate-800">
                  Add to Home Screen
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
              3
            </span>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Tap &quot;Add&quot;
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mb-2">
                Confirm by tapping Add in the top right.
              </p>

              {/* Confirm bar mockup */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs">
                <span className="text-slate-500">Cancel</span>
                <span className="font-semibold text-slate-800">Add to Home Screen</span>
                <span className="font-bold text-blue-600">Add</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safari Tip info */}
      {showTip && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-900">
          <Info size={16} className="shrink-0 text-sky-600" />
          <span>Safari is the best browser for installing SAKSHAM on iPhone or iPad.</span>
        </div>
      )}
    </section>
  );
}
