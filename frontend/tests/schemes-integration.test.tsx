// tests/schemes-integration.test.tsx
// Comprehensive test suite for Schemes API Client & Schemes UI Components (Task 6).

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getSchemes,
  getSchemeById,
  matchScheme,
  calculateSchemeEmi,
} from '@/lib/api-client';
import { SchemesTab } from '@/components/dashboard/SchemesTab';
import { SchemeEmiCalculator } from '@/components/dashboard/SchemeEmiCalculator';
import { SchemeMarginMatcher } from '@/components/dashboard/SchemeMarginMatcher';
import type { OfficialScheme, EMICalculationResponse, SchemeMatchResponse } from '@/lib/api-types';
import type { DetailedReport } from '@/data/reportsData';

const MOCK_SCHEMES: OfficialScheme[] = [
  {
    id: 1,
    name: 'Micro Finance Scheme',
    max_project_cost: 140000.0,
    max_loan_amount: 125000.0,
    interest_rate: 6.5,
    tenure_months: 36,
    moratorium_months: 3,
    margin_requirement: '10% own promoter contribution',
  },
  {
    id: 2,
    name: 'Term Loan Scheme',
    max_project_cost: 5000000.0,
    max_loan_amount: 4500000.0,
    interest_rate: 8.0,
    tenure_months: 84,
    moratorium_months: 6,
    margin_requirement: '10% own promoter contribution',
  },
];

const MOCK_REPORT: DetailedReport = {
  id: 'test_rep_100',
  title: 'Dairy Processing Unit',
  category: 'Dairy',
  location: 'Bera, Mat Block · Mathura',
  status: 'Completed',
  date: '12 Aug 2025',
  fitScore: 78,
  viabilityLabel: 'Feasible',
  viabilityDescription: 'High demand in Mat block.',
  confidence: 'High',
  breakdown: {
    marketOpportunity: 8.5,
    competition: 9.0,
    capitalFit: 7.0,
    infrastructure: 8.0,
  },
  recommendation: {
    verdict: 'Viable project opportunity in Bera.',
    recommendedProjectCost: 350000,
    supportingFactors: ['High demand for chilling units'],
    pointsToConsider: ['Working capital buffer needed'],
  },
  keyInsights: ['Monthly repayment: ₹2,986'],
  market: {
    snapshot: {
      totalDemand: 'Strong Catchment Demand',
      marketSize: '₹10.5 Lakhs / year',
      growthTrend: 'Active rural commerce demand',
    },
    localSummary: {
      estimatedHouseholds: 553,
      mappedCompetitors: 0,
      nearbyMarkets: 2,
      marketOpportunity: '2,923 catchment population',
    },
    segments: [{ name: 'Daily Consumers', percent: 60 }],
    risks: [{ title: 'Seasonal', level: 'Low', description: 'Steady milk output' }],
  },
  financials: {
    maxEligibility: {
      projectCost: 100000,
      schemeName: 'Micro Finance Scheme',
      maxLoanAmount: 90000,
      loanSharePercent: 90,
    },
    suitability: {
      suggestedProjectSize: 350000,
      ownContribution: 10000,
      ownContributionPercent: 10,
      bankFinance: 90000,
      bankFinancePercent: 90,
      estimatedMonthlyRepayment: 2986,
      tenureYears: 3,
    },
    breakEvenMonths: 8,
    breakEvenNote: 'Expected break-even around month 8.',
    monthlyProjections: [{ month: 1, revenue: 50000, expenses: 30000 }],
  },
  schemes: [
    {
      id: '1',
      name: 'Micro Finance Scheme',
      category: 'Dairy',
      maxProjectCost: '₹1,00,000',
      maxLoan: '₹90,000',
      interestRate: '6.5% p.a.',
      tenure: '3 Years (36 Months)',
      moratorium: '3 Months',
      eligible: true,
      reasoning: 'Matched for project cost ₹1,00,000 with margin requirement of 10%.',
      highlight: 'Recommended Scheme',
      documentChecklist: ['Aadhaar Card', 'Gram Panchayat Certificate'],
    },
  ],
  nextSteps: {
    currentStep: 1,
    steps: [{ number: 1, title: 'Review Assessment', status: 'done' }],
    actionItems: [{ id: 1, title: 'Apply at District Nodal Bank', description: 'Submit papers' }],
    initialNotes: '',
  },
};

