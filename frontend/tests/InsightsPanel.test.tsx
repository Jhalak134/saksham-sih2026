import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { InsightsPanel } from '@/components/discover/InsightsPanel';
import type { InsightsData } from '@/lib/discover-types';

const DATA: InsightsData = {
  population: 12480,
  populationGrowthPercent: 2.3,
  keyDemand: { category: 'Dairy products', level: 'High' },
  nearbyMarkets: 3,
};

describe('InsightsPanel', () => {
  it('renders the location heading', () => {
    render(<InsightsPanel location="Kheragarh" data={DATA} />);
    expect(screen.getByText(/Insights for Kheragarh/)).toBeInTheDocument();
  });

  it('renders formatted population', () => {
    render(<InsightsPanel location="Kheragarh" data={DATA} />);
    expect(screen.getByText('12,480')).toBeInTheDocument();
  });

  it('renders population growth percentage', () => {
    render(<InsightsPanel location="Kheragarh" data={DATA} />);
    expect(screen.getByText(/2\.3%/)).toBeInTheDocument();
  });

  it('renders key demand category', () => {
    render(<InsightsPanel location="Kheragarh" data={DATA} />);
    expect(screen.getByText('Dairy products')).toBeInTheDocument();
  });

  it('renders demand level badge', () => {
    render(<InsightsPanel location="Kheragarh" data={DATA} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders nearby markets count', () => {
    render(<InsightsPanel location="Kheragarh" data={DATA} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders Change button when onChangeLocation is provided', () => {
    render(<InsightsPanel location="Kheragarh" data={DATA} onChangeLocation={vi.fn()} />);
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('does not render Change button when onChangeLocation is omitted', () => {
    render(<InsightsPanel location="Kheragarh" data={DATA} />);
    expect(screen.queryByText('Change')).toBeNull();
  });

  it('calls onChangeLocation when Change is clicked', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<InsightsPanel location="Kheragarh" data={DATA} onChangeLocation={fn} />);
    await user.click(screen.getByText('Change'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls onAskSaksham when the prompt button is clicked', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<InsightsPanel location="Kheragarh" data={DATA} onAskSaksham={fn} />);
    await user.click(screen.getByText(/Not sure where to start/));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('renders the "Real data" sub-heading', () => {
    render(<InsightsPanel location="Kheragarh" data={DATA} />);
    expect(screen.getByText(/Real data\. Local context\./)).toBeInTheDocument();
  });

  it('shows Medium demand badge in yellow', () => {
    const medium: InsightsData = { ...DATA, keyDemand: { category: 'Textiles', level: 'Medium' } };
    render(<InsightsPanel location="X" data={medium} />);
    const badge = screen.getByText('Medium');
    expect(badge.className).toContain('yellow');
  });

  it('shows Low demand badge in red', () => {
    const low: InsightsData = { ...DATA, keyDemand: { category: 'Retail', level: 'Low' } };
    render(<InsightsPanel location="X" data={low} />);
    const badge = screen.getByText('Low');
    expect(badge.className).toContain('red');
  });
});
