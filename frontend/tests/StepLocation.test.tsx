import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { StepLocation } from '@/components/assessment/StepLocation';

vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/api-client');
  return {
    ...actual,
    searchLocations: vi.fn(async (q: string) => {
      const lower = q.toLowerCase();
      if (lower.includes('bera')) {
        return [
          {
            id: 123912,
            name: 'Bera',
            block_name: 'Mat',
            district_name: 'Mathura',
            state_name: 'Uttar Pradesh',
            population: 2923,
            household_count: 553,
            literacy_rate: 61.2,
          },
        ];
      }
      if (lower.includes('nabipur')) {
        return [
          {
            id: 123592,
            name: 'Nabipur',
            block_name: 'Chhata',
            district_name: 'Mathura',
            state_name: 'Uttar Pradesh',
            population: 1500,
            household_count: 250,
            literacy_rate: 60.0,
          },
          {
            id: 123815,
            name: 'Nabipur',
            block_name: 'Mat',
            district_name: 'Mathura',
            state_name: 'Uttar Pradesh',
            population: 1800,
            household_count: 300,
            literacy_rate: 62.0,
          },
        ];
      }
      if (lower.includes('error')) {
        throw new Error('Backend database unreachable');
      }
      return [];
    }),
    formatVillageLocation: (v: { name: string; block_name?: string | null; district_name: string }) => {
      const blockPart = v.block_name ? `${v.block_name} Block · ` : '';
      return `${v.name}, ${blockPart}${v.district_name}`;
    },
  };
});

const defaultProps = {
  locationId: '',
  locationDisplay: '',
  onSelect: vi.fn(),
  onContinue: vi.fn(),
};

describe('StepLocation — rendering', () => {
  it('renders the search input and pilot chips when no location selected', () => {
    render(<StepLocation {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Quick Select Pilot Areas (Mathura):')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /vrindavan/i })).toBeInTheDocument();
  });

  it('renders Continue button', () => {
    render(<StepLocation {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('Continue is disabled when no location selected', () => {
    render(<StepLocation {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('shows selected chip and boundary notice when non-Mathura location is set', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="loc_01"
        locationDisplay="Kheragarh, Agra"
      />
    );
    expect(screen.getAllByText('Kheragarh, Agra').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/pilot region boundary notice/i)).toBeInTheDocument();
    expect(screen.getByText(/we are sorry/i)).toBeInTheDocument();
  });

  it('Continue is disabled when non-Mathura location is selected', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="loc_01"
        locationDisplay="Kheragarh, Agra"
      />
    );
    expect(screen.getByRole('button', { name: /select a mathura location to proceed/i })).toBeDisabled();
  });

  it('shows selected chip and pilot verified badge when Mathura location is set', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="123912"
        locationDisplay="Bera, Mat Block · Mathura"
      />
    );
    expect(screen.getByText('Bera, Mat Block · Mathura')).toBeInTheDocument();
    expect(screen.getByText(/active pilot region verified/i)).toBeInTheDocument();
  });

  it('Continue is enabled when Mathura location is selected', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="123912"
        locationDisplay="Bera, Mat Block · Mathura"
      />
    );
    expect(screen.getByRole('button', { name: /continue to business idea/i })).not.toBeDisabled();
  });
});

describe('StepLocation — search and selection', () => {
  it('shows search results after typing a matching query for real village', async () => {
    render(<StepLocation {...defaultProps} />);
    await userEvent.type(screen.getByRole('combobox'), 'Bera');
    await waitFor(() => {
      expect(screen.getByText('Bera')).toBeInTheDocument();
      expect(screen.getByText(/Mat Block · Mathura · Uttar Pradesh/i)).toBeInTheDocument();
      expect(screen.getByText(/ID: 123912/i)).toBeInTheDocument();
    });
  });

  it('shows duplicate village names distinguished by block and Census ID', async () => {
    render(<StepLocation {...defaultProps} />);
    await userEvent.type(screen.getByRole('combobox'), 'Nabipur');
    await waitFor(() => {
      const items = screen.getAllByText('Nabipur');
      expect(items.length).toBe(2);
      expect(screen.getByText(/Chhata Block · Mathura/i)).toBeInTheDocument();
      expect(screen.getByText(/Mat Block · Mathura/i)).toBeInTheDocument();
      expect(screen.getByText(/ID: 123592/i)).toBeInTheDocument();
      expect(screen.getByText(/ID: 123815/i)).toBeInTheDocument();
    });
  });

  it('shows no-results status for unmatched query', async () => {
    render(<StepLocation {...defaultProps} />);
    await userEvent.type(screen.getByRole('combobox'), 'zzzzz');
    await waitFor(() => {
      expect(screen.getByText(/No villages found matching “zzzzz”/i)).toBeInTheDocument();
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  it('displays error alert when location search API fails', async () => {
    render(<StepLocation {...defaultProps} />);
    await userEvent.type(screen.getByRole('combobox'), 'error');
    await waitFor(() => {
      expect(screen.getByText('Backend database unreachable')).toBeInTheDocument();
    });
  });

  it('calls onSelect with canonical Census village ID when a result is clicked', async () => {
    const onSelect = vi.fn();
    render(<StepLocation {...defaultProps} onSelect={onSelect} />);
    await userEvent.type(screen.getByRole('combobox'), 'Bera');
    await waitFor(() => screen.getByText('Bera'));
    await userEvent.click(screen.getByText('Bera'));
    expect(onSelect).toHaveBeenCalledWith('123912', 'Bera, Mat Block · Mathura');
  });

  it('calls onSelect when a quick-select pilot chip is clicked', async () => {
    const onSelect = vi.fn();
    render(<StepLocation {...defaultProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /vrindavan/i }));
    expect(onSelect).toHaveBeenCalledWith('loc_07', 'Vrindavan, Mathura');
  });
});

describe('StepLocation — clear', () => {
  it('renders a clear button when location is selected', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="123912"
        locationDisplay="Bera, Mat Block · Mathura"
      />
    );
    expect(screen.getByRole('button', { name: /remove bera, mat block · mathura/i })).toBeInTheDocument();
  });

  it('calls onSelect with empty strings when clear button clicked', async () => {
    const onSelect = vi.fn();
    render(
      <StepLocation
        {...defaultProps}
        locationId="123912"
        locationDisplay="Bera, Mat Block · Mathura"
        onSelect={onSelect}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /remove bera, mat block · mathura/i }));
    expect(onSelect).toHaveBeenCalledWith('', '');
  });
});
