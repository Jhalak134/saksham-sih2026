// lib/api-client.ts
// HTTP client stubs — real endpoints wired in Part 13.
// Each function returns the documented response shape with fake data so
// Parts 3–7 can be built against the correct contract.

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

export async function fetchInsights(location: string): Promise<InsightsResponse> {
  // Placeholder — returns fake data shaped like the real API response.
  return Promise.resolve({
    location,
    categories: [],
  });
}

export async function fetchAssessment(
  location: string,
  category: string,
  capital: number
): Promise<AssessmentResponse> {
  // Placeholder — returns fake data shaped like the real API response.
  void location;
  void category;
  void capital;
  return Promise.resolve({
    fitScore: 0,
    confidence: 'Low',
    recommendation: '',
  });
}
