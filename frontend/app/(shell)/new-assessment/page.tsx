// app/(shell)/new-assessment/page.tsx
'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useShell } from '@/lib/shell-context';
import { useAssessmentFlow } from '@/hooks/useAssessmentFlow';
import { ASSESSMENT_STEPS } from '@/lib/assessment-session';
import { StepIndicator } from '@/components/assessment/StepIndicator';
import { StepIdea } from '@/components/assessment/StepIdea';
import { StepDetails } from '@/components/assessment/StepDetails';
import { StepLocation } from '@/components/assessment/StepLocation';
import { StepReview } from '@/components/assessment/StepReview';
import { cn } from '@/lib/cn';

// ─── Infer suggested category from idea text ──────────────────────────────────

const KEYWORD_MAP: Record<string, string> = {
  dairy: 'Dairy',
  milk: 'Dairy',
  ghee: 'Dairy',
  paneer: 'Dairy',
  tailoring: 'Textiles',
  textile: 'Textiles',
  fabric: 'Textiles',
  stitch: 'Textiles',
  shop: 'Retail',
  kirana: 'Retail',
  store: 'Retail',
  retail: 'Retail',
  food: 'Food Processing',
  snack: 'Food Processing',
  pickle: 'Food Processing',
  transport: 'Logistics',
  delivery: 'Logistics',
  logistics: 'Logistics',
  farm: 'Agriculture',
  crop: 'Agriculture',
  agriculture: 'Agriculture',
  handicraft: 'Handicrafts',
  craft: 'Handicrafts',
  pottery: 'Handicrafts',
  school: 'Education',
  coaching: 'Education',
  tutor: 'Education',
};

function inferCategory(idea: string): string {
  const lower = idea.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return '';
}

// ─── Step title & subtitle ────────────────────────────────────────────────────

const STEP_META: Record<
  typeof ASSESSMENT_STEPS[number],
  { title: string; subtitle: string }
> = {
  idea: {
    title: 'Tell us about your idea',
    subtitle: 'Plain language — no technical terms needed.',
  },
  details: {
    title: 'Select a category & capital',
    subtitle: '2 of 3 details to add.',
  },
  location: {
    title: 'Where will you operate?',
    subtitle: 'We use this to find local market data for your area.',
  },
  review: {
    title: 'Review your details',
    subtitle: 'Check everything before we generate your report.',
  },
};

// ─── Right sidebar summary (desktop only) ────────────────────────────────────

interface SidebarSummaryProps {
  idea: string;
  category: string;
  capital: number;
  locationDisplay: string;
  stepIndex: number;
}

function SidebarSummary({
  idea,
  category,
  capital,
  locationDisplay,
  stepIndex,
}: SidebarSummaryProps): React.JSX.Element {
  const items = [
    { label: 'Idea', value: idea.trim() || '—', visible: stepIndex > 0 },
    { label: 'Category', value: category || '—', visible: stepIndex > 1 },
    { label: 'Capital', value: capital > 0 ? `\u20B9${capital.toLocaleString('en-IN')}` : '—', visible: stepIndex > 1 },
    { label: 'Location', value: locationDisplay || '—', visible: stepIndex > 2 },
  ];

  return (
    <aside className="hidden lg:flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 self-start">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Your details so far
      </p>
      <div className="flex flex-col gap-3">
        {items.map(({ label, value, visible }) =>
          visible ? (
            <div key={label}>
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">
                {label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--color-text-dark)] leading-snug line-clamp-3">
                {value}
              </p>
            </div>
          ) : null
        )}
      </div>
      <div className="rounded-lg bg-white border border-[var(--color-border)] px-3 py-2">
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Your report generates after Step 4.
        </p>
      </div>
    </aside>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────

function NewAssessmentContent(): React.JSX.Element {
  const { capital: shellCapital } = useShell();
  const searchParams = useSearchParams();
  const initialIdea = searchParams ? searchParams.get('idea') ?? '' : '';
  const router = useRouter();
  const flow = useAssessmentFlow(shellCapital, initialIdea);
  const { currentStep, stepIndex, session, next, back, updateSession, isComplete } = flow;
  const meta = STEP_META[currentStep];
  const suggestedCategory = inferCategory(session.idea);

  function handleSubmit(): void {
    router.push('/assessment/completed');
  }

  function handleGoToStep(idx: number): void {
    // Navigate back to a specific step (used by StepReview edit links)
    const stepsBack = stepIndex - idx;
    for (let i = 0; i < stepsBack; i++) back();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 lg:px-8 lg:py-10">
      {/* Page header */}
      <div className="mb-5 flex flex-col gap-1">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={back}
            className={cn(
              'mb-1 flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)]',
              'hover:text-[var(--color-text-dark)] transition-colors'
            )}
            aria-label="Go back to previous step"
          >
            <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
            Back
          </button>
        )}
        <h1 className="text-xl font-bold text-[var(--color-text-dark)] lg:text-2xl">
          New Assessment
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">{meta.subtitle}</p>
      </div>

      {/* Step indicator */}
      <div className="mb-6">
        <StepIndicator activeStepIndex={stepIndex} isComplete={isComplete} />
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {stepIndex} of {3} details added
        </p>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px] pb-6 lg:pb-0">
        {/* Left: step content */}
        <div>
          <h2 className="mb-4 text-base font-semibold text-[var(--color-text-dark)] lg:mb-5 lg:text-lg">
            {meta.title}
          </h2>

          {currentStep === 'idea' && (
            <StepIdea
              value={session.idea}
              onChange={(val) => updateSession({ idea: val })}
              onContinue={next}
            />
          )}

          {currentStep === 'details' && (
            <StepDetails
              category={session.category}
              capital={session.capital}
              suggestedCategory={suggestedCategory}
              onCategoryChange={(c) => updateSession({ category: c })}
              onCapitalChange={(v) => updateSession({ capital: v })}
              onContinue={next}
            />
          )}

          {currentStep === 'location' && (
            <StepLocation
              locationId={session.locationId}
              locationDisplay={session.locationDisplay}
              onSelect={(id, display) =>
                updateSession({ locationId: id, locationDisplay: display })
              }
              onContinue={next}
            />
          )}

          {currentStep === 'review' && (
            <StepReview
              session={session}
              goToStep={handleGoToStep}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Right: desktop summary sidebar */}
        <SidebarSummary
          idea={session.idea}
          category={session.category}
          capital={session.capital}
          locationDisplay={session.locationDisplay}
          stepIndex={stepIndex}
        />
      </div>
    </div>
  );
}

export default function NewAssessmentPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
          Loading assessment...
        </div>
      }
    >
      <NewAssessmentContent />
    </Suspense>
  );
}

