import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { IndiaMap } from '@/components/discover/IndiaMap';

describe('IndiaMap (All India National Opportunities Map)', () => {
  it('renders the national heatmap map and header by default', () => {
    render(<IndiaMap selectedState={null} onStateSelect={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'Interactive India Map' })).toBeInTheDocument();
    expect(screen.getByText('National Opportunities Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Interactive India Map')).toBeInTheDocument();
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

  it('clicking Maharashtra calls onStateSelect("Maharashtra")', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(<IndiaMap selectedState={null} onStateSelect={onSelect} />);
    const mhPath = container.querySelector('#mh') || container.querySelector('path[aria-label="Maharashtra"]');
    expect(mhPath).toBeInTheDocument();
    if (mhPath) {
      await user.click(mhPath);
      expect(onSelect).toHaveBeenCalledWith('Maharashtra');
    }
  });

  it('renders breadcrumbs and clear button when state is selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<IndiaMap selectedState="Uttar Pradesh" onStateSelect={onSelect} />);

    expect(screen.getByRole('button', { name: 'Back to India Map' })).toBeInTheDocument();
    expect(screen.getByText('Pilot Live')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: 'Remove Uttar Pradesh filter' });
    expect(clearButton).toBeInTheDocument();
    await user.click(clearButton);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('interacts with zoom buttons', async () => {
    const user = userEvent.setup();
    render(<IndiaMap selectedState={null} onStateSelect={vi.fn()} />);

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

