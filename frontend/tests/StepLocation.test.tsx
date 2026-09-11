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
  it('renders the search input when no location selected', () => {
    render(<StepLocation {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders Continue button', () => {
    render(<StepLocation {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('Continue is disabled when no location selected', () => {
    render(<StepLocation {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('shows selected chip when locationId is set', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="loc_01"
        locationDisplay="Kheragarh, Agra"
      />
    );
    expect(screen.getByText('Kheragarh, Agra')).toBeInTheDocument();
  });

  it('hides search input when location is selected', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="loc_01"
        locationDisplay="Kheragarh, Agra"
      />
    );
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('Continue is enabled when location is selected', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="loc_01"
        locationDisplay="Kheragarh, Agra"
      />
    );
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });
});

describe('StepLocation — search', () => {
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
    await userEvent.type(screen.getByRole('combobox'), 'Kher');
    await waitFor(() => screen.getByText('Kheragarh'));
    await userEvent.click(screen.getByText('Kheragarh'));
    expect(onSelect).toHaveBeenCalledWith('loc_01', 'Kheragarh, Agra');
  });
});

describe('StepLocation — clear', () => {
  it('renders a clear button when location is selected', () => {
    render(
      <StepLocation
        {...defaultProps}
        locationId="loc_01"
        locationDisplay="Kheragarh, Agra"
      />
    );
    expect(screen.getByRole('button', { name: /remove kheragarh/i })).toBeInTheDocument();
  });

  it('calls onSelect with empty strings when clear button clicked', async () => {
    const onSelect = vi.fn();
    render(
      <StepLocation
        {...defaultProps}
        locationId="loc_01"
        locationDisplay="Kheragarh, Agra"
        onSelect={onSelect}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /remove kheragarh/i }));
    expect(onSelect).toHaveBeenCalledWith('', '');
  });
});
