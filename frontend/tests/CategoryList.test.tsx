import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { CategoryList } from '@/components/discover/CategoryList';
import type { CategoryRow } from '@/lib/discover-types';

const ROWS: CategoryRow[] = [
  {
    category: 'Dairy',
    trendPercent: 34,
    direction: 'up',
    tag: 'Market',
    withinBudget: true,
    bookmarked: false,
    sparkline: [10, 14, 18, 22, 28, 34],
    icon: 'Milk',
    description: 'Milk and milk products.',
  },
  {
    category: 'Textiles',
    trendPercent: 21,
    direction: 'up',
    tag: 'Demand',
    withinBudget: true,
    bookmarked: false,
    sparkline: [5, 8, 12, 15, 18, 21],
    icon: 'Scissors',
    description: 'Handlooms and garments.',
  },
];

describe('CategoryList', () => {
  it('renders section heading', () => {
    render(
      <CategoryList categories={ROWS} comparedCategories={new Set()} onCompareToggle={vi.fn()} />
    );
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('renders a card for each category', () => {
    render(
      <CategoryList categories={ROWS} comparedCategories={new Set()} onCompareToggle={vi.fn()} />
    );
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Textiles')).toBeInTheDocument();
  });

  it('renders "See all" link', () => {
    render(
      <CategoryList categories={ROWS} comparedCategories={new Set()} onCompareToggle={vi.fn()} />
    );
    expect(screen.getByText(/See all/)).toBeInTheDocument();
  });

  it('calls onCompareToggle when a category card is clicked', async () => {
    const user = userEvent.setup();
    const onCompareToggle = vi.fn();
    render(
      <CategoryList
        categories={ROWS}
        comparedCategories={new Set()}
        onCompareToggle={onCompareToggle}
      />
    );
    await user.click(screen.getByText('Dairy'));
    expect(onCompareToggle).toHaveBeenCalledWith('Dairy');
  });

  it('renders an empty list without crashing', () => {
    render(
      <CategoryList categories={[]} comparedCategories={new Set()} onCompareToggle={vi.fn()} />
    );
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });
});
