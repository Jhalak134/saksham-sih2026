import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { IndiaMap } from '@/components/discover/IndiaMap';

// Mock react-map-gl/maplibre
vi.mock('react-map-gl/maplibre', () => {
  return {
    default: vi.fn(({ children, onLoad, ...props }: { children?: React.ReactNode; onLoad?: () => void }) => {
      React.useEffect(() => {
        if (onLoad) onLoad();
      }, [onLoad]);
      return <div data-testid="maplibre-map">{children}</div>;
    }),
    Source: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-source">{children}</div>,
    Layer: () => <div data-testid="map-layer" />,
  };
});

const mockVillagesGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'node/1',
      properties: { name: 'Vrindavan', place: 'town', postal_code: '281121' },
      geometry: { type: 'Point', coordinates: [77.7006, 27.5807] },
    },
    {
      type: 'Feature',
      id: 'node/2',
      properties: { name: 'Barsana', place: 'village', postal_code: '281405' },
      geometry: { type: 'Point', coordinates: [77.3744, 27.6473] },
    },
    {
      type: 'Feature',
      id: 'node/3',
      properties: { name: 'Govardhan', place: 'town', postal_code: '281502' },
      geometry: { type: 'Point', coordinates: [77.4642, 27.4984] },
    },
  ],
};

