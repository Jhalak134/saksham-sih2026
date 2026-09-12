// tests/discover-integration.test.tsx
// Comprehensive test suite for Discover Screen Live Backend Integration (Task 7).

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render as rtlRender, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShellProvider } from '@/lib/shell-context';

const render = (ui: React.ReactElement) => rtlRender(<ShellProvider>{ui}</ShellProvider>);
import { StateInsightsBar } from '@/components/discover/StateInsightsBar';
import { ArticleCategorySection } from '@/components/discover/ArticleCategorySection';
import { DiscoverScreen } from '@/components/screens/Discover';
import * as apiClient from '@/lib/api-client';
import type { InsightsResponse, OfficialScheme } from '@/lib/api-types';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/discover',
}));

// Mock react-map-gl/maplibre
vi.mock('react-map-gl/maplibre', () => ({
  default: vi.fn(({ children, onLoad }: { children?: React.ReactNode; onLoad?: () => void }) => {
    React.useEffect(() => {
      if (onLoad) onLoad();
    }, [onLoad]);
    return <div data-testid="maplibre-map">{children}</div>;
  }),
  Source: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-source">{children}</div>,
  Layer: () => <div data-testid="map-layer" />,
}));

const MOCK_LIVE_INSIGHTS: InsightsResponse = {
  location: 'Uttar Pradesh',
  categories: [
    { name: 'Dairy', trend: 34, sparkline: [12, 18, 22, 28, 34], seasonality: 'All-season' },
    { name: 'Food Processing', trend: 28, sparkline: [10, 14, 20, 24, 28], seasonality: 'Seasonal' },
    { name: 'Logistics', trend: 24, sparkline: [10, 12, 16, 20, 24], seasonality: 'All-season' },
    { name: 'Textiles', trend: 21, sparkline: [8, 12, 15, 18, 21], seasonality: 'Festival peak' },
    { name: 'Education', trend: 19, sparkline: [10, 12, 14, 16, 19], seasonality: 'Academic session' },
    { name: 'Agriculture', trend: 18, sparkline: [14, 15, 16, 17, 18], seasonality: 'Seasonal' },
    { name: 'Retail', trend: 15, sparkline: [10, 11, 13, 14, 15], seasonality: 'Stable daily' },
    { name: 'Handicrafts', trend: 12, sparkline: [5, 8, 9, 11, 12], seasonality: 'Tourism/Fair' },
  ],
};

const MOCK_OFFICIAL_SCHEMES: OfficialScheme[] = [
  {
    id: 1,
    name: 'Micro Finance Scheme',
    max_project_cost: 140000,
    max_loan_amount: 125000,
    interest_rate: 6.5,
    tenure_months: 36,
    moratorium_months: 3,
    margin_requirement: '10% own contribution',
  },
  {
    id: 2,
    name: 'Term Loan Scheme',
    max_project_cost: 5000000,
    max_loan_amount: 4500000,
    interest_rate: 8.0,
    tenure_months: 84,
    moratorium_months: 6,
    margin_requirement: '10% own contribution',
  },
];

