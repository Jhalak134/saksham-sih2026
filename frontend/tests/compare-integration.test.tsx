import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { CompareScreen } from '@/components/compare/CompareScreen';
import { CompareAssessmentCard } from '@/components/compare/CompareAssessmentCard';
import { CompareAssessmentView } from '@/components/compare/CompareAssessmentView';
import { CompareHeader } from '@/components/compare/CompareHeader';
import { CompareCard } from '@/components/compare/CompareCard';
import { ShellProvider } from '@/lib/shell-context';
import * as apiClient from '@/lib/api-client';
import { getCategoryComparison } from '@/data/compareData';
import type { BackendAssessmentResponse, AssessmentHistoryItem } from '@/lib/api-types';

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockAssessment1: BackendAssessmentResponse = {
  id: 24,
  fitScore: 86.2,
  fit_score: 86.2,
  rating: 'Highly Feasible',
  confidence: 'High',
  confidence_level: 'High',
  recommendation: 'Good opportunity for Kamar',
  village: {
    id: 123579,
    name: 'Kamar',
    block_name: 'Chhata',
    district: 'Mathura',
    state: 'Uttar Pradesh',
    population: 7031,
    households: 1153,
    literacy_rate: 53.62,
  },
  category: {
    id: 1,
    name: 'Dairy',
    icon: 'milk',
    is_seasonal: false,
  },
  financial: {
    available_margin: 100000.0,
    project_cost: 1000000.0,
    max_loan_amount: 900000.0,
    recommended_project_size: 350000.0,
    scheme_id: 2,
    scheme_name: 'Term Loan Scheme',
    interest_rate: 8.0,
    tenure_months: 84,
    moratorium_months: 6,
    monthly_emi: 14834.86,
    total_repayment: 1157119.46,
    total_interest: 257119.46,
    estimated_monthly_revenue: 87500.0,
    estimated_monthly_profit: 19250.0,
    repayment_burden_ratio: 0.771,
    repayment_burden_category: 'Critical (>60% of profit)',
  },
  feasibility: {
    fit_score: 86.2,
    rating: 'Highly Feasible',
    confidence_level: 'High',
    breakdown: {
      market_opportunity: 80.0,
      competition: 95.0,
      capital_fit: 90.0,
      infrastructure: 80.0,
    },
    scoring_rationale: {
      market_opportunity: 'Catchment of 7,031 residents',
    },
    risks: [],
  },
  scheme: {
    id: 2,
    name: 'Term Loan Scheme',
    interest_rate: 8.0,
    tenure_months: 84,
    moratorium_months: 6,
  },
  competitor_count: 0,
  ai_insights: {
    available: true,
    source: 'ai_service',
    grounding_status: 'grounded',
    citations: [],
    limitations: [],
    warnings: [],
  },
  created_at: '2026-09-11T20:56:36',
};

const mockAssessment2: BackendAssessmentResponse = {
  id: 25,
  fitScore: 73.2,
  fit_score: 73.2,
  rating: 'Feasible',
  confidence: 'High',
  confidence_level: 'High',
  recommendation: 'Good opportunity for Bera',
  village: {
    id: 123912,
    name: 'Bera',
    block_name: 'Mat',
    district: 'Mathura',
    state: 'Uttar Pradesh',
    population: 2923,
    households: 553,
    literacy_rate: 61.2,
  },
  category: {
    id: 1,
    name: 'Dairy',
    icon: 'milk',
    is_seasonal: false,
  },
  financial: {
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
  },
  feasibility: {
    fit_score: 73.2,
    rating: 'Feasible',
    confidence_level: 'High',
    breakdown: {
      market_opportunity: 70.0,
      competition: 95.0,
      capital_fit: 50.0,
      infrastructure: 80.0,
    },
    scoring_rationale: {
      market_opportunity: 'Catchment of 2,923 residents',
    },
    risks: [],
  },
  scheme: {
    id: 1,
    name: 'Micro Finance Scheme',
    interest_rate: 6.5,
    tenure_months: 36,
    moratorium_months: 3,
  },
  competitor_count: 2,
  ai_insights: {
    available: true,
    source: 'ai_service',
    grounding_status: 'unverified',
    citations: [],
    limitations: ['No relevant knowledge-base evidence retrieved.'],
    warnings: [],
  },
  created_at: '2026-09-11T20:56:40',
};

