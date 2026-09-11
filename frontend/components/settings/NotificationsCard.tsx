// components/settings/NotificationsCard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/constants';
import { getStorageItem, setStorageItem } from '@/lib/storage';

export function NotificationsCard(): React.JSX.Element {
  const [emailUpdates, setEmailUpdates] = useState(false);

  useEffect(() => {
    const stored = getStorageItem(STORAGE_KEYS.emailNotifications);
    if (stored !== null) {
      setEmailUpdates(stored === 'true');
    }
  }, []);

  function handleToggle(): void {
    const next = !emailUpdates;
    setEmailUpdates(next);
    setStorageItem(STORAGE_KEYS.emailNotifications, String(next));
  }

  return (
    <section
      aria-labelledby="notifications-heading"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-amber-800"
          aria-hidden="true"
        >
          <Bell size={20} strokeWidth={2} />
        </div>
        <div>
          <h2
            id="notifications-heading"
            className="text-sm sm:text-base font-bold text-slate-900"
          >
            Notifications
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Choose what updates you'd like to receive.
          </p>
        </div>
      </div>

      {/* Notification Toggle Row */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 mt-0.5"
            aria-hidden="true"
          >
            <Mail size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <label
              htmlFor="email-notifications-switch"
              className="block text-sm sm:text-base font-semibold text-slate-900 leading-snug cursor-pointer"
            >
              Email me when a saved category's data updates
            </label>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Get notified when there are new insights, schemes or data for categories you've bookmarked. (Local preference only)
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          id="email-notifications-switch"
          type="button"
          role="switch"
          aria-checked={emailUpdates}
          aria-label="Email me when a saved category's data updates"
          onClick={handleToggle}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            emailUpdates ? 'bg-[#FACC15]' : 'bg-slate-200'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              emailUpdates ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </section>
  );
}
