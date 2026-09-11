// data/compareData.ts
// Compare data types and mock dataset for side-by-side opportunity comparison.

export type DemandLevel = 'High' | 'Medium' | 'Low';
export type BudgetFitStatus = 'Good fit' | 'Moderate fit' | 'Needs loan';

export interface CategoryComparisonData {
  readonly category: string;
  readonly tagline: string;
  readonly badgeLabel: string;
  readonly badgeType: 'blue' | 'green' | 'amber' | 'neutral';
  readonly trendPercent: number;
  readonly trendDirection: 'up' | 'down';
  readonly sparkline: readonly number[];
  readonly demandLevel: DemandLevel;
  readonly budgetFit: BudgetFitStatus;
  readonly typicalSetupCost: string;
  readonly whyConsider: string;
  readonly iconType: 'Cow' | 'Factory' | 'Loom' | 'Shop' | 'Truck' | 'Sprout';
  readonly monthlyTrends: readonly number[];
}

export interface MonthlyDataPoint {
  readonly month: string;
  readonly value1: number;
  readonly value2: number;
}

export const MONTH_LABELS: readonly string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const CATEGORY_COMPARISONS: Record<string, CategoryComparisonData> = {
  Dairy: {
    category: 'Dairy',
    tagline: 'Milk, milk products, and allied businesses.',
    badgeLabel: 'High demand',
    badgeType: 'blue',
    trendPercent: 34,
    trendDirection: 'up',
    sparkline: [10, 14, 18, 22, 28, 34],
    demandLevel: 'High',
    budgetFit: 'Good fit',
    typicalSetupCost: '₹50,000 – ₹2,00,000',
    whyConsider:
      'Consistent demand for milk and dairy products in rural and semi-urban areas.',
    iconType: 'Cow',
    monthlyTrends: [25, 32, 35, 55, 50, 60, 58, 70, 80, 75, 80, 95],
  },
  'Food Processing': {
    category: 'Food Processing',
    tagline: 'Value addition in agri and food products.',
    badgeLabel: 'Growing',
    badgeType: 'blue',
    trendPercent: 15,
    trendDirection: 'up',
    sparkline: [4, 6, 8, 10, 13, 15],
    demandLevel: 'Medium',
    budgetFit: 'Good fit',
    typicalSetupCost: '₹30,000 – ₹1,50,000',
    whyConsider:
      'Helps reduce post-harvest losses and creates value from local agricultural produce.',
    iconType: 'Factory',
    monthlyTrends: [12, 20, 22, 30, 28, 36, 35, 48, 45, 48, 50, 62],
  },
  Textiles: {
    category: 'Textiles',
    tagline: 'Handlooms, garments, and textile products.',
    badgeLabel: 'Growing',
    badgeType: 'blue',
    trendPercent: 21,
    trendDirection: 'up',
    sparkline: [5, 8, 12, 15, 18, 21],
    demandLevel: 'High',
    budgetFit: 'Good fit',
    typicalSetupCost: '₹40,000 – ₹1,80,000',
    whyConsider:
      'Strong artisan heritage with growing domestic and e-commerce market demand.',
    iconType: 'Loom',
    monthlyTrends: [18, 22, 28, 32, 38, 45, 42, 52, 58, 62, 68, 72],
  },
  Retail: {
    category: 'Retail',
    tagline: 'Kirana, FMCG, and rural retail opportunities.',
    badgeLabel: 'Stable',
    badgeType: 'neutral',
    trendPercent: -8,
    trendDirection: 'down',
    sparkline: [10, 8, 6, 4, 2, -8],
    demandLevel: 'Medium',
    budgetFit: 'Good fit',
    typicalSetupCost: '₹25,000 – ₹1,00,000',
    whyConsider:
      'High footfall and recurring daily essentials demand in village market clusters.',
    iconType: 'Shop',
    monthlyTrends: [40, 42, 45, 43, 41, 39, 44, 42, 40, 38, 37, 36],
  },
  Logistics: {
    category: 'Logistics',
    tagline: 'Transport, storage, and supply chain services.',
    badgeLabel: 'Emerging',
    badgeType: 'blue',
    trendPercent: 12,
    trendDirection: 'up',
    sparkline: [2, 4, 6, 8, 10, 12],
    demandLevel: 'Medium',
    budgetFit: 'Needs loan',
    typicalSetupCost: '₹80,000 – ₹3,00,000',
    whyConsider:
      'Rising demand for last-mile delivery and localized agricultural produce hauling.',
    iconType: 'Truck',
    monthlyTrends: [15, 18, 22, 25, 29, 32, 36, 40, 43, 47, 52, 56],
  },
  Agriculture: {
    category: 'Agriculture',
    tagline: 'Farming, inputs, and agri-services.',
    badgeLabel: 'Opportunity',
    badgeType: 'green',
    trendPercent: 18,
    trendDirection: 'up',
    sparkline: [5, 7, 10, 12, 15, 18],
    demandLevel: 'High',
    budgetFit: 'Good fit',
    typicalSetupCost: '₹35,000 – ₹1,60,000',
    whyConsider:
      'Direct value addition from local farm produce with government subsidy support.',
    iconType: 'Sprout',
    monthlyTrends: [30, 35, 42, 48, 52, 58, 54, 62, 66, 70, 74, 78],
  },
};

export const DEFAULT_COMPARE_CATEGORIES: readonly [string, string] = [
  'Dairy',
  'Food Processing',
] as const;

export function getCategoryComparison(name: string): CategoryComparisonData {
  if (name in CATEGORY_COMPARISONS) {
    return CATEGORY_COMPARISONS[name];
  }
  return {
    category: name,
    tagline: `${name} business opportunity in your area.`,
    badgeLabel: 'Growing',
    badgeType: 'blue',
    trendPercent: 10,
    trendDirection: 'up',
    sparkline: [4, 6, 8, 10, 12, 14],
    demandLevel: 'Medium',
    budgetFit: 'Good fit',
    typicalSetupCost: '₹40,000 – ₹1,50,000',
    whyConsider: 'Strong regional potential with sustained local consumer interest.',
    iconType: 'Sprout',
    monthlyTrends: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
  };
}
