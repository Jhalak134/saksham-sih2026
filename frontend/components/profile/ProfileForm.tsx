// components/profile/ProfileForm.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { User, ShieldCheck } from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';
import { HomeLocationCard } from './HomeLocationCard';
import { AvailableCapitalCard } from './AvailableCapitalCard';
import { LanguageCard } from './LanguageCard';
import { ActivitySummaryCard } from './ActivitySummaryCard';
import { LogoutCard } from './LogoutCard';

export function ProfileForm(): React.JSX.Element {
  const {
    homeLocation,
    setHomeLocation,
    capital,
    setCapital,
    language,
    setLanguage,
    savedCategories,
  } = useShell();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Profile
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Manage your business preferences.
        </p>
      </div>

      {/* Cards Stack */}
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* Account Status Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  isAuthenticated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                )}
              >
                {isAuthenticated ? <ShieldCheck size={20} /> : <User size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    {isAuthenticated && user ? user.phone_or_email : 'Guest Session'}
                  </h2>
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                      isAuthenticated
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {isAuthenticated ? 'Active Account' : 'Guest Mode'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isAuthenticated
                    ? 'Your preferences and assessments are synced with your backend account.'
                    : 'Browsing anonymously. Create an account to persist assessments across sessions.'}
                </p>
              </div>
            </div>
            {!isAuthenticated && (
              <Link
                href="/login"
                className="self-start sm:self-center shrink-0 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>

        <HomeLocationCard
          initialLocation={homeLocation}
          onSave={setHomeLocation}
        />

        <AvailableCapitalCard
          initialCapital={capital}
          onSave={setCapital}
        />

        <LanguageCard
          language={language}
          onLanguageChange={setLanguage}
        />

        <ActivitySummaryCard
          totalAssessments={4}
          completedAssessments={1}
          savedAssessments={savedCategories.length}
        />

        <LogoutCard />
      </div>
    </div>
  );
}
