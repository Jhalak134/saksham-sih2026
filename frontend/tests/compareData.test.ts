import { describe, it, expect } from 'vitest';
import {
  CATEGORY_COMPARISONS,
  DEFAULT_COMPARE_CATEGORIES,
  getCategoryComparison,
  MONTH_LABELS,
} from '@/data/compareData';

describe('compareData', () => {
  it('contains DEFAULT_COMPARE_CATEGORIES with Dairy and Food Processing', () => {
    expect(DEFAULT_COMPARE_CATEGORIES).toEqual(['Dairy', 'Food Processing']);
  });

  it('contains 12 month labels', () => {
    expect(MONTH_LABELS.length).toBe(12);
    expect(MONTH_LABELS[0]).toBe('Jan');
    expect(MONTH_LABELS[11]).toBe('Dec');
  });

  it('returns valid comparison data for known categories', () => {
    const dairy = getCategoryComparison('Dairy');
    expect(dairy.category).toBe('Dairy');
    expect(dairy.trendPercent).toBe(34);
    expect(dairy.demandLevel).toBe('High');
    expect(dairy.monthlyTrends.length).toBe(12);

    const food = getCategoryComparison('Food Processing');
    expect(food.category).toBe('Food Processing');
    expect(food.trendPercent).toBe(15);
    expect(food.demandLevel).toBe('Medium');
  });

  it('returns fallback data for unknown categories', () => {
    const custom = getCategoryComparison('Handmade Pottery');
    expect(custom.category).toBe('Handmade Pottery');
    expect(custom.demandLevel).toBe('Medium');
    expect(custom.budgetFit).toBe('Good fit');
    expect(custom.monthlyTrends.length).toBe(12);
  });
});
