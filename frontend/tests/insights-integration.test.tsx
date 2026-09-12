// tests/insights-integration.test.tsx
// Comprehensive test suite for Location Insights API Client & Market Tab UI (Task 6).

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getInsights, fetchInsights } from '@/lib/api-client';
import { MarketTab } from '@/components/dashboard/MarketTab';
import type { InsightsResponse } from '@/lib/api-types';
import type { DetailedReport } from '@/data/reportsData';

const MOCK_INSIGHTS: InsightsResponse = {
  location: 'Bera',
  categories: [
    { name: 'Dairy', trend: 34, sparkline: [12, 18, 22, 28, 34], seasonality: 'All-season' },
    { name: 'Food Processing', trend: 28, sparkline: [10, 14, 20, 24, 28], seasonality: 'Seasonal' },
    { name: 'Logistics', trend: 24, sparkline: [10, 12, 16, 20, 24], seasonality: 'All-season' },
    { name: 'Textiles', trend: 21, sparkline: [8, 12, 15, 18, 21], seasonality: 'Festival peak' },
    { name: 'Retail', trend: 15, sparkline: [10, 11, 13, 14, 15], seasonality: 'Stable daily' },
  ],
};

const MOCK_REPORT: DetailedReport = {
  id: 'test_rep_200',
  title: 'Dairy Unit Assessment',
  category: 'Dairy',
  location: 'Bera, Mat Block · Mathura',
  status: 'Completed',
  date: '12 Sep 2026',
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
    segments: [
      { name: 'Village Households & Daily Consumers', percent: 60 },
      { name: 'Local Retailers', percent: 25 },
      { name: 'Neighboring Catchments', percent: 15 },
    ],
    risks: [
      {
        title: 'Input Price Fluctuation',
        level: 'Medium',
        description: 'Fodder and cattle feed price variation.',
      },
    ],
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
  schemes: [],
  nextSteps: {
    currentStep: 1,
    steps: [{ number: 1, title: 'Review Assessment', status: 'done' }],
    actionItems: [{ id: 1, title: 'Apply at District Nodal Bank', description: 'Submit papers' }],
    initialNotes: '',
  },
};

describe('Location Insights API Client Methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getInsights successfully fetches category trends from backend', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_INSIGHTS,
    } as unknown as Response);

    const result = await getInsights('Bera');
    expect(result.location).toBe('Bera');
    expect(result.categories).toHaveLength(5);
    expect(result.categories[0].name).toBe('Dairy');
    expect(result.categories[0].trend).toBe(34);
    expect(result.categories[0].seasonality).toBe('All-season');
  });

  it('getInsights rejects when location query is empty or whitespace', async () => {
    await expect(getInsights('   ')).rejects.toThrow(/Location query cannot be empty/);
  });

  it('getInsights throws explicit error without mock fallback on HTTP failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
    } as unknown as Response);

    await expect(getInsights('Bera')).rejects.toThrow(
      /Failed to fetch insights for "Bera" \(HTTP 502\)/
    );
  });

  it('fetchInsights falls back gracefully to empty category list on failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

    const result = await fetchInsights('Vrindavan');
    expect(result.location).toBe('Vrindavan');
    expect(result.categories).toEqual([]);
  });
});

describe('MarketTab UI & Data Provenance Labeling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders historical Census 2011 and OSM coverage labels honestly', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_INSIGHTS,
    } as unknown as Response);

    render(<MarketTab report={MOCK_REPORT} />);

    // Check Demographics and Census 2011 label
    expect(screen.getByText('553')).toBeInTheDocument();
    expect(screen.getAllByText(/Census 2011/i).length).toBeGreaterThanOrEqual(1);

    // Check Competitors and OSM Mapped label
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/OSM Mapped/i)).toBeInTheDocument();

    // Check Data Provenance Notice alert
    expect(screen.getByText(/Historical & Coverage Notice:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Demographics reflect the official Census 2011 baseline/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('+34%')).toBeInTheDocument();
    });
  });

  it('calls getInsights for location and renders category demand trends with sparklines', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_INSIGHTS,
    } as unknown as Response);

    render(<MarketTab report={MOCK_REPORT} />);

    await waitFor(() => {
      expect(screen.getByText(/Hyper-Local Category Demand Trends \(Bera\)/i)).toBeInTheDocument();
      expect(screen.getAllByText('Dairy').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('+34%')).toBeInTheDocument();
      expect(screen.getAllByText('All-season').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Assessed')).toBeInTheDocument();
    });
  });

  it('displays error state and retry button when insights endpoint fails without mock fallback', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Gateway Timeout'));

    render(<MarketTab report={MOCK_REPORT} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Failed to load location insights/i);
      expect(screen.getByRole('alert')).toHaveTextContent(/Gateway Timeout/i);
    });

    // Ensure Retry button is available
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Mock successful retry
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_INSIGHTS,
    } as unknown as Response);

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('+34%')).toBeInTheDocument();
    });
  });

  it('displays empty state when insights returns 0 categories', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ location: 'Bera', categories: [] }),
    } as unknown as Response);

    render(<MarketTab report={MOCK_REPORT} />);

    await waitFor(() => {
      expect(screen.getByText(/No category trend data recorded for Bera/i)).toBeInTheDocument();
    });
  });
});
