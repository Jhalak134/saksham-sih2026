// lib/api-types.ts
// Typed contracts for SAKSHAM Backend API payloads and responses.

export interface AssessmentRequest {
  location: string;
  category: string;
  capital: number;
  idea?: string;
  village_id?: number;
  location_query?: string;
  language?: string;
  phone_or_email?: string;
}

export interface VillageData {
  id: number;
  name: string;
  block_name: string;
  district: string;
  state: string;
  population: number;
  households: number;
  literacy_rate: number;
}

export interface CategoryData {
  id: number;
  name: string;
  icon: string;
  is_seasonal: boolean;
}

export interface FinancialData {
  available_margin: number;
  project_cost: number;
  max_loan_amount: number;
  recommended_project_size: number;
  scheme_id: number;
  scheme_name: string;
  interest_rate: number;
  tenure_months: number;
  moratorium_months: number;
  monthly_emi: number;
  total_repayment: number;
  total_interest: number;
  estimated_monthly_revenue: number;
  estimated_monthly_profit: number;
  repayment_burden_ratio: number;
  repayment_burden_category: string;
}

export interface FeasibilityBreakdown {
  market_opportunity: number;
  competition: number;
  capital_fit: number;
  infrastructure: number;
}

export interface RiskItem {
  category: string;
  risk: string;
  mitigation: string;
  severity: string;
}

export interface FeasibilityData {
  fit_score: number;
  rating: string;
  confidence_level: string;
  breakdown: FeasibilityBreakdown;
  scoring_rationale: Record<string, string>;
  risks: RiskItem[];
}

export interface SchemeData {
  id: number;
  name: string;
  interest_rate: number;
  tenure_months: number;
  moratorium_months: number;
  max_project_cost?: number;
}

export interface Citation {
  source: string;
  title: string;
  page_start: number;
  page_end: number;
  chunk_id: string;
  text?: string;
  excerpt?: string;
  is_template_data?: boolean;
  document_id?: string;
}

export interface AIInsights {
  explanation: string;
  recommendation: string;
  key_points: string[];
  citations: Citation[];
  limitations: string[];
  warnings: string[];
  grounding_status: string;
  retrieval_status: string;
  evidence_available: boolean;
  source?: string;
  parsed_query?: Record<string, string | number | boolean | null>;
}

export interface BackendAssessmentResponse {
  id: number;
  fitScore?: number;
  confidence?: 'Low' | 'Medium' | 'High';
  recommendation?: string;
  fit_score: number;
  confidence_level: 'Low' | 'Medium' | 'High';
  rating?: string;
  village: VillageData;
  category?: CategoryData;
  financial?: FinancialData;
  feasibility?: FeasibilityData;
  scheme?: SchemeData;
  ai_insights?: AIInsights;
  competitor_count?: number;
  status?: string;
  created_at?: string;
  project_cost?: number;
  max_loan_amount?: number;
  recommended_project_size?: number;
  capital_input?: number;
}

export interface AssessmentHistoryItem {
  id: number;
  village_name: string;
  category_name: string;
  capital_input: number;
  project_cost: number;
  fit_score: number;
  confidence_level: string;
  scheme_name: string;
  created_at: string;
}

export interface InsightsResponse {
  location: string;
  categories: ReadonlyArray<{
    name: string;
    trend: number;
    sparkline: ReadonlyArray<number>;
    seasonality: string;
  }>;
}

export interface AssessmentResponse {
  fitScore: number;
  confidence: 'Low' | 'Medium' | 'High';
  recommendation: string;
}
