import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DiscoverScreen } from '@/components/screens/Discover';
import { ShellProvider } from '@/lib/shell-context';
import { StateInsightsBar } from '@/components/discover/StateInsightsBar';
import { ArticleCategorySection } from '@/components/discover/ArticleCategorySection';

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/discover',
}));

// Mock react-map-gl/maplibre
vi.mock('react-map-gl/maplibre', () => {
  return {
    default: vi.fn(({ children, onLoad }: { children?: React.ReactNode; onLoad?: () => void }) => {
      React.useEffect(() => {
        if (onLoad) onLoad();
      }, [onLoad]);
      return <div data-testid="maplibre-map">{children}</div>;
    }),
    Source: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-source">{children}</div>,
    Layer: () => <div data-testid="map-layer" />,
  };
});

describe('Discover Page Layout and Interactions', () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
        })
      )
    );
  });

  it('renders the complete DiscoverScreen with 3-Level Map at Top and Article Section at Bottom', () => {
    render(
      <ShellProvider>
        <DiscoverScreen />
      </ShellProvider>
    );

    // Top Section: UP District Map / 3-Level Map
    expect(screen.getByRole('img', { name: /Uttar Pradesh District Map|Interactive India Map/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Uttar Pradesh/i).length).toBeGreaterThan(0);

    // Bottom Section: Live News & categories
    expect(screen.getByText(/News · Uttar Pradesh/i)).toBeInTheDocument();
    expect(screen.getByText(/Textiles & Handloom/i)).toBeInTheDocument();
    expect(screen.getByText(/Retail & Kirana/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Agri Processing/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Food & Beverages/i)).toBeInTheDocument();
    expect(screen.getByText(/Dairy & Livestock/i)).toBeInTheDocument();
    expect(screen.getByText(/Solar & Clean Energy/i)).toBeInTheDocument();
  });

  describe('StateInsightsBar (Start Assessment Pilot Rule)', () => {
    it('allows starting assessment when state is Uttar Pradesh', async () => {
      const user = userEvent.setup();
      render(
        <StateInsightsBar
          selectedState="Uttar Pradesh"
          browsingLocation="Uttar Pradesh"
          availableCapital="₹1,00,000"
        />
      );

      const startBtn = screen.getByRole('button', { name: /Start assessment for Uttar Pradesh/i });
      await user.click(startBtn);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('state=Uttar%20Pradesh')
      );
    });

    it('shows coming soon message when state is not Uttar Pradesh', async () => {
      const user = userEvent.setup();
      render(
        <StateInsightsBar
          selectedState="Rajasthan"
          browsingLocation="Rajasthan"
          availableCapital="₹1,00,000"
        />
      );

      const startBtn = screen.getByRole('button', { name: /Start assessment for Rajasthan/i });
      await user.click(startBtn);

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Expansion to Rajasthan is coming soon/i)).toBeInTheDocument();
    });
  });

  describe('ArticleCategorySection (Single Slideable News + 4X2 Category Grid)', () => {
    it('shows all 8 business categories in a clean 4X2 grid without see all button', () => {
      render(
        <ShellProvider>
          <ArticleCategorySection stateName="Uttar Pradesh" />
        </ShellProvider>
      );

      // All 8 categories are rendered directly in the 4X2 grid
      expect(screen.getByText(/Textiles & Handloom/i)).toBeInTheDocument();
      expect(screen.getByText(/Retail & Kirana/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Agri Processing/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Food & Beverages/i)).toBeInTheDocument();
      expect(screen.getByText(/Dairy & Livestock/i)).toBeInTheDocument();
      expect(screen.getByText(/Solar & Clean Energy/i)).toBeInTheDocument();
      expect(screen.getByText(/Handicrafts & Pottery/i)).toBeInTheDocument();
      expect(screen.getByText(/Services & Repairs/i)).toBeInTheDocument();

      // No See all button exists
      expect(screen.queryByRole('button', { name: /See all categories/i })).not.toBeInTheDocument();
    });

    it('clicking a category card shows that category info in the left space', async () => {
      const user = userEvent.setup();
      render(
        <ShellProvider>
          <ArticleCategorySection stateName="Uttar Pradesh" />
        </ShellProvider>
      );

      // Default left area shows live news section
      expect(screen.getByText(/News · Uttar Pradesh/i)).toBeInTheDocument();

      // Click on "Textiles & Handloom" category
      const textilesCard = screen.getByRole('button', { name: /Textiles & Handloom category/i });
      await user.click(textilesCard);

      // Left area now displays Textiles & Handloom details
      expect(screen.getByRole('heading', { level: 3, name: 'Textiles & Handloom' })).toBeInTheDocument();
      expect(screen.getByText(/YoY in Uttar Pradesh/i)).toBeInTheDocument();
      expect(screen.getByText(/ODOP Textile Cluster Support/i)).toBeInTheDocument();

      // Click "Back to Live News"
      const backBtn = screen.getByRole('button', { name: /Back to Live News/i });
      await user.click(backBtn);

      // Returns to live news
      expect(screen.getByText(/News · Uttar Pradesh/i)).toBeInTheDocument();
    });
  });
});
