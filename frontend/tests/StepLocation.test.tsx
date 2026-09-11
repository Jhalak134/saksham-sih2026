import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { StepLocation } from '@/components/assessment/StepLocation';

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
        locationId="loc_07"
        locationDisplay="Vrindavan, Mathura"
      />
    );
    expect(screen.getByText('Vrindavan, Mathura')).toBeInTheDocument();
    expect(screen.getByText(/active pilot region verified/i)).toBeInTheDocument();
  });

  it('Continue is enabled when Mathura location is selected', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="loc_07"
        locationDisplay="Vrindavan, Mathura"
      />
    );
    expect(screen.getByRole('button', { name: /continue to business idea/i })).not.toBeDisabled();
  });
});

describe('StepLocation — search and selection', () => {
  it('shows search results after typing a matching query', async () => {
    render(<StepLocation {...defaultProps} />);
    await userEvent.type(screen.getByRole('combobox'), 'Kher');
    await waitFor(() => {
      expect(screen.getByText('Kheragarh')).toBeInTheDocument();
    });
  });

  it('shows no results for unmatched query', async () => {
    render(<StepLocation {...defaultProps} />);
    await userEvent.type(screen.getByRole('combobox'), 'zzzzz');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  it('calls onSelect when a result is clicked', async () => {
    const onSelect = vi.fn();
    render(<StepLocation {...defaultProps} onSelect={onSelect} />);
    await userEvent.type(screen.getByRole('combobox'), 'Vrindavan');
    await waitFor(() => screen.getByText('Vrindavan'));
    await userEvent.click(screen.getByText('Vrindavan'));
    expect(onSelect).toHaveBeenCalledWith('loc_07', 'Vrindavan, Mathura');
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
        locationId="loc_07"
        locationDisplay="Vrindavan, Mathura"
      />
    );
    expect(screen.getByRole('button', { name: /remove vrindavan, mathura/i })).toBeInTheDocument();
  });

  it('calls onSelect with empty strings when clear button clicked', async () => {
    const onSelect = vi.fn();
    render(
      <StepLocation
        {...defaultProps}
        locationId="loc_07"
        locationDisplay="Vrindavan, Mathura"
        onSelect={onSelect}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /remove vrindavan, mathura/i }));
    expect(onSelect).toHaveBeenCalledWith('', '');
  });
});
