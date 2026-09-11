import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { StepDetails } from '@/components/assessment/StepDetails';
import { CATEGORIES } from '@/lib/constants';

const defaultProps = {
  category: '',
  capital: 0,
  suggestedCategory: '',
  onCategoryChange: vi.fn(),
  onCapitalChange: vi.fn(),
  onContinue: vi.fn(),
};

describe('StepDetails — rendering', () => {
  it('renders all 8 category tiles', () => {
    render(<StepDetails {...defaultProps} />);
    CATEGORIES.forEach((cat) => {
      expect(screen.getByRole('button', { name: new RegExp(cat, 'i') })).toBeInTheDocument();
    });
  });

  it('renders the capital input', () => {
    render(<StepDetails {...defaultProps} />);
    expect(screen.getByLabelText(/available capital/i)).toBeInTheDocument();
  });

  it('renders the Continue button', () => {
    render(<StepDetails {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('shows "Suggested" chip on suggested category', () => {
    render(<StepDetails {...defaultProps} suggestedCategory="Dairy" />);
    expect(screen.getByText('Suggested')).toBeInTheDocument();
  });

  it('does not show "Suggested" chip when no suggestion', () => {
    render(<StepDetails {...defaultProps} suggestedCategory="" />);
    expect(screen.queryByText('Suggested')).toBeNull();
  });
});

describe('StepDetails — CTA state', () => {
  it('Continue is disabled when category and capital are empty', () => {
    render(<StepDetails {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('Continue is disabled when category is selected but capital is 0', () => {
    render(<StepDetails {...defaultProps} category="Dairy" capital={0} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('Continue is disabled when capital > 0 but no category', () => {
    render(<StepDetails {...defaultProps} category="" capital={50000} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('Continue is enabled when both category and capital are filled', () => {
    render(<StepDetails {...defaultProps} category="Dairy" capital={100000} />);
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });
});

describe('StepDetails — interactions', () => {
  it('calls onCategoryChange when a tile is clicked', async () => {
    const onCategoryChange = vi.fn();
    render(<StepDetails {...defaultProps} onCategoryChange={onCategoryChange} />);
    await userEvent.click(screen.getByRole('button', { name: /dairy/i }));
    expect(onCategoryChange).toHaveBeenCalledWith('Dairy');
  });

  it('deselects a category when the selected tile is clicked again', async () => {
    const onCategoryChange = vi.fn();
    render(
      <StepDetails {...defaultProps} category="Dairy" onCategoryChange={onCategoryChange} />
    );
    await userEvent.click(screen.getByRole('button', { name: /dairy/i }));
    expect(onCategoryChange).toHaveBeenCalledWith('');
  });

  it('calls onContinue when Continue is enabled and clicked', async () => {
    const onContinue = vi.fn();
    render(
      <StepDetails
        {...defaultProps}
        category="Dairy"
        capital={100000}
        onContinue={onContinue}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('shows progress count text', () => {
    render(<StepDetails {...defaultProps} category="Dairy" capital={100000} />);
    expect(screen.getByText(/2 of 2 details added/i)).toBeInTheDocument();
  });
});
