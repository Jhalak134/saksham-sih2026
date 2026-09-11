// tests/ReportDashboard.test.tsx
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

import { ReportScreen } from '@/components/screens/Report';

describe('ReportScreen (Feasibility Dashboard)', () => {
  it('renders report header with title, location, status and back link', () => {
    render(<ReportScreen reportId="assess_001" />);

    expect(screen.getByRole('heading', { level: 1, name: /Dairy Processing Unit/i })).toBeInTheDocument();
    expect(screen.getByText(/Kheragarh, Agra/i)).toBeInTheDocument();
    expect(screen.getByText(/Back to My Reports/i)).toBeInTheDocument();
  });

  it('renders 5 horizontal sub-tabs', () => {
    render(<ReportScreen reportId="assess_001" />);

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Market' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Financials' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schemes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Steps' })).toBeInTheDocument();
  });

  it('displays Overview content in Dashboard tab by default', () => {
    render(<ReportScreen reportId="assess_001" />);

    expect(screen.getByText(/Viable Opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/Fit Score Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Market Opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/Final Recommendation/i)).toBeInTheDocument();
  });

  it('switches to Market tab and displays market snapshot & risks', () => {
    render(<ReportScreen reportId="assess_001" />);

    fireEvent.click(screen.getByRole('button', { name: 'Market' }));

    expect(screen.getByText(/Market Snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Local Market Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Key Risks & Mitigations/i)).toBeInTheDocument();
    expect(screen.getByText(/Feed-price volatility/i)).toBeInTheDocument();
  });

  it('switches to Financials tab and displays Eligibility vs. Suitability', () => {
    render(<ReportScreen reportId="assess_001" />);

    fireEvent.click(screen.getByRole('button', { name: 'Financials' }));

    expect(screen.getByText(/Financial Structure \(Max Eligibility\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommended Structure \(Suitability\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Projected Financials \(Year 1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Break-even Analysis/i)).toBeInTheDocument();
  });

  it('switches to Schemes tab and displays matched concessional schemes', () => {
    render(<ReportScreen reportId="assess_001" />);

    fireEvent.click(screen.getByRole('button', { name: 'Schemes' }));

    expect(screen.getByText(/Matched Concessional Schemes/i)).toBeInTheDocument();
    expect(screen.getByText(/Micro Finance Scheme \(SCA\/CA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Term Loan Scheme \(SCA\/CA\)/i)).toBeInTheDocument();
  });

  it('switches to Next Steps tab and allows editing personal notes', () => {
    render(<ReportScreen reportId="assess_001" />);

    fireEvent.click(screen.getByRole('button', { name: 'Next Steps' }));

    expect(screen.getByText(/Your Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommended Actions/i)).toBeInTheDocument();

    const textarea = screen.getByLabelText(/Personal notes for this assessment/i);
    expect(textarea).toBeInTheDocument();
    fireEvent.change(textarea, { target: { value: 'Spoke with local vet today.' } });
    expect(textarea).toHaveValue('Spoke with local vet today.');

    fireEvent.click(screen.getByRole('button', { name: /Save notes/i }));
    expect(screen.getByText(/Saved to device/i)).toBeInTheDocument();
  });

  it('navigates from Dashboard teaser button to Financials tab', () => {
    render(<ReportScreen reportId="assess_001" />);

    const teaserBtn = screen.getByRole('button', { name: /Recommended: ₹1,10,000 project/i });
    fireEvent.click(teaserBtn);

    expect(screen.getByText(/Financial Structure \(Max Eligibility\)/i)).toBeInTheDocument();
  });
});
