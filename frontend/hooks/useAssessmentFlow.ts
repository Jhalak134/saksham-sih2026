import { useCallback, useState } from 'react';
import {
  ASSESSMENT_STEPS,
  EMPTY_SESSION,
  type AssessmentSession,
  type AssessmentStep,
} from '@/lib/assessment-session';
import { isMathuraLocation } from '@/data/mockLocations';

// ─── Step index helpers ───────────────────────────────────────────────────────

function stepIndex(step: AssessmentStep): number {
  return ASSESSMENT_STEPS.indexOf(step);
}

// ─── Per-step completion guards ───────────────────────────────────────────────

function isLocationComplete(session: AssessmentSession): boolean {
  return (
    session.locationId.length > 0 &&
    isMathuraLocation(session.locationDisplay || session.locationId)
  );
}

function isIdeaComplete(session: AssessmentSession): boolean {
  return session.idea.trim().length >= 10;
}

function isDetailsComplete(session: AssessmentSession): boolean {
  return session.category.length > 0 && session.capital > 0;
}

function isReviewComplete(session: AssessmentSession): boolean {
  return (
    isLocationComplete(session) &&
    isIdeaComplete(session) &&
    isDetailsComplete(session)
  );
}

function isStepComplete(
  step: AssessmentStep,
  session: AssessmentSession
): boolean {
  if (step === 'location') return isLocationComplete(session);
  if (step === 'idea') return isIdeaComplete(session);
  if (step === 'details') return isDetailsComplete(session);
  return isReviewComplete(session);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface AssessmentFlowState {
  currentStep: AssessmentStep;
  stepIndex: number;
  totalSteps: number;
  session: AssessmentSession;
  /** True when the current step's required fields are filled */
  canProceed: boolean;
  /** Check completion for any step (used by StepIndicator) */
  isComplete: (step: AssessmentStep) => boolean;
  next: () => void;
  back: () => void;
  updateSession: (patch: Partial<AssessmentSession>) => void;
}

export function useAssessmentFlow(
  initialCapital: number,
  initialIdea: string = '',
  initialLocationId: string = '',
  initialLocationDisplay: string = ''
): AssessmentFlowState {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [session, setSession] = useState<AssessmentSession>({
    ...EMPTY_SESSION,
    idea: initialIdea,
    capital: initialCapital,
    locationId: initialLocationId,
    locationDisplay: initialLocationDisplay,
  });

  const currentStep = ASSESSMENT_STEPS[currentStepIndex];

  const next = useCallback(() => {
    setCurrentStepIndex((i) => Math.min(i + 1, ASSESSMENT_STEPS.length - 1));
  }, []);

  const back = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const updateSession = useCallback((patch: Partial<AssessmentSession>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  }, []);

  const isComplete = useCallback(
    (step: AssessmentStep) => isStepComplete(step, session),
    [session]
  );

  return {
    currentStep,
    stepIndex: stepIndex(currentStep),
    totalSteps: ASSESSMENT_STEPS.length,
    session,
    canProceed: isStepComplete(currentStep, session),
    isComplete,
    next,
    back,
    updateSession,
  };
}
