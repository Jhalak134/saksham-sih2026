// components/profile/LogoutCard.tsx
'use client';

import React, { useContext } from 'react';
import { LogOut, ChevronRight } from 'lucide-react';
import { AuthContext } from '@/lib/auth-context';
import { removeStorageItem } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';

interface LogoutCardProps {
  onLogout?: () => void;
}

export function LogoutCard({ onLogout }: LogoutCardProps): React.JSX.Element {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const user = auth?.user ?? null;

  function handleLogout(): void {
    removeStorageItem(STORAGE_KEYS.authToken);
    if (onLogout) {
      onLogout();
    } else {
      auth?.logout();
      window.location.href = '/';
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Log out. Return to the landing page."
      className="group flex w-full items-center justify-between rounded-2xl border border-red-100/90 bg-[#FFF5F5] hover:bg-[#FEE2E2]/70 p-4 sm:p-5 text-left transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
    >
      <div className="flex items-center gap-3.5">
        <div className="text-slate-900">
          <LogOut size={20} strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm sm:text-base font-bold text-slate-900">
            Log out
          </p>
          <p className="text-xs sm:text-sm text-slate-500">
            {isAuthenticated && user
              ? `End session for ${user.phone_or_email}.`
              : 'End guest session and return to the landing page.'}
          </p>
        </div>
      </div>
      <ChevronRight
        size={18}
        strokeWidth={2}
        className="text-slate-700 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );
}