const mockHistory: AssessmentHistoryItem[] = [
  {
    id: 24,
    village_name: 'Kamar',
    category_name: 'Dairy',
    capital_input: 100000,
    project_cost: 1000000,
    fit_score: 86.2,
    confidence_level: 'High',
    scheme_name: 'Term Loan Scheme',
    created_at: '2026-09-11T20:56:36',
  },
  {
    id: 25,
    village_name: 'Bera',
    category_name: 'Dairy',
    capital_input: 10000,
    project_cost: 100000,
    fit_score: 73.2,
    confidence_level: 'High',
    scheme_name: 'Micro Finance Scheme',
    created_at: '2026-09-11T20:56:40',
  },
];

describe('Compare Live Backend Integration (Task 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();

    vi.spyOn(apiClient, 'getInsights').mockResolvedValue({
      location: 'Uttar Pradesh',
      categories: [
        { name: 'Dairy', trend: 34, sparkline: [12, 18, 22, 28, 34], seasonality: 'All-season' },
        { name: 'Food Processing', trend: 28, sparkline: [10, 14, 20, 24, 28], seasonality: 'Harvest cyclical' },
        { name: 'Textiles', trend: 21, sparkline: [8, 12, 15, 18, 21], seasonality: 'Festival peak' },
        { name: 'Agriculture', trend: 18, sparkline: [14, 15, 16, 17, 18], seasonality: 'Rabi/Kharif' },
        { name: 'Retail', trend: 15, sparkline: [10, 11, 13, 14, 15], seasonality: 'Stable daily' },
      ],
    });

    vi.spyOn(apiClient, 'getSchemes').mockResolvedValue([
      {
        id: 1,
        name: 'Micro Finance Scheme',
        interest_rate: 6.5,
        tenure_months: 36,
        moratorium_months: 3,
        max_loan_amount: 90000,
        max_project_cost: 100000,
        margin_requirement: '10% own promoter contribution',
      },
      {
        id: 2,
        name: 'Term Loan Scheme',
        interest_rate: 8.0,
        tenure_months: 84,
        moratorium_months: 6,
        max_loan_amount: 900000,
        max_project_cost: 1000000,
        margin_requirement: '10% own promoter contribution',
      },
    ]);

    vi.spyOn(apiClient, 'getAssessmentHistory').mockResolvedValue(mockHistory);
    vi.spyOn(apiClient, 'getAssessmentById').mockImplementation(async (id) => {
      if (Number(id) === 24) return mockAssessment1;
      return mockAssessment2;
    });
  });

  describe('Mode A: Opportunities Live Integration', () => {
    it('fetches live category insights and schemes and displays verified indicators', async () => {
      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      // Verify header rendered immediately
      expect(screen.getByText('Compare')).toBeInTheDocument();
      expect(screen.getByText('Dairy vs Food Processing')).toBeInTheDocument();

      // Wait for live data to resolve
      await waitFor(() => {
        expect(screen.getByText('Micro Finance Scheme')).toBeInTheDocument();
        expect(screen.getByText('Term Loan Scheme')).toBeInTheDocument();
      });

      // Check live trend values from backend
      expect(screen.getByText(/34%/)).toBeInTheDocument();
      expect(screen.getByText(/28%/)).toBeInTheDocument();

      // Check honest labels
      expect(screen.getAllByText('Observed Regional Indicator').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Reference Benchmark Range').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Verified').length).toBe(2);
    });

    it('handles backend failure with explicit error alert and retry button (no silent mock fallback)', async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, 'getInsights').mockRejectedValueOnce(new Error('Network offline or backend timeout'));

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      // Verify explicit error state
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load live comparison data')).toBeInTheDocument();
        expect(screen.getByText('Network offline or backend timeout')).toBeInTheDocument();
      });

      // Verify NO silent fallback to old comparison data
      expect(screen.queryByText('Start Dairy Assessment')).not.toBeInTheDocument();

      // Click Retry button
      vi.spyOn(apiClient, 'getInsights').mockResolvedValueOnce({
        location: 'Uttar Pradesh',
        categories: [
          { name: 'Dairy', trend: 34, sparkline: [12, 18, 22, 28, 34], seasonality: 'All-season' },
          { name: 'Food Processing', trend: 28, sparkline: [10, 14, 20, 24, 28], seasonality: 'Harvest cyclical' },
        ],
      });

      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      await user.click(retryBtn);

      // Verify recovery
      await waitFor(() => {
        expect(screen.getByText('Start Dairy Assessment')).toBeInTheDocument();
      });
    });

    it('handles non-Error rejection object gracefully in opportunities mode', async () => {
      vi.spyOn(apiClient, 'getInsights').mockRejectedValueOnce('Raw string rejection');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText('Failed to load live comparison data').length).toBeGreaterThan(0);
      });
    });

    it('handles negative trends and medium demand in opportunities mode', async () => {
      vi.spyOn(apiClient, 'getInsights').mockResolvedValueOnce({
        location: 'Uttar Pradesh',
        categories: [
          { name: 'Dairy', trend: -12, sparkline: [20, 18, 15, 10, 5], seasonality: 'Winter dip' },
          { name: 'Food Processing', trend: -5, sparkline: [15, 14, 12, 10, 8], seasonality: 'Off-season' },
        ],
      });

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/▼ 12%/)).toBeInTheDocument();
        expect(screen.getByText(/▼ 5%/)).toBeInTheDocument();
      });
    });
  });

  describe('Mode B: Past Assessments Live Integration', () => {
    it('switches to Past Assessments tab, fetches history, and displays side-by-side reports', async () => {
      const user = userEvent.setup();
      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      // Wait for opportunities to load first
      await waitFor(() => {
        expect(screen.getByText('Start Dairy Assessment')).toBeInTheDocument();
      });

      // Click Past Assessments tab
      const assessmentsTab = screen.getByRole('tab', { name: /Past Assessments/i });
      await user.click(assessmentsTab);

      // Verify assessment comparison rendered
      await waitFor(() => {
        expect(screen.getByText('#24 Kamar vs #25 Bera')).toBeInTheDocument();
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
        expect(screen.getByText('Assessment #25')).toBeInTheDocument();
      });

      // Authoritative financial figures displayed verbatim
      expect(screen.getByText('₹10,00,000')).toBeInTheDocument(); // Project cost 24
      expect(screen.getByText('₹14,834.86')).toBeInTheDocument(); // Monthly EMI 24
      expect(screen.getByText('₹2,985.64')).toBeInTheDocument(); // Monthly EMI 25
      expect(screen.getByText('Critical (>60% of profit)')).toBeInTheDocument();
      expect(screen.getByText('Low Risk (<25% of profit)')).toBeInTheDocument();

      // Fit score and rating
      expect(screen.getByText('86.2')).toBeInTheDocument();
      expect(screen.getByText('73.2')).toBeInTheDocument();
      expect(screen.getByText('Highly Feasible')).toBeInTheDocument();
      expect(screen.getByText('Feasible')).toBeInTheDocument();

      // Provenance and data honesty badges
      expect(screen.getAllByText('Census 2011 Baseline').length).toBe(2);
      expect(screen.getAllByText('OSM Mapped Coverage').length).toBe(2);
      expect(screen.getByText('🟢 Grounded Evidence')).toBeInTheDocument();
      expect(screen.getByText('⚪ Rule-based')).toBeInTheDocument();
    });

    it('initializes directly into assessments mode when a URL parameters are provided', async () => {
      mockSearchParams = new URLSearchParams('a=24&a=25');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
        expect(screen.getByText('Assessment #25')).toBeInTheDocument();
      });

      expect(screen.getByText('Kamar, Block Chhata')).toBeInTheDocument();
      expect(screen.getByText('Bera, Block Mat')).toBeInTheDocument();
    });

    it('handles assessment dropdown selection change to compare different reports', async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams('a=24&a=25');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
      });

      // Select report dropdown
      const selectA = screen.getByLabelText('Select first assessment to compare');
      await user.selectOptions(selectA, '25');

      await waitFor(() => {
        expect(apiClient.getAssessmentById).toHaveBeenCalledWith(25);
      });
    });

    it('handles non-Error rejection when selecting dropdown option in assessments mode', async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams('a=24&a=25');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
      });

      vi.spyOn(apiClient, 'getAssessmentById').mockRejectedValueOnce('Network disconnected');
      const selectB = screen.getByLabelText('Select second assessment to compare');
      await user.selectOptions(selectB, '24');

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load assessment #24')).toBeInTheDocument();
      });
    });

    it('handles assessment loading error with error alert and retry button', async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams('a=24&a=25');
      vi.spyOn(apiClient, 'getAssessmentHistory').mockRejectedValueOnce(new Error('Failed to retrieve history'));

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load assessment reports')).toBeInTheDocument();
        expect(screen.getByText('Failed to retrieve history')).toBeInTheDocument();
      });

      // Retry
      vi.spyOn(apiClient, 'getAssessmentHistory').mockResolvedValueOnce(mockHistory);
      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      await user.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
      });
    });

    it('handles non-Error rejection object in assessments mode', async () => {
      mockSearchParams = new URLSearchParams('a=24&a=25');
      vi.spyOn(apiClient, 'getAssessmentHistory').mockRejectedValueOnce('Network drop');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText('Failed to load assessment reports').length).toBeGreaterThan(0);
      });
    });

    it('shows empty state when history has less than 2 assessments', async () => {
      mockSearchParams = new URLSearchParams();
      vi.spyOn(apiClient, 'getAssessmentHistory').mockResolvedValue([mockHistory[0]]);

      const user = userEvent.setup();
      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Start Dairy Assessment')).toBeInTheDocument();
      });

      const tab = screen.getByRole('tab', { name: /Past Assessments/i });
      await user.click(tab);

      await waitFor(() => {
        expect(screen.getByText('Not enough assessments to compare')).toBeInTheDocument();
        expect(screen.getByText('Start New Assessment')).toBeInTheDocument();
      });
    });

    it('allows clearing comparison in assessments mode', async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams('a=24&a=25');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
      });

      const clearBtn = screen.getByText('Clear comparison');
      await user.click(clearBtn);

      expect(screen.getByText('Select two assessments to compare')).toBeInTheDocument();
      expect(screen.getByText('Report 1 vs Report 2')).toBeInTheDocument();
    });

    it('handles empty schemes array and non-matching schemes with fallback in opportunities mode', async () => {
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValueOnce([]);

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Start Dairy Assessment')).toBeInTheDocument();
      });

      // Rerender with custom non-micro/non-term scheme
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValueOnce([
        {
          id: 50,
          name: 'General Enterprise Support',
          interest_rate: 9.5,
          tenure_months: 60,
          moratorium_months: 6,
        },
      ]);

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByText('General Enterprise Support').length).toBeGreaterThan(0);
      });
    });

    it('handles assessments without village in header titles in assessments mode', async () => {
      const assessmentNoVillage1 = { ...mockAssessment1, village: undefined };
      const assessmentNoVillage2 = { ...mockAssessment2, village: undefined };
      vi.spyOn(apiClient, 'getAssessmentById').mockImplementation(async (id) => {
        if (Number(id) === 24) return assessmentNoVillage1;
        return assessmentNoVillage2;
      });

      mockSearchParams = new URLSearchParams('a=24&a=25');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('#24 vs #25')).toBeInTheDocument();
      });
    });
  });

  describe('Isolated Component Unit Verification', () => {
    it('renders CompareAssessmentCard with fallback fields when financials, village, and category are undefined', () => {
      const emptyAssessment: BackendAssessmentResponse = {
        id: 99,
        fitScore: 50,
        rating: 'Low Potential',
        confidence: undefined,
        confidence_level: 'Low',
        recommendation: '',
        village: undefined,
        category: undefined,
        financial: undefined,
        feasibility: {
          fit_score: 50,
          rating: 'Low Potential',
          confidence_level: 'Low',
          breakdown: undefined as any,
          scoring_rationale: {},
          risks: [],
        },
        scheme: undefined,
        competitor_count: undefined,
        ai_insights: undefined,
        created_at: undefined,
      };

      render(<CompareAssessmentCard assessment={emptyAssessment} />);
      expect(screen.getByText('Low Potential')).toBeInTheDocument();
      expect(screen.getByText('Low confidence')).toBeInTheDocument();
      expect(screen.getByText('Mathura District')).toBeInTheDocument();
      expect(screen.getByText('Rural Enterprise')).toBeInTheDocument();
      expect(screen.getByText('Recent')).toBeInTheDocument();
      expect(screen.getAllByText('N/A').length).toBe(4);
      expect(screen.getByText('0')).toBeInTheDocument(); // compCount fallback
      expect(screen.getByText('⚪ Rule-based')).toBeInTheDocument();
    });

    it('renders CompareAssessmentCard with moderate risk badge and fallback fields', () => {
      const modifiedAssessment: BackendAssessmentResponse = {
        ...mockAssessment2,
        rating: 'Moderate',
        confidence: undefined,
        confidence_level: 'Medium',
        created_at: undefined,
        village: undefined,
        financial: {
          ...mockAssessment2.financial!,
          repayment_burden_category: 'Moderate (25-40% of profit)',
        },
        ai_insights: undefined,
      };

      render(<CompareAssessmentCard assessment={modifiedAssessment} />);
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('Medium confidence')).toBeInTheDocument();
      expect(screen.getByText('Mathura District')).toBeInTheDocument();
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('renders CompareAssessmentCard with minimal data exercising all default fallbacks', () => {
      const minimalAssessment: BackendAssessmentResponse = {
        id: 101,
        recommendation: '',
        fit_score: 65.4,
      } as any;

      const { rerender } = render(<CompareAssessmentCard assessment={minimalAssessment} />);
      expect(screen.getByText('Feasible')).toBeInTheDocument();
      expect(screen.getByText('High confidence')).toBeInTheDocument();
      expect(screen.getByText('65.4')).toBeInTheDocument();

      // Test fitScore 0 fallback when neither fitScore nor fit_score is provided
      const zeroAssessment: BackendAssessmentResponse = {
        id: 102,
        recommendation: '',
      } as any;
      rerender(<CompareAssessmentCard assessment={zeroAssessment} />);
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('renders CompareCard with matched scheme and budget fit when capital is tight or moderate', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const data = getCategoryComparison('Dairy');
      render(
        <CompareCard
          data={data}
          capital={1000} // low capital -> needs loan
          matchedScheme={{
            id: 1,
            name: 'Micro Finance Scheme',
            interest_rate: 6.5,
            tenure_months: 36,
            moratorium_months: 3,
            max_loan_amount: 90000,
          }}
          isLive={true}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText('Needs loan')).toBeInTheDocument();
      expect(screen.getByText('Micro Finance Scheme')).toBeInTheDocument();
      expect(screen.getByText(/6.5% p.a./)).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();

      // Test onSelect chevron click on mobile
      const selectBtn = screen.getByLabelText('View details for Dairy');
      await user.click(selectBtn);
      expect(onSelect).toHaveBeenCalledOnce();
    });

    it('renders CompareCard with various themes, low demand badge, and empty sparkline', () => {
      const textilesData = {
        ...getCategoryComparison('Textiles'),
        demandLevel: 'Low' as const,
        sparkline: [10], // < 2 points -> empty sparkline branch
        budgetFit: 'Moderate fit' as const,
      };

      const { rerender } = render(
        <CompareCard data={textilesData} capital={50000} />
      );
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Moderate fit')).toBeInTheDocument();

      // Logistics theme
      rerender(<CompareCard data={getCategoryComparison('Logistics')} capital={50000} />);
      expect(screen.getByText('Logistics')).toBeInTheDocument();

      // Retail theme
      rerender(<CompareCard data={getCategoryComparison('Retail')} capital={50000} />);
      expect(screen.getByText('Retail')).toBeInTheDocument();

      // Other custom theme
      rerender(<CompareCard data={getCategoryComparison('Handmade Pottery')} capital={50000} />);
      expect(screen.getByText('Handmade Pottery')).toBeInTheDocument();
    });

    it('handles CompareAssessmentView dropdown slot 1 change', async () => {
      const user = userEvent.setup();
      const onSelectId = vi.fn();

      render(
        <CompareAssessmentView
          history={mockHistory}
          selectedIds={[24, 25]}
          assessment1={mockAssessment1}
          assessment2={mockAssessment2}
          onSelectId={onSelectId}
        />
      );

      const selectB = screen.getByLabelText('Select second assessment to compare');
      await user.selectOptions(selectB, '24');
      expect(onSelectId).toHaveBeenCalledWith(1, 24);
    });

    it('handles CompareHeader tab clicks between opportunities and assessments', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();

      render(
        <CompareHeader
          title1="Dairy"
          title2="Food Processing"
          onClear={vi.fn()}
          hasComparison={true}
          mode="assessments"
          onModeChange={onModeChange}
          assessmentCount={5}
        />
      );

      const oppTab = screen.getByRole('tab', { name: /Opportunities/i });
      await user.click(oppTab);
      expect(onModeChange).toHaveBeenCalledWith('opportunities');
    });

    it('handles single category param with Dairy in CompareScreen', async () => {
      mockSearchParams = new URLSearchParams('c=Dairy');
      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Dairy vs Food Processing')).toBeInTheDocument();
      });
    });

    it('allows clearing comparison, clicking empty categories, and re-comparing recent reports', async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams('a=24&a=25');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
      });

      // Clear in assessments mode
      const clearBtn = screen.getByText('Clear comparison');
      await user.click(clearBtn);

      expect(screen.getByText('Select two assessments to compare')).toBeInTheDocument();

      // Click "Compare Recent Reports" button
      const compareRecentBtn = screen.getByText(/Compare Recent Reports/i);
      await user.click(compareRecentBtn);

      await waitFor(() => {
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
      });
    });

    it('handles dropdown slot 1 selection change in CompareScreen', async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams('a=24&a=25');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
      });

      // Change Report B (slot 1)
      const selectB = screen.getByLabelText('Select second assessment to compare');
      await user.selectOptions(selectB, '24');

      await waitFor(() => {
        expect(apiClient.getAssessmentById).toHaveBeenCalledWith(24);
      });
    });

    it('handles assessment dropdown slot selection failure in CompareScreen', async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams('a=24&a=25');

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Assessment #24')).toBeInTheDocument();
      });

      vi.spyOn(apiClient, 'getAssessmentById').mockRejectedValueOnce(new Error('Network drop on fetch'));

      const selectA = screen.getByLabelText('Select first assessment to compare');
      await user.selectOptions(selectA, '25');

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Network drop on fetch')).toBeInTheDocument();
      });
    });

    it('exercises category selection branches when building comparison from empty', async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams();

      render(
        <ShellProvider>
          <CompareScreen />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Start Dairy Assessment')).toBeInTheDocument();
      });

      // Clear to empty
      const clearBtn = screen.getByText('Clear comparison');
      await user.click(clearBtn);

      expect(screen.getByText('Select categories to compare')).toBeInTheDocument();

      // Click + Dairy (adds 1st category)
      await user.click(screen.getByText('+ Dairy'));
      expect(screen.getByText(/1 selected \(Dairy\)/)).toBeInTheDocument();

      // Click ✓ Dairy again (same category branch -> prev)
      await user.click(screen.getByText('✓ Dairy'));
      expect(screen.getByText(/1 selected \(Dairy\)/)).toBeInTheDocument();

      // Click + Textiles (adds 2nd category)
      await user.click(screen.getByText('+ Textiles'));
      expect(screen.getByText('Dairy vs Textiles')).toBeInTheDocument();

      // Type in mobile search input
      const searchInput = screen.getByPlaceholderText('Ask SAKSHAM anything...');
      await user.type(searchInput, 'Dairy loans');
      expect((searchInput as HTMLInputElement).value).toBe('Dairy loans');
    });
  });
});