describe('IndiaMap (Hybrid 3-Tier Architecture)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('mathura-villages.geojson')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockVillagesGeoJSON),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      })
    );
  });

  describe('Level 1: All India National Heatmap', () => {
    it('renders the national heatmap map and UP pilot badge by default', () => {
      render(<IndiaMap selectedState={null} onStateSelect={vi.fn()} />);
      expect(screen.getByRole('img', { name: 'Interactive India Map' })).toBeInTheDocument();
      expect(screen.getByText('National Opportunities Heatmap')).toBeInTheDocument();
      expect(screen.getByText('UP Pilot Live')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Level Heatmap:')).toBeInTheDocument();
    });

    it('shows opportunity tooltip when hovering over states', () => {
      const { container } = render(<IndiaMap selectedState={null} onStateSelect={vi.fn()} />);
      const maharashtraPath = container.querySelector('#mh') || container.querySelector('path[aria-label="Maharashtra"]');
      if (maharashtraPath) {
        fireEvent.mouseEnter(maharashtraPath);
        expect(screen.getByText('Maharashtra')).toBeInTheDocument();
        expect(screen.getAllByText(/Opportunity/i).length).toBeGreaterThan(0);
      }
    });

    it('clicking Uttar Pradesh calls onStateSelect("Uttar Pradesh")', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const { container } = render(<IndiaMap selectedState={null} onStateSelect={onSelect} />);
      const upPath = container.querySelector('#up') || container.querySelector('path[aria-label="Uttar Pradesh"]');
      expect(upPath).toBeInTheDocument();
      if (upPath) {
        await user.click(upPath);
        expect(onSelect).toHaveBeenCalledWith('Uttar Pradesh');
      }
    });
  });

  describe('Level 2: Uttar Pradesh State District Vector Map', () => {
    it('renders UP districts and highlights Mathura as pilot region', () => {
      const { container } = render(
        <IndiaMap selectedState="Uttar Pradesh" onStateSelect={vi.fn()} />
      );
      expect(screen.getByRole('img', { name: 'Uttar Pradesh District Map' })).toBeInTheDocument();
      expect(screen.getByLabelText('Pin for Mathura (Pilot Region)')).toBeInTheDocument();
      const mathuraPath = container.querySelector('#dist-mathura') || container.querySelector('path[aria-label="Mathura"]');
      expect(mathuraPath).toBeInTheDocument();
    });

    it('shows Coming Soon when hovering over non-pilot UP districts', () => {
      const { container } = render(
        <IndiaMap selectedState="Uttar Pradesh" onStateSelect={vi.fn()} />
      );
      const agraPath = container.querySelector('#dist-agra') || container.querySelector('path[aria-label="Agra"]');
      if (agraPath) {
        fireEvent.mouseEnter(agraPath);
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        expect(screen.getByText(/Pilot active in Mathura district/i)).toBeInTheDocument();
      }
    });

    it('shows Pilot Region tooltip when hovering over Mathura in UP view', () => {
      const { container } = render(
        <IndiaMap selectedState="Uttar Pradesh" onStateSelect={vi.fn()} />
      );
      const mathuraPath = container.querySelector('#dist-mathura') || container.querySelector('path[aria-label="Mathura"]');
      if (mathuraPath) {
        fireEvent.mouseEnter(mathuraPath);
        expect(screen.getByText('★ PILOT REGION')).toBeInTheDocument();
        expect(screen.getByText(/Click to explore Mathura tehsils/i)).toBeInTheDocument();
      }
    });

    it('clicking Mathura district triggers onDistrictSelect("Mathura")', async () => {
      const user = userEvent.setup();
      const onDistrictSelect = vi.fn();
      const { container } = render(
        <IndiaMap
          selectedState="Uttar Pradesh"
          onStateSelect={vi.fn()}
          onDistrictSelect={onDistrictSelect}
        />
      );
      const mathuraPath = container.querySelector('#dist-mathura') || container.querySelector('path[aria-label="Mathura"]');
      if (mathuraPath) {
        await user.click(mathuraPath);
        expect(onDistrictSelect).toHaveBeenCalledWith('Mathura');
      }
    });
  });

  describe('Level 3: Mathura District MapLibre OSM GeoJSON View', () => {
    it('renders Mathura Level 3 map container, search bar and breadcrumbs', () => {
      render(
        <IndiaMap
          selectedState="Uttar Pradesh"
          selectedDistrict="Mathura"
          onStateSelect={vi.fn()}
          onDistrictSelect={vi.fn()}
        />
      );
      expect(screen.getByRole('region', { name: 'Mathura District Map' })).toBeInTheDocument();
      expect(screen.getByTestId('maplibre-map')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search Mathura villages/i)).toBeInTheDocument();
      expect(screen.getByText('Mathura District')).toBeInTheDocument();
      expect(screen.getByText('Pilot Active')).toBeInTheDocument();
    });

    it('filters villages via autocomplete search and allows selecting a village', async () => {
      const user = userEvent.setup();
      const onDistrictSelect = vi.fn();
      render(
        <IndiaMap
          selectedState="Uttar Pradesh"
          selectedDistrict="Mathura"
          onStateSelect={vi.fn()}
          onDistrictSelect={onDistrictSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search Mathura villages/i);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await user.type(searchInput, 'Barsana');

      await waitFor(() => {
        expect(screen.getByText('Barsana')).toBeInTheDocument();
      });

      const barsanaOption = screen.getByRole('button', { name: /Barsana/i });
      await user.click(barsanaOption);

      expect(onDistrictSelect).toHaveBeenCalledWith('Barsana');
    });

    it('navigates back to All India or UP via breadcrumbs', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onDistrictSelect = vi.fn();
      render(
        <IndiaMap
          selectedState="Uttar Pradesh"
          selectedDistrict="Mathura"
          onStateSelect={onSelect}
          onDistrictSelect={onDistrictSelect}
        />
      );

      // Click "All India" breadcrumb
      await user.click(screen.getByRole('button', { name: /Back to India Map/i }));
      expect(onSelect).toHaveBeenCalledWith(null);
      expect(onDistrictSelect).toHaveBeenCalledWith(null);

      // Click "Uttar Pradesh" breadcrumb
      await user.click(screen.getByRole('button', { name: /Back to Uttar Pradesh/i }));
      expect(onDistrictSelect).toHaveBeenCalledWith(null);
    });

    it('interacts with zoom buttons in Level 3', async () => {
      const user = userEvent.setup();
      render(
        <IndiaMap
          selectedState="Uttar Pradesh"
          selectedDistrict="Mathura"
          onStateSelect={vi.fn()}
          onDistrictSelect={vi.fn()}
        />
      );

      const zoomIn = screen.getByRole('button', { name: /Zoom in/i });
      const zoomOut = screen.getByRole('button', { name: /Zoom out/i });
      const resetZoom = screen.getByRole('button', { name: /Reset zoom/i });

      await user.click(zoomIn);
      await user.click(zoomOut);
      await user.click(resetZoom);

      expect(zoomIn).toBeInTheDocument();
      expect(zoomOut).toBeInTheDocument();
      expect(resetZoom).toBeInTheDocument();
    });
  });
});
