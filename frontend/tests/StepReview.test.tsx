import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { StepReview } from '@/components/assessment/StepReview';
import type { AssessmentSession } from '@/lib/assessment-session';

const completeSession: AssessmentSession = {
  idea: 'I want to start a dairy unit in my village and sell milk',
  category: 'Dairy',
  capital: 100000,
  locationId: 'loc_07',
  locationDisplay: 'Vrindavan, Mathura',
};

const nonPilotSession: AssessmentSession = {
  idea: 'I want to start a dairy unit in my village and sell milk',
  category: 'Dairy',
  capital: 100000,
  locationId: 'loc_01',
  locationDisplay: 'Kheragarh, Agra',
};

const incompleteSession: AssessmentSession = {
  idea: '',
  category: '',
  capital: 0,
  locationId: '',
  locationDisplay: '',
};

describe('StepReview — rendering', () => {
  it('renders all four review rows', () => {
    render(<StepReview session={completeSession} goToStep={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Business Idea')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Available Capital')).toBeInTheDocument();
  });

  it('displays session values in review rows', () => {
    render(<StepReview session={completeSession} goToStep={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Vrindavan, Mathura')).toBeInTheDocument();
  });

  it('displays "—" for empty fields', () => {
    render(<StepReview session={incompleteSession} goToStep={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('renders the Get my recommendation button', () => {
    render(<StepReview session={completeSession} goToStep={vi.fn()} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /get my recommendation/i })
    ).toBeInTheDocument();
  });
});

describe('StepReview — CTA state', () => {
  it('CTA is enabled when session is complete with Mathura location', () => {
    render(<StepReview session={completeSession} goToStep={vi.fn()} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /get my recommendation/i })
    ).not.toBeDisabled();
  });

  it('CTA is disabled when location is not in Mathura', () => {
    render(<StepReview session={nonPilotSession} goToStep={vi.fn()} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /get my recommendation/i })
    ).toBeDisabled();
  });

  it('CTA is disabled when session is incomplete', () => {
    render(<StepReview session={incompleteSession} goToStep={vi.fn()} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /get my recommendation/i })
    ).toBeDisabled();
  });
});

describe('StepReview — edit links', () => {
  it('Edit buttons are rendered for each row', () => {
    render(<StepReview session={completeSession} goToStep={vi.fn()} onSubmit={vi.fn()} />);
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBe(4);
  });

  it('clicking Edit on Location calls goToStep(0)', async () => {
    const goToStep = vi.fn();
    render(<StepReview session={completeSession} goToStep={goToStep} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /edit location/i }));
    expect(goToStep).toHaveBeenCalledWith(0);
  });

  it('clicking Edit on Business Idea calls goToStep(1)', async () => {
    const goToStep = vi.fn();
    render(<StepReview session={completeSession} goToStep={goToStep} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /edit business idea/i }));
    expect(goToStep).toHaveBeenCalledWith(1);
  });

  it('clicking Edit on Category calls goToStep(2)', async () => {
    const goToStep = vi.fn();
    render(<StepReview session={completeSession} goToStep={goToStep} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /edit category/i }));
    expect(goToStep).toHaveBeenCalledWith(2);
  });
});

describe('StepReview — submit', () => {
  it('calls onSubmit when CTA clicked and enabled', async () => {
    const onSubmit = vi.fn();
    render(<StepReview session={completeSession} goToStep={vi.fn()} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /get my recommendation/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('does not call onSubmit when CTA is disabled', async () => {
    const onSubmit = vi.fn();
    render(
      <StepReview session={incompleteSession} goToStep={vi.fn()} onSubmit={onSubmit} />
    );
    await userEvent.click(screen.getByRole('button', { name: /get my recommendation/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