describe('Schemes API Client Methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getSchemes successfully returns official credit schemes', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_SCHEMES,
    } as unknown as Response);

    const schemes = await getSchemes();
    expect(schemes).toHaveLength(2);
    expect(schemes[0].name).toBe('Micro Finance Scheme');
    expect(schemes[1].max_loan_amount).toBe(4500000.0);
  });

  it('getSchemes throws an error when backend fails with HTTP 500', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(getSchemes()).rejects.toThrow(/Failed to fetch official credit schemes \(HTTP 500\)/);
  });

  it('getSchemeById returns single scheme details', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_SCHEMES[0],
    } as unknown as Response);

    const scheme = await getSchemeById(1);
    expect(scheme.id).toBe(1);
    expect(scheme.interest_rate).toBe(6.5);
  });

  it('getSchemeById throws 404 error when scheme is missing', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(getSchemeById(99)).rejects.toThrow(/Failed to fetch scheme 99 \(HTTP 404\)/);
  });

  it('matchScheme returns deterministic backend matching payload', async () => {
    const mockMatchRes: SchemeMatchResponse = {
      available_margin: 10000.0,
      project_cost: 100000.0,
      max_loan_amount: 90000.0,
      recommended_project_size: 350000.0,
      scheme_id: 1,
      scheme_name: 'Micro Finance Scheme',
      interest_rate: 6.5,
      tenure_months: 36,
      moratorium_months: 3,
      monthly_emi: 2985.64,
      total_repayment: 98526.14,
      total_interest: 8526.14,
      estimated_monthly_revenue: 87500.0,
      estimated_monthly_profit: 19250.0,
      repayment_burden_ratio: 0.155,
      repayment_burden_category: 'Low Risk (<25% of profit)',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockMatchRes,
    } as unknown as Response);

    const result = await matchScheme({ available_margin: 10000, category: 'Dairy' });
    expect(result.scheme_name).toBe('Micro Finance Scheme');
    expect(result.monthly_emi).toBe(2985.64);
  });

  it('matchScheme throws client-side error if available_margin <= 0', async () => {
    await expect(matchScheme({ available_margin: 0, category: 'Dairy' })).rejects.toThrow(
      /Available margin must be greater than 0/
    );
  });

  it('calculateSchemeEmi calls backend and returns reducing-balance math', async () => {
    const mockEmiRes: EMICalculationResponse = {
      principal: 90000.0,
      monthly_emi: 2985.64,
      total_repayment: 98526.14,
      total_interest: 8526.14,
      repayment_months: 33,
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockEmiRes,
    } as unknown as Response);

    const result = await calculateSchemeEmi({
      loan_amount: 90000,
      interest_rate: 6.5,
      tenure_months: 36,
      moratorium_months: 3,
    });

    expect(result.principal).toBe(90000.0);
    expect(result.monthly_emi).toBe(2985.64);
    expect(result.repayment_months).toBe(33);
  });

  it('calculateSchemeEmi validates positive loan amount', async () => {
    await expect(
      calculateSchemeEmi({
        loan_amount: -500,
        interest_rate: 6.5,
        tenure_months: 36,
        moratorium_months: 3,
      })
    ).rejects.toThrow(/Loan amount must be greater than 0/);
  });
});

describe('Schemes UI Components (SchemesTab & Calculators)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state then renders live schemes from backend', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_SCHEMES,
    } as unknown as Response);

    render(<SchemesTab report={MOCK_REPORT} />);

    // Initially loading
    expect(screen.getByText(/Loading official credit schemes from backend/i)).toBeInTheDocument();

    // After loading resolves
    await waitFor(() => {
      expect(screen.getByText(/Matched Concessional Schemes/i)).toBeInTheDocument();
      expect(screen.getByText(/Official Statutory Credit Schemes \(Live Database\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Micro Finance Scheme/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Term Loan Scheme/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays honest error state and allows retrying when schemes fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

    render(<SchemesTab report={MOCK_REPORT} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Failed to load official schemes from backend/i);
      expect(screen.getByRole('alert')).toHaveTextContent(/Network offline/i);
    });

    // Verify retry button is present and clickable
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Mock successful retry
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_SCHEMES,
    } as unknown as Response);

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getAllByText(/Term Loan Scheme/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('SchemeEmiCalculator prevents loans exceeding scheme ceiling and calculates via backend', async () => {
    render(<SchemeEmiCalculator schemes={MOCK_SCHEMES} defaultSchemeId={1} initialLoanAmount={50000} />);

    // Loan ceiling for Micro Finance is ₹1,25,000. Try setting ₹2,00,000.
    const loanInput = screen.getByLabelText(/Proposed Loan Amount/i);
    fireEvent.change(loanInput, { target: { value: '200000' } });

    const form = loanInput.closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByRole('alert')).toHaveTextContent(/exceeds statutory ceiling of ₹1,25,000/i);

    // Now set valid ₹90,000 and calculate
    fireEvent.change(loanInput, { target: { value: '90000' } });

    const mockEmiRes: EMICalculationResponse = {
      principal: 90000.0,
      monthly_emi: 2985.64,
      total_repayment: 98526.14,
      total_interest: 8526.14,
      repayment_months: 33,
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockEmiRes,
    } as unknown as Response);

    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Backend Calculated Repayment Schedule/i)).toBeInTheDocument();
      expect(screen.getByText('₹2,985.64')).toBeInTheDocument();
      expect(screen.getByText('₹98,526.14')).toBeInTheDocument();
      expect(screen.getByText('₹8,526.14')).toBeInTheDocument();
    });
  });

  it('SchemeMarginMatcher evaluates alternative margin equity via backend', async () => {
    render(<SchemeMarginMatcher category="Dairy" initialMargin={20000} />);

    const marginInput = screen.getByLabelText(/Test Available Margin/i);
    expect(marginInput).toHaveValue(20000);

    const mockMatchRes: SchemeMatchResponse = {
      available_margin: 20000.0,
      project_cost: 200000.0,
      max_loan_amount: 180000.0,
      recommended_project_size: 350000.0,
      scheme_id: 2,
      scheme_name: 'Term Loan Scheme',
      interest_rate: 8.0,
      tenure_months: 84,
      moratorium_months: 6,
      monthly_emi: 2816.03,
      total_repayment: 219650.34,
      total_interest: 39650.34,
      estimated_monthly_revenue: 87500.0,
      estimated_monthly_profit: 19250.0,
      repayment_burden_ratio: 0.146,
      repayment_burden_category: 'Low Risk (<25% of profit)',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockMatchRes,
    } as unknown as Response);

    const form = marginInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Matched Scheme: Term Loan Scheme/i)).toBeInTheDocument();
      expect(screen.getByText('₹2,00,000')).toBeInTheDocument();
      expect(screen.getByText('₹1,80,000')).toBeInTheDocument();
      expect(screen.getByText('₹2,816.03')).toBeInTheDocument();
    });
  });
});
