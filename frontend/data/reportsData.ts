// data/reportsData.ts
// Realistic domain datasets matching approved mockups and SIH Problem Statement #91.

export type AssessmentStatus = 'Completed' | 'In Progress' | 'Saved';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface ReportSummary {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly location: string;
  readonly status: AssessmentStatus;
  readonly date: string;
  readonly estimatedProfit: number;
  readonly breakEvenMonths: number;
  readonly fitScore: number;
  readonly confidence: ConfidenceLevel;
  readonly iconType: 'dairy' | 'mobile' | 'solar' | 'tailoring';
}

export interface CustomerSegment {
  readonly name: string;
  readonly percent: number;
}

export interface RiskItem {
  readonly title: string;
  readonly level: 'Low' | 'Medium' | 'High';
  readonly description?: string;
}

export interface MonthFinancial {
  readonly month: number;
  readonly revenue: number;
  readonly expenses: number;
}

export interface SchemeInfo {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly maxProjectCost: string;
  readonly maxLoan: string;
  readonly interestRate: string;
  readonly tenure: string;
  readonly moratorium: string;
  readonly eligible: boolean;
  readonly reasoning: string;
  readonly highlight?: string;
  readonly documentChecklist: readonly string[];
}

export interface DetailedReport {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly location: string;
  readonly status: AssessmentStatus;
  readonly date: string;
  readonly fitScore: number;
  readonly viabilityLabel: string;
  readonly viabilityDescription: string;
  readonly confidence: ConfidenceLevel;
  readonly breakdown: {
    readonly marketOpportunity: number; // out of 10
    readonly competition: number;
    readonly capitalFit: number;
    readonly supplyRisk: number;
  };
  readonly recommendation: {
    readonly verdict: string;
    readonly recommendedProjectCost: number;
    readonly supportingFactors: readonly string[];
    readonly pointsToConsider: readonly string[];
  };
  readonly keyInsights: readonly string[];
  readonly market: {
    readonly snapshot: {
      readonly totalDemand: string;
      readonly marketSize: string;
      readonly growthTrend: string;
    };
    readonly localSummary: {
      readonly estimatedHouseholds: number;
      readonly mappedCompetitors: number;
      readonly nearbyMarkets: number;
      readonly marketOpportunity: string;
    };
    readonly segments: readonly CustomerSegment[];
    readonly risks: readonly RiskItem[];
  };
  readonly financials: {
    readonly maxEligibility: {
      readonly projectCost: number;
      readonly schemeName: string;
      readonly maxLoanAmount: number;
      readonly loanSharePercent: number;
    };
    readonly suitability: {
      readonly suggestedProjectSize: number;
      readonly ownContribution: number;
      readonly ownContributionPercent: number;
      readonly bankFinance: number;
      readonly bankFinancePercent: number;
      readonly estimatedMonthlyRepayment: number;
      readonly tenureYears: number;
    };
    readonly breakEvenMonths: number;
    readonly breakEvenNote: string;
    readonly monthlyProjections: readonly MonthFinancial[];
  };
  readonly schemes: readonly SchemeInfo[];
  readonly nextSteps: {
    readonly currentStep: number;
    readonly steps: readonly {
      readonly number: number;
      readonly title: string;
      readonly status: 'done' | 'current' | 'upcoming';
    }[];
    readonly actionItems: readonly {
      readonly id: number;
      readonly title: string;
      readonly description: string;
    }[];
    readonly initialNotes: string;
  };
}

