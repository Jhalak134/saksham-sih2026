// components/install/InstallView.tsx
'use client';

import React from 'react';
import { Smartphone, CheckCircle2 } from 'lucide-react';
import { AndroidInstallCard } from './AndroidInstallCard';
import { IosInstallCard } from './IosInstallCard';
import { OtherBrowsersCard } from './OtherBrowsersCard';
import { MobileInstallView } from './MobileInstallView';
import { AlreadyInstalledBanner } from './AlreadyInstalledBanner';
import { usePwaInstall } from './usePwaInstall';

export function InstallView(): React.JSX.Element {
  const { isInstallable, installStatus, triggerInstall } = usePwaInstall();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Page Header + Desktop Right Banner */}
      <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Install SAKSHAM
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Add SAKSHAM to your home screen for one-tap access.
          </p>
        </div>

        {/* Top Right Desktop Info Banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-2xs flex items-center gap-3.5 max-w-md">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-slate-900"
            aria-hidden="true"
          >
            <Smartphone size={18} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900">
              A faster, app-like experience
            </h2>
            <p className="text-[11px] text-slate-600 leading-tight">
              Keep SAKSHAM on your home screen for quick access, just like a native app.
            </p>
          </div>
        </div>
      </div>

      {/* Installed Success notification if triggered */}
      {installStatus === 'installed' && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm text-emerald-900 shadow-2xs animate-in fade-in"
        >
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>SAKSHAM has been successfully added to your home screen!</span>
        </div>
      )}

      {/* Desktop 3-column Grid View */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-6">
        <AndroidInstallCard
          onInstall={triggerInstall}
          isInstallable={isInstallable}
        />
        <IosInstallCard />
        <OtherBrowsersCard />
      </div>

      {/* Mobile Interactive View */}
      <div className="mb-6 lg:hidden">
        <MobileInstallView
          onInstall={triggerInstall}
          isInstallable={isInstallable}
        />
      </div>

      {/* Bottom Already Installed Banner */}
      <AlreadyInstalledBanner />
    </div>
  );
}
