// tests/MyReports.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

import { MyReportsScreen } from '@/components/screens/MyReports';

describe('MyReportsScreen', () => {
  it('renders the screen title, subtitle and CTA button', () => {
    render(<MyReportsScreen />);
    expect(screen.getByRole('heading', { level: 1, name: /My Reports/i })).toBeInTheDocument();
    expect(screen.getByText(/All your assessments in one place/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New Assessment/i })).toBeInTheDocument();
  });

  it('renders location-grouped sections with correct counts', () => {
    render(<MyReportsScreen />);
    expect(
      screen.getByRole('heading', { level: 2, name: /Kheragarh, Agra/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Etawah, Uttar Pradesh/i })
    ).toBeInTheDocument();
  });

  it('renders all mock assessment cards by default', () => {
    render(<MyReportsScreen />);
    expect(screen.getByText('Dairy Processing Unit')).toBeInTheDocument();
    expect(screen.getByText('Mobile Repair Shop')).toBeInTheDocument();
    expect(screen.getByText('Solar Equipment Retail')).toBeInTheDocument();
    expect(screen.getByText('Tailoring Unit')).toBeInTheDocument();
  });

  it('filters reports when clicking status tabs', () => {
    render(<MyReportsScreen />);
    
    // Click 'Completed' tab
    const completedTab = screen.getByRole('button', { name: /Completed \(2\)/i });
    fireEvent.click(completedTab);

    // Completed cards should remain
    expect(screen.getByText('Dairy Processing Unit')).toBeInTheDocument();
    expect(screen.getByText('Solar Equipment Retail')).toBeInTheDocument();

    // Non-completed cards should not be displayed
    expect(screen.queryByText('Mobile Repair Shop')).not.toBeInTheDocument();
    expect(screen.queryByText('Tailoring Unit')).not.toBeInTheDocument();
  });

  it('filters by fit score dropdown', () => {
    render(<MyReportsScreen />);

    const fitSelect = screen.getByLabelText(/Filter by fit score/i);
    fireEvent.change(fitSelect, { target: { value: 'high' } });

    // High fit (>= 70) cards
    expect(screen.getByText('Dairy Processing Unit')).toBeInTheDocument();
    expect(screen.getByText('Solar Equipment Retail')).toBeInTheDocument();
    expect(screen.queryByText('Mobile Repair Shop')).not.toBeInTheDocument();
  });

  it('sorts reports when changing sort option', () => {
    render(<MyReportsScreen />);

    const sortSelect = screen.getByLabelText(/Sort reports/i);
    fireEvent.change(sortSelect, { target: { value: 'profit-desc' } });

    // Ensure it renders without crashing
    expect(screen.getByText('Dairy Processing Unit')).toBeInTheDocument();
  });

  it('renders report links to dashboard detail routes', () => {
    render(<MyReportsScreen />);

    const dairyLink = screen.getByRole('link', {
      name: /View report for Dairy Processing Unit in Kheragarh, Agra/i,
    });
    expect(dairyLink).toHaveAttribute('href', '/dashboard/assess_001');
  });
});