export const MOCK_REPORTS: readonly ReportSummary[] = [
  {
    id: 'assess_001',
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
    id: 'assess_002',
    title: 'Mobile Repair Shop',
    category: 'Retail',
    location: 'Kheragarh, Agra',
    status: 'In Progress',
    date: '5 Aug 2025',
    estimatedProfit: 12000,
    breakEvenMonths: 14,
    fitScore: 62,
    confidence: 'Medium',
    iconType: 'mobile',
  },
  {
    id: 'assess_003',
    title: 'Solar Equipment Retail',
    category: 'Retail',
    location: 'Etawah, Uttar Pradesh',
    status: 'Completed',
    date: '3 Aug 2025',
    estimatedProfit: 52000,
    breakEvenMonths: 14,
    fitScore: 72,
    confidence: 'High',
    iconType: 'solar',
  },
  {
    id: 'assess_004',
    title: 'Tailoring Unit',
    category: 'Textiles',
    location: 'Etawah, Uttar Pradesh',
    status: 'Saved',
    date: '28 Jul 2025',
    estimatedProfit: 18000,
    breakEvenMonths: 10,
    fitScore: 65,
    confidence: 'Low',
    iconType: 'tailoring',
  },
];

export const DETAILED_REPORT_001: DetailedReport = {
  id: 'assess_001',
  title: 'Dairy Processing Unit',
  category: 'Dairy',
  location: 'Kheragarh, Agra',
  status: 'Completed',
  date: '12 Aug 2025',
  fitScore: 78,
  viabilityLabel: 'Viable Opportunity',
  viabilityDescription: 'This business idea looks promising for your location and budget.',
  confidence: 'Medium',
  breakdown: {
    marketOpportunity: 7,
    competition: 4,
    capitalFit: 8,
    supplyRisk: 6,
  },
  recommendation: {
    verdict: 'Potentially viable, but consider starting at a smaller scale.',
    recommendedProjectCost: 110000,
    supportingFactors: [
      'Steady local demand',
      'Reasonable government schemes',
      'Existing dairy ecosystem',
    ],
    pointsToConsider: [
      'Moderate competition in local haat',
      'Seasonal demand variation during summer',
      'Initial cold storage infrastructure needs',
    ],
  },
  keyInsights: [
    'Steady local demand: Consistently high demand for milk and dairy products throughout the year.',
    'Nearest processing chiller is 14km away in Fatehabad block.',
  ],
  market: {
    snapshot: {
      totalDemand: 'High',
      marketSize: '₹12–18 lakh',
      growthTrend: 'Growing (+34% YoY)',
    },
    localSummary: {
      estimatedHouseholds: 2480,
      mappedCompetitors: 8,
      nearbyMarkets: 3,
      marketOpportunity: 'High',
    },
    segments: [
      { name: 'Local households', percent: 45 },
      { name: 'Tea shops & eateries', percent: 30 },
      { name: 'Local retail stores', percent: 15 },
      { name: 'Other (institutions, etc.)', percent: 10 },
    ],
    risks: [
      {
        title: 'Feed-price volatility',
        level: 'Medium',
        description: 'Green fodder prices fluctuate seasonally between kharif and rabi.',
      },
      {
        title: 'Seasonal demand variation',
        level: 'Low',
        description: 'Winter peaks during festival and wedding season.',
      },
      {
        title: 'Power infrastructure',
        level: 'Low',
        description: 'Sub-station feeder reliability average 18 hrs/day.',
      },
    ],
  },
  financials: {
    maxEligibility: {
      projectCost: 200000,
      schemeName: 'Term Loan Scheme (SCA/CA)',
      maxLoanAmount: 180000,
      loanSharePercent: 90,
    },
    suitability: {
      suggestedProjectSize: 110000,
      ownContribution: 30000,
      ownContributionPercent: 27,
      bankFinance: 80000,
      bankFinancePercent: 73,
      estimatedMonthlyRepayment: 1980,
      tenureYears: 5,
    },
    breakEvenMonths: 10,
    breakEvenNote: 'Estimated break-even period based on projected cash flows and 10% operating buffer.',
    monthlyProjections: [
      { month: 1, revenue: 14000, expenses: 18000 },
      { month: 2, revenue: 18000, expenses: 17500 },
      { month: 3, revenue: 22000, expenses: 17000 },
      { month: 4, revenue: 26000, expenses: 16500 },
      { month: 5, revenue: 29000, expenses: 16500 },
      { month: 6, revenue: 32000, expenses: 16000 },
      { month: 7, revenue: 35000, expenses: 16000 },
      { month: 8, revenue: 38000, expenses: 15500 },
      { month: 9, revenue: 41000, expenses: 15500 },
      { month: 10, revenue: 44000, expenses: 16000 },
      { month: 11, revenue: 46000, expenses: 16000 },
      { month: 12, revenue: 48000, expenses: 16000 },
    ],
  },
  schemes: [
    {
      id: 'scheme_micro',
      name: 'Micro Finance Scheme (SCA/CA)',
      category: 'Concessional Micro Credit',
      maxProjectCost: 'Up to ₹1.40 lakh',
      maxLoan: 'Up to 90% (max ₹1.25 lakh)',
      interestRate: '6.5% p.a.',
      tenure: '3 years',
      moratorium: '3 months',
      eligible: true,
      reasoning:
        'Your recommended project cost of ₹1,10,000 falls at or below the ₹1.40 lakh threshold, so you qualify for the Micro Finance Scheme.',
      highlight: 'Best match for ₹1.10L recommended project cost',
      documentChecklist: [
        'Aadhaar Card and PAN Card',
        'Passport-size photographs',
        'Proof of residence (village/block address)',
        'Bank account passbook copy',
        'Business project report or equipment quotation',
        'Margin money proof (10% contribution in bank account)',
        'Caste/category certificate, if applicable',
      ],
    },
    {
      id: 'scheme_term',
      name: 'Term Loan Scheme (SCA/CA)',
      category: 'Concessional Medium Enterprise',
      maxProjectCost: '₹1.40 lakh – ₹50 lakh',
      maxLoan: 'Up to 90% (max ₹45 lakh)',
      interestRate: '8.0% p.a.',
      tenure: '7 years',
      moratorium: '6 months',
      eligible: false,
      reasoning:
        "Your recommended project cost of ₹1,10,000 is below the ₹1.40 lakh minimum for the Term Loan Scheme, so it isn't applicable at your current scale.",
      highlight: 'Applicable if project size exceeds ₹1.40 lakh',
      documentChecklist: [
        'Aadhaar Card and PAN Card',
        'Detailed project report (DPR)',
        'Proof of residence and business address',
        'Bank account statements (last 6 months)',
        'Margin money proof (10% contribution in bank account)',
        'Collateral / security documents, where required',
      ],
    },
  ],
  nextSteps: {
    currentStep: 2,
    steps: [
      { number: 1, title: 'Exploring', status: 'done' },
      { number: 2, title: 'Applied for scheme', status: 'current' },
      { number: 3, title: 'Business started', status: 'upcoming' },
    ],
    actionItems: [
      {
        id: 1,
        title: 'Refine your business plan',
        description: 'Review unit economics and monthly working capital needs with your local block officer.',
      },
      {
        id: 2,
        title: 'Explore funding options',
        description: 'Verify 10% margin capital availability (₹30,000) before submitting scheme paperwork.',
      },
      {
        id: 3,
        title: 'Talk to local experts',
        description: 'Connect with veterinary extension officers in Kheragarh regarding quality cattle breed selection.',
      },
    ],
    initialNotes: 'Met with dairy cooperative secretary in Kheragarh market. They can purchase surplus morning collection at ₹38/litre.',
  },
};

export function getReportById(id: string): DetailedReport {
  // In future Track 13, this queries the backend API.
  if (id === 'assess_001' || !id) {
    return DETAILED_REPORT_001;
  }
  const summary = MOCK_REPORTS.find((r) => r.id === id);
  if (!summary) {
    return DETAILED_REPORT_001;
  }
  // Construct detailed view dynamically from summary
  return {
    ...DETAILED_REPORT_001,
    id: summary.id,
    title: summary.title,
    category: summary.category,
    location: summary.location,
    status: summary.status,
    date: summary.date,
    fitScore: summary.fitScore,
    confidence: summary.confidence,
    financials: {
      ...DETAILED_REPORT_001.financials,
      breakEvenMonths: summary.breakEvenMonths,
    },
  };
}