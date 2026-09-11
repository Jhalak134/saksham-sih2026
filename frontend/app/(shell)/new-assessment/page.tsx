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
import { createAssessment } from '@/lib/api-client';
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



// ─── Page Content ─────────────────────────────────────────────────────────────

function NewAssessmentContent(): React.JSX.Element {
  const { capital: shellCapital } = useShell();
  const searchParams = useSearchParams();
  const initialIdea = searchParams ? searchParams.get('idea') ?? '' : '';
  const paramDistrict = searchParams ? searchParams.get('district') ?? '' : '';
  const paramState = searchParams ? searchParams.get('state') ?? '' : '';
  const paramLoc = searchParams ? searchParams.get('location') ?? '' : '';

  let initialLocationId = '';
  let initialLocationDisplay = '';
  if (paramLoc) {
    initialLocationId = 'loc_param';
    initialLocationDisplay = paramLoc;
  } else if (paramDistrict) {
    initialLocationId = paramDistrict.toLowerCase() === 'mathura' ? 'loc_07' : 'loc_param';
    initialLocationDisplay = `${paramDistrict}, ${paramState || 'Uttar Pradesh'}`;
  }

  const router = useRouter();
  const flow = useAssessmentFlow(
    shellCapital,
    initialIdea,
    initialLocationId,
    initialLocationDisplay
  );
  const { currentStep, stepIndex, session, next, back, updateSession, isComplete } = flow;
  const suggestedCategory = inferCategory(session.idea);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const locationValue = session.locationDisplay || session.locationId;
      const res = await createAssessment({
        location: locationValue,
        category: session.category,
        capital: session.capital,
        idea: session.idea.trim() || undefined,
        language: 'en',
      });
      router.push(`/assessment/completed?id=${res.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate assessment. Please check your connection and try again.';
      setSubmitError(message);
      setIsSubmitting(false);
    }
  }

  function handleGoToStep(idx: number): void {
    const stepsBack = stepIndex - idx;
    for (let i = 0; i < stepsBack; i++) back();
  }

  function handleBack(): void {
    if (stepIndex === 0) {
      router.push('/discover');
    } else {
      back();
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Centered White Card Container */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-10 lg:p-12 shadow-xs">
        {/* Back navigation */}
        <button
          type="button"
          onClick={handleBack}
          className={cn(
            'mb-3 flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-text-dark)]',
            'hover:text-black transition-colors cursor-pointer'
          )}
          aria-label="Go back"
        >
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          <span>Back</span>
        </button>

        {/* Card header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-dark)] sm:text-2xl">
            New Assessment
          </h1>
        </div>

        {/* Stepper */}
        <div className="my-5 sm:my-7">
          <StepIndicator activeStepIndex={stepIndex} isComplete={isComplete} />
        </div>

        {/* Step-specific view */}
        <div className="mt-6 sm:mt-8">
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

          {currentStep === 'idea' && (
            <StepIdea
              value={session.idea}
              onChange={(val) => updateSession({ idea: val })}
              onContinue={next}
              onSkip={next}
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

          {currentStep === 'review' && (
            <div className="flex flex-1 flex-col gap-4">
              {submitError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  <p className="font-semibold">Unable to complete assessment</p>
                  <p className="mt-1 text-xs text-red-700">{submitError}</p>
                </div>
              )}
              <StepReview
                session={session}
                goToStep={handleGoToStep}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </div>
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

