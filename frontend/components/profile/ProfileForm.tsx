// components/profile/ProfileForm.tsx
'use client';

import React from 'react';
import { useShell } from '@/lib/shell-context';
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
