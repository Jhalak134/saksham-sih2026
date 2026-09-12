// lib/api-client.ts
// Canonical SAKSHAM Frontend API Client
// Connects Next.js Frontend to FastAPI Main Backend (:8000).
// Invariant: Backend calculates deterministically; AI explains; Frontend displays.

const API_BASE =
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_API_URL || process.env?.NEXT_PUBLIC_BACKEND_URL)) ||
  'http://localhost:8000';


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
  return fetchJson<TokenResponse>(`${API_BASE}/api/v1/auth/login`, {
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
  return fetchJson<TokenResponse>(`${API_BASE}/api/v1/auth/signup`, {
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
  return fetchJson<MyReportsResponse>(`${API_BASE}/api/v1/assess/my-reports`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

import type { DetailedReport, ConfidenceLevel, SchemeInfo } from '@/data/reportsData';

// ─── Backend Schema Interfaces (Re-exported from ./api-types) ────────────────
export type * from './api-types';
import type {
  AssessmentRequest, BackendAssessmentResponse, AssessmentHistoryItem,
  InsightsResponse, AssessmentResponse, VillageLocation,
  AIQueryRequest, AIQueryResponse, OfficialScheme,
  EMICalculationRequest, EMICalculationResponse, SchemeMatchRequest, SchemeMatchResponse,
  UserProfile, UserProfileInput,
} from './api-types';

// ─── Base URL Resolution ──────────────────────────────────────────────────────

declare const process: {
  env?: Record<string, string | undefined>;
};

export function getBackendBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, '');
  }
  return 'http://localhost:8000';
}

async function extractErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const errorJson = (await res.json()) as { detail?: string };
    if (errorJson && errorJson.detail) {
      return errorJson.detail;
    }
  } catch {
    // Fallback
  }
  return fallback;
}

// ─── Client Cache & Persistence ───────────────────────────────────────────────

const assessmentCache = new Map<string, BackendAssessmentResponse>();

export function cacheAssessment(response: BackendAssessmentResponse): void {
  if (response && response.id != null) {
    const key = String(response.id);
    assessmentCache.set(key, response);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(`saksham_assess_${key}`, JSON.stringify(response));
      } catch {
        // Safe fallback if sessionStorage is full or unavailable
      }
    }
  }
}

export function getCachedAssessment(id: string | number): BackendAssessmentResponse | null {
  const key = String(id);
  if (assessmentCache.has(key)) {
    return assessmentCache.get(key) || null;
  }
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem(`saksham_assess_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored) as BackendAssessmentResponse;
        assessmentCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // Safe fallback on parse error
    }
  }
  return null;
}

// ─── Core API Methods ─────────────────────────────────────────────────────────

/**
 * Creates a new business assessment on the main backend (POST /api/v1/assess).
 */
export async function createAssessment(
  payload: AssessmentRequest
): Promise<BackendAssessmentResponse> {
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}/api/v1/assess`;

  const body: Record<string, any> = {
    location: payload.location.trim(),
    village_id: payload.village_id,
    category: payload.category.trim(),
    capital: Number(payload.capital),
    idea: payload.idea ? payload.idea.trim() : 'Rural micro-enterprise unit',
    language: payload.language ? payload.language.trim() : 'en',
    phone_or_email: payload.phone_or_email || 'guest_entrepreneur@saksham.gov.in',
  };

  if (payload.village_id) {
    body.village_id = payload.village_id;
  }
  if (payload.location_query) {
    body.location_query = payload.location_query;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await extractErrorDetail(res, `Assessment creation failed with status ${res.status}`);
    throw new Error(detail);
  }

  const data = (await res.json()) as BackendAssessmentResponse;
  cacheAssessment(data);
  return data;
}

/**
 * Retrieves past assessment details by ID from cache or main backend.
 */
export async function getAssessmentById(
  id: string | number
): Promise<BackendAssessmentResponse> {
  const cached = getCachedAssessment(id);
  if (cached) {
    return cached;
  }

  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}/api/v1/assess/${encodeURIComponent(String(id))}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    const detail = await extractErrorDetail(res, `Failed to load assessment #${id} (HTTP ${res.status})`);
    throw new Error(detail);
  }

  const data = (await res.json()) as BackendAssessmentResponse;
  cacheAssessment(data);
  return data;
}

/**
 * Retrieves historical assessments list for the active user.
 */
export async function getAssessmentHistory(
  skip: number = 0,
  limit: number = 50
): Promise<AssessmentHistoryItem[]> {
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}/api/v1/assess/history?skip=${skip}&limit=${limit}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load assessment history (HTTP ${res.status})`);
  }

  return (await res.json()) as AssessmentHistoryItem[];
}

/**
 * Searches Census villages in the active pilot district via GET /api/v1/locations?q=<query>.
 */
export async function searchLocations(
  query: string,
  limit: number = 50
): Promise<VillageLocation[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}/api/v1/locations?q=${encodeURIComponent(cleanQ)}&limit=${limit}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Location search failed (HTTP ${res.status})`);
  }

  return (await res.json()) as VillageLocation[];
}

/**
 * Formats a VillageLocation into a readable label with village name, block, and district.
 */
export function formatVillageLocation(v: VillageLocation): string {
  const blockPart = v.block_name ? `${v.block_name} Block · ` : '';
  return `${v.name}, ${blockPart}${v.district_name}`;
}

/**
 * Sends natural-language query to Main Backend AI Advisory Gateway (POST /api/v1/ai/query).
 * Routes to decoupled AI microservice, returning grounded policy guidance and citations.
 */
