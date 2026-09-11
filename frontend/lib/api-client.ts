// lib/api-client.ts
// HTTP client for backend integration.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserResponse {
  id: number;
  phone_or_email: string;
  home_location: string | null;
  default_capital: number | null;
  preferred_language: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in_hours: number;
  user: UserResponse;
}

/** Helper to handle JSON fetch with standard error unwrapping. */
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) msg = typeof data.detail === 'string' ? data.detail : data.detail[0]?.msg || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function login(phone_or_email: string, password: string): Promise<TokenResponse> {
  return fetchJson<TokenResponse>(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ phone_or_email, password }),
  });
}

export async function signup(
  phone_or_email: string,
  password: string,
  home_location: string = '',
  preferred_language: string = 'en'
): Promise<TokenResponse> {
  return fetchJson<TokenResponse>(`${API_BASE}/auth/signup`, {
    method: 'POST',
    body: JSON.stringify({ phone_or_email, password, home_location, preferred_language }),
  });
}

export interface ReportSummary {
  id: string;
  category: string;
  location: string;
  date: string;
  fitScore: number;
  estimatedProfit: number;
  status: string;
}

export interface MyReportsResponse {
  reports: ReportSummary[];
}

export async function fetchMyReports(token: string): Promise<MyReportsResponse> {
  return fetchJson<MyReportsResponse>(`${API_BASE}/assess/my-reports`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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
