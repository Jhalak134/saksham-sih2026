// components/help/HelpView.tsx
'use client';

import React from 'react';
import { FaqAccordion } from './FaqAccordion';
import { ContactCard } from './ContactCard';
import { LearnMoreBanner } from './LearnMoreBanner';

export function HelpView(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Help &amp; Support
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Answers, guidance, and ways to reach us.
        </p>
      </div>

      {/* Cards Stack */}
      <div className="flex flex-col gap-5 sm:gap-6">
        <FaqAccordion />
        <ContactCard />
        <LearnMoreBanner />
      </div>
    </div>
  );
}
