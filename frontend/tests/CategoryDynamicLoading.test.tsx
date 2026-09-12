import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ShellProvider } from '@/lib/shell-context';
import { ArticleCategorySection } from '@/components/discover/ArticleCategorySection';
import { StateInsightsBar } from '@/components/discover/StateInsightsBar';
import type { CategoryDetailsResponse } from '@/lib/api-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/discover',
}));

const mockCategoryResponse: CategoryDetailsResponse = {
  id: 'retail',
  numeric_id: 2,
  name: 'Retail & Kirana',
  slug: 'retail',
  icon_type: 'retail',
  is_seasonal: false,
  demand_trend: 26,
  trend_percent: 26,
  demand_summary: 'Consistent daily consumption of packaged FMCG and provisions.',
  description: 'General provision and grocery stores with rapid stock turnover.',
  capital_bracket: '₹30,000 – ₹1,20,000',
  profit_margin: '12% – 18%',
  feasible_locations_count: 648,
  total_businesses: 293,
  sample_businesses: [
    { id: 1, name: 'Sharma General Store', village_name: 'Kamar' },
    { id: 2, name: 'Verma Kirana & Provisions', village_name: 'Barsana Rural' },
  ],
  applicable_schemes: [
    { id: 1, name: 'PM SVANidhi Micro Credit Scheme', interest_rate: 7 },
  ],
  raw_materials: 'FMCG stock, digital POS billing',
  location: 'Mathura, Uttar Pradesh',
  district_name: 'Mathura',
  state_name: 'Uttar Pradesh',
};

describe('Category Dynamic Loading on Discover Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers dynamic API call when category is clicked and renders DB enterprises', async () => {
    const fetchSpy = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/categories/retail') || url.includes('/api/v1/categories/retail')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategoryResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ location: 'Uttar Pradesh', categories: [] }),
      });
    });
    vi.stubGlobal('fetch', fetchSpy);

    const user = userEvent.setup();
    render(
      <ShellProvider>
        <ArticleCategorySection stateName="Uttar Pradesh" />
      </ShellProvider>
    );

    // Click Retail & Kirana category
    const retailBtn = screen.getByRole('button', { name: /Retail & Kirana category/i });
    await user.click(retailBtn);

    // Verify API fetch was called for /api/categories/retail
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/(v1\/)?categories\/retail/),
        expect.anything()
      );
    });

    // Verify dynamic state is rendered in details panel
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Retail & Kirana' })).toBeInTheDocument();
      expect(screen.getByText(/Sharma General Store/i)).toBeInTheDocument();
      expect(screen.getByText(/Verma Kirana & Provisions/i)).toBeInTheDocument();
      expect(screen.getByText(/Mapped Enterprises/i)).toBeInTheDocument();
    });
  });

  it('StateInsightsBar displays category-specific feasible clusters when selectedCategory is passed', () => {
    render(
      <StateInsightsBar
        selectedState="Uttar Pradesh"
        browsingLocation="Mathura, Uttar Pradesh"
        availableCapital="₹1,00,000"
        selectedCategory={mockCategoryResponse}
      />
    );

    // Category-specific clusters header
    expect(screen.getByText('Retail & Kirana Clusters')).toBeInTheDocument();
    expect(screen.getByText('648')).toBeInTheDocument();
    expect(screen.getByText(/Category Viability Model/i)).toBeInTheDocument();
  });
});
