import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { IndiaMap } from '@/components/discover/IndiaMap';

describe('IndiaMap', () => {
  it('renders the SVG map element in national view', () => {
    render(<IndiaMap selectedState={null} onStateSelect={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'Interactive India Map' })).toBeDefined();
    expect(screen.getByText('India Overview')).toBeInTheDocument();
  });

  it('renders state paths with high-contrast boundaries in national view', () => {
    const { container } = render(
      <IndiaMap selectedState={null} onStateSelect={vi.fn()} />
    );
    const paths = container.querySelectorAll('#india-states path');
    expect(paths.length).toBeGreaterThan(25);
  });

  it('does not show the remove filter button when selectedState is null', () => {
    render(<IndiaMap selectedState={null} onStateSelect={vi.fn()} />);
    expect(screen.queryByLabelText(/Remove/)).toBeNull();
  });

  it('shows the selected state header and chip when a state is selected', () => {
    render(<IndiaMap selectedState="Uttar Pradesh" onStateSelect={vi.fn()} />);
    expect(screen.getByLabelText('Remove Uttar Pradesh filter')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to India Map/i })).toBeInTheDocument();
    expect(screen.getByText(/Districts/)).toBeInTheDocument();
  });

  it('calls onStateSelect(null) when the × on the state chip is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<IndiaMap selectedState="Uttar Pradesh" onStateSelect={onSelect} />);
    await user.click(screen.getByLabelText('Remove Uttar Pradesh filter'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('calls onStateSelect(null) when Back to India button is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onDistrictSelect = vi.fn();
    render(
      <IndiaMap
        selectedState="Uttar Pradesh"
        onStateSelect={onSelect}
        onDistrictSelect={onDistrictSelect}
      />
    );
    await user.click(screen.getByRole('button', { name: /Back to India Map/i }));
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onDistrictSelect).toHaveBeenCalledWith(null);
  });

  it('renders + and − zoom buttons and handles zoom interactions', async () => {
    const user = userEvent.setup();
    render(<IndiaMap selectedState={null} onStateSelect={vi.fn()} />);
    const zoomIn = screen.getByLabelText(/Zoom in/);
    const zoomOut = screen.getByLabelText(/Zoom out/);
    expect(zoomIn).toBeInTheDocument();
    expect(zoomOut).toBeInTheDocument();

    await user.click(zoomIn);
    expect(screen.getByLabelText(/Reset zoom/)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/Reset zoom/));
    expect(screen.queryByLabelText(/Reset zoom/)).toBeNull();

    await user.click(zoomOut);
    expect(screen.getByLabelText(/Reset zoom/)).toBeInTheDocument();
  });

  it('clicking a state on the national map selects it', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <IndiaMap selectedState={null} onStateSelect={onSelect} />
    );
    const upPath = container.querySelector('#up');
    if (upPath) {
      await user.click(upPath);
      expect(onSelect).toHaveBeenCalledWith('Uttar Pradesh');
    }
  });

  it('renders district paths and pins in state view', () => {
    const { container } = render(
      <IndiaMap selectedState="Uttar Pradesh" onStateSelect={vi.fn()} />
    );
    const districtPaths = container.querySelectorAll('#state-districts path');
    const districtPins = container.querySelectorAll('#district-pins g[role="button"]');
    expect(districtPaths.length).toBeGreaterThan(50);
    expect(districtPins.length).toBeGreaterThan(50);
  });

  it('filters districts when searching in the state view', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <IndiaMap selectedState="Uttar Pradesh" onStateSelect={vi.fn()} />
    );
    const searchInput = screen.getByPlaceholderText(/Filter/);
    await user.type(searchInput, 'Firozabad');

    const districtPaths = container.querySelectorAll('#state-districts path');
    expect(districtPaths.length).toBe(1);

    const clearButton = screen.getByLabelText(/Clear filter/);
    await user.click(clearButton);
    const resetPaths = container.querySelectorAll('#state-districts path');
    expect(resetPaths.length).toBeGreaterThan(50);
  });

  it('clicking a district path triggers onDistrictSelect', async () => {
    const user = userEvent.setup();
    const onDistrictSelect = vi.fn();
    const { container } = render(
      <IndiaMap
        selectedState="Uttar Pradesh"
        onStateSelect={vi.fn()}
        onDistrictSelect={onDistrictSelect}
      />
    );
    const agraPath = container.querySelector('path[aria-label="Agra"]');
    if (agraPath) {
      await user.click(agraPath);
      expect(onDistrictSelect).toHaveBeenCalledWith('Agra');
    }
  });

  it('clicking a district pin triggers onDistrictSelect', async () => {
    const user = userEvent.setup();
    const onDistrictSelect = vi.fn();
    render(
      <IndiaMap
        selectedState="Uttar Pradesh"
        onStateSelect={vi.fn()}
        onDistrictSelect={onDistrictSelect}
      />
    );
    const agraPin = screen.getByRole('button', { name: /Pin for Agra/i });
    await user.click(agraPin);
    expect(onDistrictSelect).toHaveBeenCalledWith('Agra');
  });

  it('shows selected district chip and clears it on click', async () => {
    const user = userEvent.setup();
    const onDistrictSelect = vi.fn();
    render(
      <IndiaMap
        selectedState="Uttar Pradesh"
        selectedDistrict="Agra"
        onStateSelect={vi.fn()}
        onDistrictSelect={onDistrictSelect}
      />
    );
    const removeDistrictBtn = screen.getByLabelText('Remove Agra filter');
    expect(removeDistrictBtn).toBeInTheDocument();
    await user.click(removeDistrictBtn);
    expect(onDistrictSelect).toHaveBeenCalledWith(null);
  });

  it('shows tooltip on mouse enter for district', () => {
    const { container } = render(
      <IndiaMap selectedState="Uttar Pradesh" onStateSelect={vi.fn()} />
    );
    const agraPath = container.querySelector('path[aria-label="Agra"]');
    if (agraPath) {
      fireEvent.mouseEnter(agraPath);
      expect(screen.getAllByText('Agra').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Leather & Footwear Hub/).length).toBeGreaterThan(0);
    }
  });
});
