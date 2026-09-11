import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { CompareBar } from '@/components/discover/CompareBar';

describe('CompareBar', () => {
  it('renders with comparison label', () => {
    render(
      <CompareBar selected={new Set(['Dairy', 'Textiles'])} onClear={vi.fn()} />
    );
    expect(screen.getByText(/Comparing:/)).toBeInTheDocument();
  });

  it('shows "Dairy vs Textiles" label', () => {
    render(
      <CompareBar selected={new Set(['Dairy', 'Textiles'])} onClear={vi.fn()} />
    );
    expect(screen.getByText(/Dairy vs Textiles/)).toBeInTheDocument();
  });

  it('renders "View Comparison" button', () => {
    render(
      <CompareBar selected={new Set(['Dairy', 'Textiles'])} onClear={vi.fn()} />
    );
    expect(screen.getByText(/View Comparison/)).toBeInTheDocument();
  });
});