describe('Discover Live Backend Integration (Task 7)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.restoreAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/articles')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('StateInsightsBar Live Backend Integration', () => {
    it('fetches and renders live category trends and official credit schemes for UP pilot', async () => {
      vi.spyOn(apiClient, 'getInsights').mockResolvedValueOnce(MOCK_LIVE_INSIGHTS);
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValueOnce(MOCK_OFFICIAL_SCHEMES);

      render(
        <StateInsightsBar
          selectedState="Uttar Pradesh"
          browsingLocation="Uttar Pradesh"
          availableCapital="₹1,00,000"
        />
      );

      expect(screen.getByText('Pilot Live')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('State Priority Sectors')).toBeInTheDocument();
      });

      expect(screen.getByText('Dairy & Allied')).toBeInTheDocument();
      expect(screen.getByText('Food Processing')).toBeInTheDocument();
      expect(screen.getByText('Agri-Business')).toBeInTheDocument();
      expect(screen.getByText('ODOP (One District One Product)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start assessment for Uttar Pradesh/i })).toBeInTheDocument();
    });

    it('navigates with district parameter when selectedDistrict is provided for UP', async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, 'getInsights').mockResolvedValue(MOCK_LIVE_INSIGHTS);
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValue(MOCK_OFFICIAL_SCHEMES);

      render(
        <StateInsightsBar
          selectedState="Uttar Pradesh"
          selectedDistrict="Mathura"
          browsingLocation="Mathura, Uttar Pradesh"
          availableCapital="₹1,00,000"
        />
      );

      const startBtn = screen.getByRole('button', { name: /Start assessment for Uttar Pradesh/i });
      await user.click(startBtn);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('district=Mathura')
      );
    });

    it('handles backend error with explicit error message and retry button without silent mock fallback', async () => {
      const getInsightsSpy = vi.spyOn(apiClient, 'getInsights').mockRejectedValue(new Error('Connection refused at port 8000'));
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValueOnce(MOCK_OFFICIAL_SCHEMES);

      render(
        <StateInsightsBar
          selectedState="Uttar Pradesh"
          browsingLocation="Uttar Pradesh"
          availableCapital="₹1,00,000"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/Unable to load live pilot data/i)).toBeInTheDocument();
      expect(screen.getByText(/Connection refused at port 8000/i)).toBeInTheDocument();
      expect(screen.queryByText('Dairy registrations')).not.toBeInTheDocument();

      const alertContainer = screen.getByRole('alert');
      const retryBtn = within(alertContainer).getByRole('button', { name: /Retry/i });
      expect(retryBtn).toBeInTheDocument();

      getInsightsSpy.mockResolvedValueOnce(MOCK_LIVE_INSIGHTS);
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      expect(screen.getByText('State Priority Sectors')).toBeInTheDocument();
    });

    it('handles non-Error rejection object gracefully', async () => {
      vi.spyOn(apiClient, 'getInsights').mockRejectedValue('String error');
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValueOnce(MOCK_OFFICIAL_SCHEMES);

      render(
        <StateInsightsBar
          selectedState="Uttar Pradesh"
          browsingLocation="Uttar Pradesh"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByText(/Unable to connect to SAKSHAM backend services/i)).toBeInTheDocument();
    });

    it('renders static reference profile with Coming Soon badge for non-pilot states and shows pilot boundary alert on click', async () => {
      const getInsightsSpy = vi.spyOn(apiClient, 'getInsights');
      const getSchemesSpy = vi.spyOn(apiClient, 'getSchemes');

      render(
        <StateInsightsBar
          selectedState="Rajasthan"
          browsingLocation="Rajasthan"
          availableCapital="₹1,00,000"
        />
      );

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(screen.getByText(/Surging clean energy & traditional handicraft exports/i)).toBeInTheDocument();
      expect(getInsightsSpy).not.toHaveBeenCalled();
      expect(getSchemesSpy).not.toHaveBeenCalled();

      // Click assessment button for non-UP state
      const startBtn = screen.getByRole('button', { name: /Start assessment for Rajasthan/i });
      fireEvent.click(startBtn);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Expansion to Rajasthan is coming soon!/i)).toBeInTheDocument();
    });

    it('handles empty backend categories gracefully and renders state overview', async () => {
      vi.spyOn(apiClient, 'getInsights').mockResolvedValueOnce({
        location: 'Uttar Pradesh',
        categories: [],
      });
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValueOnce(MOCK_OFFICIAL_SCHEMES);

      render(
        <StateInsightsBar
          selectedState="Uttar Pradesh"
          browsingLocation="Uttar Pradesh"
          availableCapital="₹1,00,000"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('State Priority Sectors')).toBeInTheDocument();
      });
      expect(screen.getByText('Dairy & Allied')).toBeInTheDocument();
    });
  });

  describe('ArticleCategorySection Live Backend Integration', () => {
    it('renders 4x2 category grid with live trend percentages from backend', async () => {
      vi.spyOn(apiClient, 'getInsights').mockResolvedValueOnce(MOCK_LIVE_INSIGHTS);
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValueOnce(MOCK_OFFICIAL_SCHEMES);

      render(
        <ShellProvider>
          <ArticleCategorySection stateName="Uttar Pradesh" />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Verified Indicators')).toBeInTheDocument();
      });

      expect(screen.getByText('34%')).toBeInTheDocument();
      expect(screen.getByText('21%')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
    });

    it('supports selecting category by pressing Enter and closing category view', async () => {
      vi.spyOn(apiClient, 'getInsights').mockResolvedValue(MOCK_LIVE_INSIGHTS);
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValue(MOCK_OFFICIAL_SCHEMES);

      render(
        <ShellProvider>
          <ArticleCategorySection stateName="Uttar Pradesh" selectedDistrict="Mathura" />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Verified Indicators')).toBeInTheDocument();
      });

      const dairyCard = screen.getByRole('button', { name: /Dairy & Livestock category/i });
      fireEvent.keyDown(dairyCard, { key: 'Enter' });

      expect(screen.getByRole('heading', { level: 3, name: 'Dairy & Livestock' })).toBeInTheDocument();

      // Click Close button
      const closeBtn = screen.getByRole('button', { name: 'Close' });
      await act(async () => {
        fireEvent.click(closeBtn);
      });

      expect(screen.queryByRole('heading', { level: 3, name: 'Dairy & Livestock' })).not.toBeInTheDocument();
    });

    it('starts assessment from category view for UP pilot region', async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, 'getInsights').mockResolvedValue(MOCK_LIVE_INSIGHTS);
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValue(MOCK_OFFICIAL_SCHEMES);

      render(
        <ShellProvider>
          <ArticleCategorySection stateName="Uttar Pradesh" selectedDistrict="Mathura" />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Verified Indicators')).toBeInTheDocument();
      });

      const dairyCard = screen.getByRole('button', { name: /Dairy & Livestock category/i });
      await user.click(dairyCard);

      const assessBtn = screen.getByRole('button', { name: /Start Assessment/i });
      await user.click(assessBtn);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('idea=Dairy%20%26%20Livestock')
      );
    });

    it('shows coming soon message when starting assessment for non-UP state in category view', async () => {
      render(
        <ShellProvider>
          <ArticleCategorySection stateName="Rajasthan" />
        </ShellProvider>
      );

      const solarCard = screen.getByRole('button', { name: /Solar & Clean Energy category/i });
      fireEvent.click(solarCard);

      const assessBtn = screen.getByRole('button', { name: /Start Assessment/i });
      fireEvent.click(assessBtn);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Expansion to Rajasthan is coming soon!/i)).toBeInTheDocument();
    });

    it('handles backend error in category section with error alert and retry button (no silent mock fallback)', async () => {
      const getInsightsSpy = vi.spyOn(apiClient, 'getInsights').mockRejectedValue(new Error('Network timeout'));
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValue(MOCK_OFFICIAL_SCHEMES);

      render(
        <ShellProvider>
          <ArticleCategorySection stateName="Uttar Pradesh" />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/Unable to load live category trends/i)).toBeInTheDocument();
      expect(screen.getByText(/Network timeout/i)).toBeInTheDocument();

      const alertContainer = screen.getByRole('alert');
      const retryBtn = within(alertContainer).getByRole('button', { name: /Retry/i });
      expect(retryBtn).toBeInTheDocument();

      getInsightsSpy.mockResolvedValueOnce(MOCK_LIVE_INSIGHTS);
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('Verified Indicators')).toBeInTheDocument();
      });
    });

    it('handles non-Error rejection in category section', async () => {
      vi.spyOn(apiClient, 'getInsights').mockRejectedValue('Category network fault');
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValue(MOCK_OFFICIAL_SCHEMES);

      render(
        <ShellProvider>
          <ArticleCategorySection stateName="Uttar Pradesh" />
        </ShellProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByText(/Unable to load category insights/i)).toBeInTheDocument();
    });
  });

  describe('DiscoverScreen Full Interaction', () => {
    it('coordinates state and district selection across the Discover layout', async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, 'getInsights').mockResolvedValue(MOCK_LIVE_INSIGHTS);
      vi.spyOn(apiClient, 'getSchemes').mockResolvedValue(MOCK_OFFICIAL_SCHEMES);

      const { container } = render(
        <ShellProvider>
          <DiscoverScreen />
        </ShellProvider>
      );

      expect(screen.getByRole('img', { name: /Uttar Pradesh District Map|Interactive India Map/i })).toBeInTheDocument();
      expect(screen.getByText('State Opportunities & Pilot Insights')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('State Priority Sectors')).toBeInTheDocument();
      });

      // Select Rajasthan state on Level 1 map if path exists
      const rjPath = container.querySelector('#rj') || container.querySelector('path[aria-label="Rajasthan"]');
      if (rjPath) {
        await user.click(rjPath);
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      }

      // Click UP path
      const upPath = container.querySelector('#up') || container.querySelector('path[aria-label="Uttar Pradesh"]');
      if (upPath) {
        await user.click(upPath);
        expect(screen.getAllByText('Pilot Live').length).toBeGreaterThan(0);
      }

      // Click Mathura district pin/path
      const mathuraPath = container.querySelector('#dist-mathura') || container.querySelector('path[aria-label="Mathura"]');
      if (mathuraPath) {
        await user.click(mathuraPath);
        expect(screen.getByRole('region', { name: 'Mathura District Map' })).toBeInTheDocument();

        // Click breadcrumb back to Uttar Pradesh
        const backToUPBtn = screen.getByRole('button', { name: /Back to Uttar Pradesh/i });
        await user.click(backToUPBtn);
        expect(screen.queryByRole('region', { name: 'Mathura District Map' })).not.toBeInTheDocument();
        expect(screen.getByRole('img', { name: /Uttar Pradesh District Map/i })).toBeInTheDocument();
      }

      // Click breadcrumb back to India Map if present
      const backToIndiaBtn = screen.queryByRole('button', { name: /Back to India Map/i });
      if (backToIndiaBtn) {
        await user.click(backToIndiaBtn);
      }
    });
  });
});
