// components/assessment/StepReview.tsx
'use client';

import React from 'react';
import { ArrowRight, Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AssessmentSession } from '@/lib/assessment-session';
import { isMathuraLocation } from '@/data/mockLocations';

// ─── Review row ───────────────────────────────────────────────────────────────

interface ReviewRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

function ReviewRow({ label, value, onEdit }: ReviewRowProps): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-white px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--color-text-dark)] leading-snug">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium',
          'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-dark)]',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] cursor-pointer'
        )}
      >
        <Pencil size={12} strokeWidth={2} aria-hidden="true" />
        Edit
      </button>
    </div>
  );
}

// ─── StepReview ───────────────────────────────────────────────────────────────

interface StepReviewProps {
  session: AssessmentSession;
  /** Navigate back to a specific step index */
  goToStep: (index: number) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function StepReview({
  session,
  goToStep,
  onSubmit,
  isSubmitting = false,
}: StepReviewProps): React.JSX.Element {
  const isLocationValid =
    session.locationId.length > 0 &&
    isMathuraLocation(session.locationDisplay || session.locationId);

  const allFilled =
    isLocationValid &&
    session.idea.trim().length >= 10 &&
    session.category.length > 0 &&
    session.capital > 0;

  const capitalDisplay = `\u20B9${session.capital.toLocaleString('en-IN')}`;
  const isButtonDisabled = !allFilled || isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-text-muted)]">
          Review your details before generating the report.
        </p>

        <ReviewRow
          label="Location"
          value={session.locationDisplay || '—'}
          onEdit={() => goToStep(0)}
        />
        <ReviewRow
          label="Business Idea"
          value={session.idea.trim() || '—'}
          onEdit={() => goToStep(1)}
        />
        <ReviewRow
          label="Category"
          value={session.category || '—'}
          onEdit={() => goToStep(2)}
        />
        <ReviewRow
          label="Available Capital"
          value={session.capital > 0 ? capitalDisplay : '—'}
          onEdit={() => goToStep(2)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onSubmit}
          disabled={isButtonDisabled}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold',
            'transition-colors disabled:cursor-not-allowed disabled:opacity-40',
            allFilled && !isSubmitting
              ? 'bg-[var(--color-primary)] text-[var(--color-text-dark)] hover:bg-[var(--color-primary-dark)]'
              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
          )}
          aria-disabled={isButtonDisabled}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-dark)] border-t-transparent" />
              <span>Generating recommendation...</span>
            </>
          ) : (
            <>
              Get my recommendation
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </>
          )}
        </button>
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          {isSubmitting
            ? 'Analyzing location, calculating finances, and retrieving scheme evidence...'
            : 'Always visible · disabled until all details are complete'}
        </p>
      </div>
    </div>
  );
}
