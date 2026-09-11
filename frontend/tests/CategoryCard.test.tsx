import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CategoryCard } from '@/components/discover/CategoryCard';
import type { CategoryRow } from '@/lib/discover-types';

const ROW: CategoryRow = {
  category: 'Dairy',
  trendPercent: 34,
  direction: 'up',
  tag: 'Market',
  withinBudget: true,
  bookmarked: false,
  sparkline: [10, 14, 18, 22, 28, 34],
  icon: 'Milk',
  description: 'Milk, milk products, and allied businesses.',
};

function renderCard(overrides: Partial<CategoryRow> = {}, props: object = {}) {
  return render(
    <CategoryCard
      row={{ ...ROW, ...overrides }}
      isCompared={false}
      onCompareToggle={vi.fn()}
      onBookmarkToggle={vi.fn()}
      onClick={vi.fn()}
      {...props}
    />
  );
}

describe('CategoryCard', () => {
  it('renders category name', () => {
    renderCard();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });

  it('renders description', () => {
    renderCard();
    expect(screen.getByText(/Milk, milk products/)).toBeInTheDocument();
  });

  it('renders trend percentage', () => {
    renderCard();
    expect(screen.getByText(/34%/)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CategoryCard
        row={ROW}
        isCompared={false}
        onCompareToggle={vi.fn()}
        onBookmarkToggle={vi.fn()}
        onClick={onClick}
      />
    );
    await user.click(screen.getByText('Dairy'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders sparkline SVG', () => {
    const { container } = renderCard();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('calls onBookmarkToggle when bookmark button is clicked', async () => {
    const user = userEvent.setup();
    const onBookmarkToggle = vi.fn();
    render(
      <CategoryCard
        row={ROW}
        isCompared={false}
        onCompareToggle={vi.fn()}
        onBookmarkToggle={onBookmarkToggle}
        onClick={vi.fn()}
      />
    );
    const bookmarkBtn = screen.getByRole('button', { name: /Save Dairy category/i });
    await user.click(bookmarkBtn);
    expect(onBookmarkToggle).toHaveBeenCalledOnce();
  });
});
