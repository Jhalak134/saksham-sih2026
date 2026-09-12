// tests/MyReports.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

const mockUserSavedReports = [
  {
    id: 'user_rep_001',
    title: 'Dairy Processing Unit',
    category: 'Dairy',
    location: 'Kheragarh, Agra',
    status: 'Completed',
    date: '12 Aug 2025',
    estimatedProfit: 28000,
    breakEvenMonths: 10,
    fitScore: 78,
    confidence: 'Medium',
    iconType: 'dairy',
  },
  {
    id: 'user_rep_002',
    title: 'Mobile Repair Shop',
    category: 'Retail',
    location: 'Kheragarh, Agra',
    status: 'In Progress',
    date: '5 Aug 2025',
    estimatedProfit: 16000,
    breakEvenMonths: 6,
    fitScore: 65,
    confidence: 'Low',
    iconType: 'mobile',
  },
  {
    id: 'user_rep_003',
    title: 'Solar Equipment Retail',
    category: 'Solar',
    location: 'Etawah, Uttar Pradesh',
    status: 'Completed',
    date: '20 Jul 2025',
    estimatedProfit: 45000,
    breakEvenMonths: 14,
    fitScore: 82,
    confidence: 'High',
    iconType: 'solar',
  },
];

import * as apiClient from '@/lib/api-client';
import { MyReportsScreen } from '@/components/screens/MyReports';

describe('MyReportsScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the screen title, subtitle and CTA button', () => {
    vi.spyOn(apiClient, 'getUserSavedReports').mockReturnValue([]);
    render(<MyReportsScreen />);
    expect(screen.getByRole('heading', { level: 1, name: /My Reports/i })).toBeInTheDocument();
    expect(screen.getByText(/All your assessments in one place/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New Assessment/i })).toBeInTheDocument();
  });

  it('renders empty state without any default mock data when user has no reports', () => {
    vi.spyOn(apiClient, 'getUserSavedReports').mockReturnValue([]);
    render(<MyReportsScreen />);
    expect(screen.getByText('No assessments found')).toBeInTheDocument();
    expect(screen.queryByText('Dairy Processing Unit')).not.toBeInTheDocument();
    expect(screen.queryByText('Mobile Repair Shop')).not.toBeInTheDocument();
  });

  it('does not render the Saved filter button', () => {
    vi.spyOn(apiClient, 'getUserSavedReports').mockReturnValue([]);
    render(<MyReportsScreen />);
    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /In Progress/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Completed/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Saved/i })).not.toBeInTheDocument();
  });

  it('renders real user-saved reports grouped by location', () => {
    vi.spyOn(apiClient, 'getUserSavedReports').mockReturnValue(mockUserSavedReports);
    render(<MyReportsScreen />);
    expect(
      screen.getByRole('heading', { level: 2, name: /Kheragarh, Agra/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Etawah, Uttar Pradesh/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Dairy Processing Unit')).toBeInTheDocument();
    expect(screen.getByText('Mobile Repair Shop')).toBeInTheDocument();
    expect(screen.getByText('Solar Equipment Retail')).toBeInTheDocument();
  });

  it('filters reports when clicking status tabs', () => {
    vi.spyOn(apiClient, 'getUserSavedReports').mockReturnValue(mockUserSavedReports);
    render(<MyReportsScreen />);
    
    // Click 'Completed' tab
    const completedTab = screen.getByRole('button', { name: /Completed \(2\)/i });
    fireEvent.click(completedTab);

    // Completed cards should remain
    expect(screen.getByText('Dairy Processing Unit')).toBeInTheDocument();
    expect(screen.getByText('Solar Equipment Retail')).toBeInTheDocument();

    // Non-completed cards should not be displayed
    expect(screen.queryByText('Mobile Repair Shop')).not.toBeInTheDocument();
  });

  it('filters by fit score dropdown', () => {
    vi.spyOn(apiClient, 'getUserSavedReports').mockReturnValue(mockUserSavedReports);
    render(<MyReportsScreen />);

    const fitSelect = screen.getByLabelText(/Filter by fit score/i);
    fireEvent.change(fitSelect, { target: { value: 'high' } });

    // High fit (>= 70) cards
    expect(screen.getByText('Dairy Processing Unit')).toBeInTheDocument();
    expect(screen.getByText('Solar Equipment Retail')).toBeInTheDocument();
    expect(screen.queryByText('Mobile Repair Shop')).not.toBeInTheDocument();
  });

  it('sorts reports when changing sort option', () => {
    vi.spyOn(apiClient, 'getUserSavedReports').mockReturnValue(mockUserSavedReports);
    render(<MyReportsScreen />);

    const sortSelect = screen.getByLabelText(/Sort reports/i);
    fireEvent.change(sortSelect, { target: { value: 'profit-desc' } });

    expect(screen.getByText('Solar Equipment Retail')).toBeInTheDocument();
  });

  it('renders report links to dashboard detail routes', () => {
    vi.spyOn(apiClient, 'getUserSavedReports').mockReturnValue(mockUserSavedReports);
    render(<MyReportsScreen />);

    const dairyLink = screen.getByRole('link', {
      name: /View report for Dairy Processing Unit in Kheragarh, Agra/i,
    });
    expect(dairyLink).toHaveAttribute('href', '/dashboard/user_rep_001');
  });
});
