// components/saved/saved-data.ts
import type { CategoryRow } from '@/lib/discover-types';

export const INITIAL_SAVED_CATEGORIES: readonly CategoryRow[] = [
  {
    category: 'Dairy',
    description: 'Milk, milk products, and allied businesses.',
    trendPercent: 34,
    direction: 'up',
    tag: 'High demand',
    withinBudget: true,
    bookmarked: true,
    sparkline: [20, 24, 22, 28, 30, 34],
    icon: 'Cow',
  },
  {
    category: 'Tailoring & Garments',
    description: 'Clothing, stitching, and textile products.',
    trendPercent: 21,
    direction: 'up',
    tag: 'Growing',
    withinBudget: true,
    bookmarked: true,
    sparkline: [15, 17, 16, 19, 20, 21],
    icon: 'Sewing',
  },
  {
    category: 'Retail Store',
    description: 'Kirana, FMCG, and rural retail opportunities.',
    trendPercent: 12,
    direction: 'up',
    tag: 'Stable',
    withinBudget: true,
    bookmarked: true,
    sparkline: [10, 11, 11, 12, 11, 12],
    icon: 'Shop',
  },
  {
    category: 'Food Processing',
    description: 'Value addition in agri and food products.',
    trendPercent: 15,
    direction: 'up',
    tag: 'Growing',
    withinBudget: true,
    bookmarked: true,
    sparkline: [12, 13, 14, 13, 15, 15],
    icon: 'Factory',
  },
];
