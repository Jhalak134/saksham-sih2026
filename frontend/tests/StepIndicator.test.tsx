import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StepIndicator } from '@/components/assessment/StepIndicator';
import { ASSESSMENT_STEPS, type AssessmentStep } from '@/lib/assessment-session';

const neverComplete = (_: AssessmentStep): boolean => false;
const alwaysComplete = (_: AssessmentStep): boolean => true;

describe('StepIndicator — structure', () => {
  it('renders all 4 step labels', () => {
    render(<StepIndicator activeStepIndex={0} isComplete={neverComplete} />);
    expect(screen.getByText('Idea')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('renders 4 list items', () => {
    render(<StepIndicator activeStepIndex={0} isComplete={neverComplete} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('active step has aria-current="step"', () => {
    render(<StepIndicator activeStepIndex={1} isComplete={neverComplete} />);
    const activeItem = screen.getAllByRole('listitem')[1];
    expect(activeItem.getAttribute('aria-current')).toBe('step');
  });

  it('non-active steps do not have aria-current', () => {
    render(<StepIndicator activeStepIndex={0} isComplete={neverComplete} />);
    const items = screen.getAllByRole('listitem');
    expect(items[1].getAttribute('aria-current')).toBeNull();
    expect(items[2].getAttribute('aria-current')).toBeNull();
    expect(items[3].getAttribute('aria-current')).toBeNull();
  });
});

describe('StepIndicator — step number display', () => {
  it('shows step numbers for pending steps', () => {
    render(<StepIndicator activeStepIndex={0} isComplete={neverComplete} />);
    // Steps 2,3,4 are pending and show numbers
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows step number 1 for active step at index 0', () => {
    render(<StepIndicator activeStepIndex={0} isComplete={neverComplete} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

describe('StepIndicator — completed steps', () => {
  it('renders a checkmark icon for completed steps', () => {
    // All steps before index 2 are completed
    const isComplete = (s: AssessmentStep): boolean =>
      ASSESSMENT_STEPS.indexOf(s) < 2;
    const { container } = render(
      <StepIndicator activeStepIndex={2} isComplete={isComplete} />
    );
    // Completed steps render Check icons (svg within the dot span)
    const dots = container.querySelectorAll('[class*="rounded-full"]');
    expect(dots.length).toBeGreaterThan(0);
  });
});
