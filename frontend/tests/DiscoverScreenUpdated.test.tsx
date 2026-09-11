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

    // Bottom Section: Featured Article Banner & categories
    expect(screen.getByText(/Dairy registrations are up 34% this year/i)).toBeInTheDocument();
    expect(screen.getByText(/Textiles & Handloom/i)).toBeInTheDocument();
    expect(screen.getByText(/Retail & Kirana/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Agri Processing/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Food & Beverages/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /See all categories/i })).toBeInTheDocument();
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

  describe('ArticleCategorySection (Category Details in Left Space & Scrollable List)', () => {
    it('shows 4 categories by default and expands to all categories on "See all" click', async () => {
      const user = userEvent.setup();
      render(<ArticleCategorySection stateName="Uttar Pradesh" />);

      // Initially 4 categories are in the right list
      expect(screen.getByText(/Textiles & Handloom/i)).toBeInTheDocument();
      expect(screen.getByText(/Retail & Kirana/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Agri Processing/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Food & Beverages/i)).toBeInTheDocument();

      // Expand to all categories
      const seeAllBtn = screen.getByRole('button', { name: /See all categories/i });
      await user.click(seeAllBtn);

      expect(screen.getByText(/Solar & Clean Energy/i)).toBeInTheDocument();
      expect(screen.getByText(/Handicrafts & Pottery/i)).toBeInTheDocument();
      expect(screen.getByText(/Services & Repairs/i)).toBeInTheDocument();
    });

    it('clicking a category card shows that category info in the left space', async () => {
      const user = userEvent.setup();
      render(<ArticleCategorySection stateName="Uttar Pradesh" />);

      // Default left area shows dairy featured story
      expect(screen.getByText(/Dairy registrations are up 34% this year/i)).toBeInTheDocument();

      // Click on "Textiles & Handloom" category
      const textilesCard = screen.getByRole('button', { name: /Textiles & Handloom category/i });
      await user.click(textilesCard);

      // Left area now displays Textiles & Handloom details
      expect(screen.getByRole('heading', { level: 3, name: 'Textiles & Handloom' })).toBeInTheDocument();
      expect(screen.getByText(/YoY Registrations in Uttar Pradesh/i)).toBeInTheDocument();
      expect(screen.getByText(/ODOP Textile Cluster Support/i)).toBeInTheDocument();

      // Click "Back to Featured Story"
      const backBtn = screen.getByRole('button', { name: /Back to Featured Story/i });
      await user.click(backBtn);

      // Returns to featured article
      expect(screen.getByText(/Dairy registrations are up 34% this year/i)).toBeInTheDocument();
    });
  });
});