export async function queryAI(
  request: AIQueryRequest
): Promise<AIQueryResponse> {
  const cleanQ = request.query.trim();
  if (!cleanQ) {
    throw new Error('Query cannot be empty');
  }

  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}/api/v1/ai/query`;

  const body = {
    query: cleanQ,
    language: request.language || 'en',
    top_k: request.top_k ?? 5,
    calculations: request.calculations || null,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await extractErrorDetail(res, `AI advisory query failed (HTTP ${res.status})`);
    throw new Error(detail);
  }

  return (await res.json()) as AIQueryResponse;
}

// ─── Government Schemes & EMI Calculators ───────────────────────────────────

/**
 * Retrieves all active official concessional credit schemes from backend (GET /api/v1/schemes).
 */
export async function getSchemes(): Promise<OfficialScheme[]> {
  const baseUrl = getBackendBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/schemes`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch official credit schemes (HTTP ${res.status})`);
  }

  return (await res.json()) as OfficialScheme[];
}

/**
 * Retrieves a single official scheme by its ID (GET /api/v1/schemes/{id}).
 */
export async function getSchemeById(id: number): Promise<OfficialScheme> {
  const baseUrl = getBackendBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/schemes/${id}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch scheme ${id} (HTTP ${res.status})`);
  }

  return (await res.json()) as OfficialScheme;
}

/**
 * Deterministic scheme matching via backend (POST /api/v1/schemes/match).
 * Selects Micro Finance vs Term Loan scheme based on 10% available margin.
 */
export async function matchScheme(
  request: SchemeMatchRequest
): Promise<SchemeMatchResponse> {
  if (request.available_margin <= 0) {
    throw new Error('Available margin must be greater than 0');
  }

  const baseUrl = getBackendBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/schemes/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      available_margin: request.available_margin,
      category: request.category || 'Dairy',
    }),
  });

  if (!res.ok) {
    const detail = await extractErrorDetail(res, `Scheme matching failed (HTTP ${res.status})`);
    throw new Error(detail);
  }

  return (await res.json()) as SchemeMatchResponse;
}

/**
 * Calculates reducing-balance EMI via backend financial engine (POST /api/v1/schemes/calculate-emi).
 * Enforces zero frontend financial math.
 */
export async function calculateSchemeEmi(
  request: EMICalculationRequest
): Promise<EMICalculationResponse> {
  if (request.loan_amount <= 0) {
    throw new Error('Loan amount must be greater than 0');
  }

  const baseUrl = getBackendBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/schemes/calculate-emi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      loan_amount: request.loan_amount,
      interest_rate: request.interest_rate,
      tenure_months: request.tenure_months,
      moratorium_months: request.moratorium_months,
    }),
  });

  if (!res.ok) {
    const detail = await extractErrorDetail(res, `EMI calculation failed (HTTP ${res.status})`);
    throw new Error(detail);
  }

  return (await res.json()) as EMICalculationResponse;
}

/**
 * Retrieves hyper-local business category demand trends from backend (GET /api/v1/insights/{location}).
 * Throws on failure to allow explicit error states without silent mock fallback.
 */
export async function getInsights(location: string): Promise<InsightsResponse> {
  const cleanLoc = location.trim();
  if (!cleanLoc) {
    throw new Error('Location query cannot be empty');
  }

  const baseUrl = getBackendBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/insights/${encodeURIComponent(cleanLoc)}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch insights for "${cleanLoc}" (HTTP ${res.status})`);
  }

  return (await res.json()) as InsightsResponse;
}

// ─── Legacy & Backwards-Compatibility Stubs ───────────────────────────────────

export async function fetchAssessment(
  location: string,
  category: string,
  capital: number
): Promise<AssessmentResponse> {
  try {
    const res = await createAssessment({ location, category, capital });
    return {
      fitScore: res.fitScore ?? res.fit_score ?? 0,
      confidence: res.confidence ?? res.confidence_level ?? 'Low',
      recommendation: res.recommendation ?? '',
    };
  } catch {
    return {
      fitScore: 0,
      confidence: 'Low',
      recommendation: '',
    };
  }
}

export async function fetchInsights(location: string): Promise<InsightsResponse> {
  try {
    return await getInsights(location);
  } catch {
    return {
      location: location.trim(),
      categories: [],
    };
  }
}

// ─── Authentication & User Profile ──────────────────────────────────────────

/**
 * Retrieves a user profile by phone number or email (GET /api/v1/auth/profile/{identifier}).
 */
export async function getUserProfile(identifier: string): Promise<UserProfile> {
  const clean = identifier.trim();
  if (!clean) {
    throw new Error('Identifier cannot be empty');
  }

  const baseUrl = getBackendBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/auth/profile/${encodeURIComponent(clean)}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (res.status === 404) {
    throw new Error('Account not found. Please check your mobile number or sign up.');
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile (HTTP ${res.status})`);
  }

  return (await res.json()) as UserProfile;
}

/**
 * Creates or updates a user profile on the backend (POST /api/v1/auth/profile).
 */
export async function saveUserProfile(profile: UserProfileInput): Promise<UserProfile> {
  const clean = profile.phone_or_email.trim();
  if (!clean) {
    throw new Error('Phone or email cannot be empty');
  }

  const baseUrl = getBackendBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/auth/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ...profile,
      phone_or_email: clean,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to save user profile (HTTP ${res.status})`);
  }

  return (await res.json()) as UserProfile;
}

// ─── Response Adapter ─────────────────────────────────────────────────────────

export { mapBackendResponseToDetailedReport } from './report-adapter';
