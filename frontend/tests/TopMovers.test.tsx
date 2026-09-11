import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TopMovers } from '@/components/discover/TopMovers';
import type { TopMover } from '@/lib/discover-types';

const MOVERS: TopMover[] = [
  { category: 'Dairy', trendPercent: 34, direction: 'up', sparkline: [10, 14, 18, 22, 28, 34], label: 'High demand' },
  { category: 'Textiles', trendPercent: 21, direction: 'up', sparkline: [5, 8, 12, 15, 18, 21], label: 'Growing' },
  { category: 'Retail', trendPercent: 8, direction: 'down', sparkline: [10, 8, 6, 4, 2, 1], label: 'Stable' },
];

describe('TopMovers', () => {
  it('renders the section heading with scope', () => {
    render(<TopMovers movers={MOVERS} scope="India" />);
    expect(screen.getByText(/Top Movers · India/)).toBeInTheDocument();
  });

  it('renders a card for each mover', () => {
    render(<TopMovers movers={MOVERS} scope="India" />);
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Textiles')).toBeInTheDocument();
    expect(screen.getByText('Retail')).toBeInTheDocument();
  });

  it('renders each mover label', () => {
    render(<TopMovers movers={MOVERS} scope="India" />);
    expect(screen.getByText('High demand')).toBeInTheDocument();
    expect(screen.getByText('Growing')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('renders "See all" button when onSeeAll is provided', () => {
    render(<TopMovers movers={MOVERS} scope="India" onSeeAll={vi.fn()} />);
    expect(screen.getByText(/See all/)).toBeInTheDocument();
  });

  it('does not render "See all" when onSeeAll is omitted', () => {
    render(<TopMovers movers={MOVERS} scope="India" />);
    expect(screen.queryByText(/See all/)).toBeNull();
  });

  it('calls onSeeAll when "See all" is clicked', async () => {
    const user = userEvent.setup();
    const onSeeAll = vi.fn();
    render(<TopMovers movers={MOVERS} scope="India" onSeeAll={onSeeAll} />);
    await user.click(screen.getByText(/See all/));
    expect(onSeeAll).toHaveBeenCalledOnce();
  });

  it('updates scope label when scope prop changes', () => {
    const { rerender } = render(<TopMovers movers={MOVERS} scope="India" />);
    expect(screen.getByText(/Top Movers · India/)).toBeInTheDocument();
    rerender(<TopMovers movers={MOVERS} scope="Uttar Pradesh" />);
    expect(screen.getByText(/Top Movers · Uttar Pradesh/)).toBeInTheDocument();
  });

  it('renders an empty list without crashing', () => {
    render(<TopMovers movers={[]} scope="India" />);
    expect(screen.getByRole('heading', { level: 2, hidden: true })).toBeDefined();
  });
});
