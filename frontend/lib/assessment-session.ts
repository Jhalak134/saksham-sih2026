// lib/assessment-session.ts
// Shared types for the 4-step New Assessment wizard.

export type AssessmentStep = 'idea' | 'details' | 'location' | 'review';

export const ASSESSMENT_STEPS: readonly AssessmentStep[] = [
  'idea',
  'details',
  'location',
  'review',
] as const;

export interface AssessmentSession {
  /** Free-text idea from Step 1 */
  idea: string;
  /** Resolved category key from Step 2 */
  category: string;
  /** Available capital (pre-filled from ShellContext, editable locally) */
  capital: number;
  /** Internal location ID from Step 3 */
  locationId: string;
  /** Human-readable display string, e.g. "Kheragarh, Agra" */
  locationDisplay: string;
}

export const EMPTY_SESSION: AssessmentSession = {
  idea: '',
  category: '',
  capital: 0,
  locationId: '',
  locationDisplay: '',
};
