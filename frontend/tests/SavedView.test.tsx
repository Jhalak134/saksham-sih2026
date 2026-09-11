import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ShellProvider } from '@/lib/shell-context';
import { SavedView } from '@/components/saved/SavedView';
import { SavedCategoryCard } from '@/components/saved/SavedCategoryCard';
import { ExploreBanner } from '@/components/saved/ExploreBanner';
import { EmptySavedState } from '@/components/saved/EmptySavedState';
import { INITIAL_SAVED_CATEGORIES } from '@/components/saved/saved-data';

function renderSavedView(): void {
  render(
    <ShellProvider>
      <SavedView />
    </ShellProvider>
  );
}

describe('SavedView — Filled State', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders page header and subtitle', () => {
    renderSavedView();
    expect(screen.getByRole('heading', { level: 1, name: 'Saved' })).toBeInTheDocument();
    expect(screen.getByText('Categories you’ve bookmarked to revisit.')).toBeInTheDocument();
  });

  it('renders all default saved category cards', () => {
    renderSavedView();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Tailoring & Garments')).toBeInTheDocument();
    expect(screen.getByText('Retail Store')).toBeInTheDocument();
    expect(screen.getByText('Food Processing')).toBeInTheDocument();
  });

  it('renders growth metrics and tag badges', () => {
    renderSavedView();
    expect(screen.getByText('34%')).toBeInTheDocument();
    expect(screen.getByText('21%')).toBeInTheDocument();
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('High demand')).toBeInTheDocument();
    expect(screen.getAllByText('Growing')).toHaveLength(2);
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('renders Explore More banner', () => {
    renderSavedView();
    expect(screen.getByText('Explore more opportunities')).toBeInTheDocument();
    expect(
      screen.getByText('Find more business ideas and save the ones that interest you.')
    ).toBeInTheDocument();
  });

  it('sorts categories by name A-Z and Z-A', async () => {
    renderSavedView();
    const sortSelect = screen.getByLabelText('Sort saved categories');

    await userEvent.selectOptions(sortSelect, 'name-asc');
    const headingsAsc = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headingsAsc).toEqual(['Dairy', 'Food Processing', 'Retail Store', 'Tailoring & Garments']);

    await userEvent.selectOptions(sortSelect, 'name-desc');
    const headingsDesc = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headingsDesc).toEqual(['Tailoring & Garments', 'Retail Store', 'Food Processing', 'Dairy']);
  });

  it('removes item when bookmark toggle is clicked', async () => {
    renderSavedView();
    expect(screen.getByText('Dairy')).toBeInTheDocument();

    const dairyRemoveBtn = screen.getByRole('button', { name: 'Remove Dairy from saved' });
    await userEvent.click(dairyRemoveBtn);

    expect(screen.queryByText('Dairy')).not.toBeInTheDocument();
  });

  it('switches to empty state when all saved items are removed', async () => {
    renderSavedView();
    for (const item of INITIAL_SAVED_CATEGORIES) {
      const btn = screen.getByRole('button', { name: `Remove ${item.category} from saved` });
      await userEvent.click(btn);
    }

    expect(screen.getByText('You haven’t saved any categories yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Browse through opportunities and bookmark the ones you want to revisit later.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse categories/i })).toBeInTheDocument();
  });
});

describe('SavedView — LocalStorage handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads saved categories from localStorage if present', () => {
    const customList = [
      {
        category: 'Dairy',
        description: 'Milk and cheese',
        trendPercent: 40,
        direction: 'up' as const,
        tag: 'High demand',
        withinBudget: true,
        bookmarked: true,
        sparkline: [10, 20, 30, 40],
        icon: 'Cow',
      },
    ];
    localStorage.setItem('saksham_saved_categories', JSON.stringify(customList));

    renderSavedView();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.queryByText('Tailoring & Garments')).not.toBeInTheDocument();
  });

  it('handles corrupted localStorage data gracefully', () => {
    localStorage.setItem('saksham_saved_categories', 'not-a-valid-json');
    renderSavedView();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });
});

describe('EmptySavedState component', () => {
  it('renders illustration, heading, description, and link to /discover', () => {
    render(<EmptySavedState />);
    expect(screen.getByText('You haven’t saved any categories yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse categories/i })).toHaveAttribute('href', '/discover');
  });
});

describe('ExploreBanner component', () => {
  it('renders banner and browse links', () => {
    render(<ExploreBanner />);
    expect(screen.getByText('Explore more opportunities')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: /Browse categories/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/discover');
  });
});
