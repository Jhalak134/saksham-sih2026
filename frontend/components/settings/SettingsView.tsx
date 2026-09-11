// components/settings/SettingsView.tsx
'use client';

import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { NotificationsCard } from './NotificationsCard';
import { DataPrivacyCard } from './DataPrivacyCard';
import { AboutCard } from './AboutCard';

export function SettingsView(): React.JSX.Element {
  const { clearAllData } = useShell();
  const [clearedNotice, setClearedNotice] = useState(false);

  function handleClearData(): void {
    clearAllData();
    setClearedNotice(true);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Manage how SAKSHAM works for you.
        </p>
      </div>

      {/* Success Notification Banner */}
      {clearedNotice && (
        <div
          role="status"
          aria-live="polite"
          className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-2xs animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span>Local data, preferences and saved items have been cleared.</span>
          </div>
          <button
            type="button"
            onClick={() => setClearedNotice(false)}
            aria-label="Dismiss message"
            className="text-emerald-700 hover:text-emerald-900 rounded p-1 transition-colors focus:outline-none"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Settings Sections Stack */}
      <div className="flex flex-col gap-4 sm:gap-5">
        <NotificationsCard />
        <DataPrivacyCard onClearData={handleClearData} />
        <AboutCard />
      </div>
    </div>
  );
}
