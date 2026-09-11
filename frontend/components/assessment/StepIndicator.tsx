// components/assessment/StepIndicator.tsx
'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ASSESSMENT_STEPS, type AssessmentStep } from '@/lib/assessment-session';

const STEP_LABELS: Record<AssessmentStep, string> = {
  location: 'Location',
  idea: 'Idea',
  details: 'Details',
  review: 'Review',
};

type StepState = 'completed' | 'active' | 'pending';

function resolveState(
  step: AssessmentStep,
  activeIndex: number,
  isComplete: (s: AssessmentStep) => boolean
): StepState {
  const idx = ASSESSMENT_STEPS.indexOf(step);
  if (idx < activeIndex && isComplete(step)) return 'completed';
  if (idx === activeIndex) return 'active';
  return 'pending';
}

interface StepDotProps {
  state: StepState;
  number: number;
}

function StepDot({ state, number }: StepDotProps): React.JSX.Element {
  const base = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all';
  if (state === 'completed') {
    return (
      <span className={cn(base, 'bg-[var(--color-primary)] text-[var(--color-text-dark)] shadow-xs')}>
        <Check size={16} strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span className={cn(base, 'bg-[var(--color-primary)] text-[var(--color-text-dark)] shadow-xs font-bold')}>
        {number}
      </span>
    );
  }
  return (
    <span className={cn(base, 'border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] font-medium')}>
      {number}
    </span>
  );
}

interface StepIndicatorProps {
  activeStepIndex: number;
  isComplete: (step: AssessmentStep) => boolean;
}

export function StepIndicator({
  activeStepIndex,
  isComplete,
}: StepIndicatorProps): React.JSX.Element {
  return (
    <div className="flex items-center w-full max-w-lg mx-auto" role="list" aria-label="Assessment steps">
      {ASSESSMENT_STEPS.map((step, idx) => {
        const state = resolveState(step, activeStepIndex, isComplete);
        const isLast = idx === ASSESSMENT_STEPS.length - 1;
        return (
          <React.Fragment key={step}>
            <div
              role="listitem"
              aria-current={state === 'active' ? 'step' : undefined}
              className="flex flex-col items-center gap-1.5 min-w-[50px] sm:min-w-[60px]"
            >
              <StepDot state={state} number={idx + 1} />
              <span
                className={cn(
                  'text-xs font-medium leading-none text-center',
                  state === 'active'
                    ? 'font-semibold text-[var(--color-text-dark)]'
                    : 'text-[var(--color-text-muted)]'
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div
                aria-hidden="true"
                className={cn(
                  'mb-5 h-[2px] flex-1 mx-1 sm:mx-2 transition-colors rounded-full',
                  idx < activeStepIndex
                    ? 'bg-[var(--color-primary)]'
                    : idx === activeStepIndex
                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-border)]'
                    : 'bg-[var(--color-border)]'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
