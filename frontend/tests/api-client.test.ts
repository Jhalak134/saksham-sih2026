import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAssessment,
  getAssessmentById,
  getAssessmentHistory,
  mapBackendResponseToDetailedReport,
  fetchInsights,
  fetchAssessment,
  cacheAssessment,
  type BackendAssessmentResponse,
} from '@/lib/api-client';

describe('api-client — Unit Tests', () => {
  const mockBackendResponse: BackendAssessmentResponse = {
    id: 42,
    fitScore: 82.5,
    confidence: 'High',
    recommendation: 'Highly viable dairy venture in Mathura',
    fit_score: 82.5,
    confidence_level: 'High',
    rating: 'Highly Viable',
    village: {
      id: 7,
      name: 'Vrindavan',
      block_name: 'Mathura',
      district: 'Mathura',
      state: 'Uttar Pradesh',
      population: 63000,
      households: 11000,
      literacy_rate: 78.5,
    },
    category: {
      id: 1,
      name: 'Dairy',
      icon: 'cow',
      is_seasonal: false,
    },
    financial: {
      available_margin: 75000,
      project_cost: 750000,
      max_loan_amount: 675000,
      recommended_project_size: 500000,
      monthly_emi: 9540.25,
      interest_rate: 8.5,
      tenure_months: 84,
      moratorium_months: 6,
      scheme_name: 'Term Loan Scheme',
      repayment_burden_category: 'Low',
    },
    feasibility: {
      fit_score: 82.5,
      confidence_level: 'High',
      rating: 'Highly Viable',
      breakdown: {
        market_opportunity: 85.0,
        competition: 72.0,
        capital_fit: 90.0,
        infrastructure: 83.0,
      },
    },
    scheme: {
      id: 2,
      name: 'Term Loan Scheme',
      interest_rate: 8.5,
      tenure_months: 84,
      moratorium_months: 6,
      max_project_cost: 2500000,
    },
    ai_insights: {
      explanation: 'Vrindavan has strong temple tourism demand for milk and ghee.',
      recommendation: 'Establish chilling unit within 5km radius.',
      key_points: ['High daily milk procurement', 'Guaranteed local demand'],
      citations: [
        {
          chunk_id: 'pmfme_p012_c002',
          document_id: 'pmfme_scheme_guidelines',
          title: 'PMFME Scheme Guidelines',
          source: 'pmfme_scheme_guidelines.pdf',
          page_start: 12,
          page_end: 13,
          text: 'Individual micro enterprises eligible for credit-linked capital subsidy at 35%.',
          is_template_data: false,
        },
      ],
      limitations: ['Seasonal tourism spikes in Vrindavan may cause demand swings.'],
      warnings: ['Maintain strict cold-chain compliance.'],
      grounding_status: 'grounded',
      retrieval_status: 'grounded',
      evidence_available: true,
    },
    competitor_count: 3,
    status: 'Completed',
    created_at: '2026-09-11T12:00:00',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createAssessment', () => {
    it('submits assessment request and returns parsed response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockBackendResponse,
        })
      );

      const result = await createAssessment({
        location: 'Vrindavan',
        category: 'Dairy',
        capital: 75000,
        idea: 'Opening a dairy chilling plant',
      });

      expect(result.id).toBe(42);
      expect(result.fit_score).toBe(82.5);
      expect(result.village.name).toBe('Vrindavan');
      expect(result.financial.monthly_emi).toBe(9540.25);
    });

    it('throws descriptive error on backend HTTP failure', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({ detail: 'Location not found in service territory.' }),
        })
      );

      await expect(
        createAssessment({
          location: 'InvalidTown',
          category: 'Dairy',
          capital: 50000,
        })
      ).rejects.toThrow('Location not found in service territory.');
    });
  });

  describe('getAssessmentById', () => {
    it('returns cached response without network request if cached', async () => {
      cacheAssessment(mockBackendResponse);
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const result = await getAssessmentById(42);
      expect(result.id).toBe(42);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('fetches from backend if not present in cache', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockBackendResponse, id: 99 }),
      });
      vi.stubGlobal('fetch', fetchSpy);

      const result = await getAssessmentById(99);
      expect(result.id).toBe(99);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/assess/99'),
        expect.any(Object)
      );
    });
  });

  describe('getAssessmentHistory', () => {
    it('requests history with pagination query params', async () => {
      const mockHistory = [
        {
          id: 42,
          village_name: 'Vrindavan',
          category_name: 'Dairy',
          capital_input: 75000,
          project_cost: 750000,
          fit_score: 82.5,
          confidence_level: 'High',
          scheme_name: 'Term Loan Scheme',
          created_at: '2026-09-11T12:00:00',
        },
      ];

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockHistory,
      });
      vi.stubGlobal('fetch', fetchSpy);

      const history = await getAssessmentHistory(10, 20);
      expect(history.length).toBe(1);
      expect(history[0].id).toBe(42);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/assess/history?skip=10&limit=20'),
        expect.any(Object)
      );
    });
  });

  describe('mapBackendResponseToDetailedReport', () => {
    it('scales breakdown scores from 0..100 to 0..10 scale accurately', () => {
      const report = mapBackendResponseToDetailedReport(mockBackendResponse);

      expect(report.breakdown.marketOpportunity).toBe(8.5);
      expect(report.breakdown.competition).toBe(7.2);
      expect(report.breakdown.capitalFit).toBe(9.0);
      expect(report.breakdown.supplyRisk).toBe(8.3);
    });

    it('preserves exact deterministic financial calculations from backend', () => {
      const report = mapBackendResponseToDetailedReport(mockBackendResponse);

      expect(report.financials.maxEligibility.projectCost).toBe(750000);
      expect(report.financials.maxEligibility.maxLoanAmount).toBe(675000);
      expect(report.financials.suitability.suggestedProjectSize).toBe(500000);
      expect(report.financials.suitability.estimatedMonthlyRepayment).toBe(9540.25);
      expect(report.repaymentBurdenCategory).toBe('Low');
      expect(report.isLiveBackend).toBe(true);
    });

    it('preserves AI insights, citations, and grounding status', () => {
      const report = mapBackendResponseToDetailedReport(mockBackendResponse);

      expect(report.aiInsights).toBeDefined();
      expect(report.aiInsights?.grounding_status).toBe('grounded');
      expect(report.aiInsights?.citations.length).toBe(1);
      expect(report.aiInsights?.citations[0].chunk_id).toBe('pmfme_p012_c002');
      expect(report.aiInsights?.limitations[0]).toContain('Seasonal tourism');
    });

    it('handles legacy responses missing financial object gracefully', () => {
      const partialResponse = {
        id: 101,
        fit_score: 68.0,
        confidence_level: 'Medium',
        project_cost: 400000,
        max_loan_amount: 360000,
        recommended_project_size: 300000,
        capital_input: 40000,
        village: { name: 'Kamar', block_name: 'Nandgaon' },
        scheme: { id: 1, name: 'Micro Finance Scheme', tenure_months: 60 },
      } as unknown as BackendAssessmentResponse;

      const report = mapBackendResponseToDetailedReport(partialResponse);
      expect(report.fitScore).toBe(68);
      expect(report.financials.maxEligibility.projectCost).toBe(400000);
      expect(report.financials.maxEligibility.maxLoanAmount).toBe(360000);
      expect(report.financials.suitability.suggestedProjectSize).toBe(300000);
    });
  });

  describe('fetchAssessment & fetchInsights backward compatibility', () => {
    it('fetchAssessment returns fitScore and confidence', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockBackendResponse,
        })
      );

      const result = await fetchAssessment('Vrindavan', 'Dairy', 75000);
      expect(result.fitScore).toBe(82.5);
      expect(result.confidence).toBe('High');
    });

    it('fetchInsights falls back gracefully when endpoint 404s', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
        })
      );

      const result = await fetchInsights('Vrindavan');
      expect(result.location).toBe('Vrindavan');
      expect(result.categories).toEqual([]);
    });
  });
});
