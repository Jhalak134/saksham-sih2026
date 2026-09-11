// components/install/OtherBrowsersCard.tsx
import React from 'react';
import { Laptop } from 'lucide-react';
import { InstallAppIcon } from './InstallAppIcon';

export function OtherBrowsersCard(): React.JSX.Element {
  return (
    <section
      aria-labelledby="other-browsers-heading"
      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs"
    >
      <div>
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900"
            aria-hidden="true"
          >
            <Laptop size={20} strokeWidth={2} />
          </div>
          <div>
            <h2
              id="other-browsers-heading"
              className="text-sm sm:text-base font-bold text-slate-900"
            >
              Other browsers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              This works best on a phone.
            </p>
          </div>
        </div>

        {/* Laptop Mockup */}
        <div className="my-6 flex flex-col items-center justify-center">
          {/* Screen */}
          <div className="w-56 h-32 rounded-t-xl border-4 border-slate-700 bg-slate-50 p-3 flex flex-col items-center justify-center shadow-inner">
            <InstallAppIcon size="md" />
            <span className="mt-1 text-xs font-bold text-slate-900">SAKSHAM</span>
          </div>
          {/* Keyboard base */}
          <div className="w-68 h-3 rounded-b-xl bg-slate-300 shadow-xs flex justify-center items-center">
            <div className="w-12 h-1 bg-slate-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Guidance */}
      <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
        <p className="text-xs text-slate-600 leading-relaxed">
          Adding SAKSHAM to your home screen is currently supported on Android (Chrome) and iOS (Safari).
        </p>
        <p className="text-xs font-semibold text-slate-800">
          Please open this page on your phone browser to install the app.
        </p>
      </div>
    </section>
  );
}
