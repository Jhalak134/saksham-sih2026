import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ShellProvider } from '@/lib/shell-context';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { HomeLocationCard } from '@/components/profile/HomeLocationCard';
import { AvailableCapitalCard } from '@/components/profile/AvailableCapitalCard';
import { LanguageCard } from '@/components/profile/LanguageCard';
import { ActivitySummaryCard } from '@/components/profile/ActivitySummaryCard';
import { LogoutCard } from '@/components/profile/LogoutCard';

function renderProfileForm(): void {
  render(
    <ShellProvider>
      <ProfileForm />
    </ShellProvider>
  );
}

describe('ProfileForm — full component render', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders page header and subtitle', () => {
    renderProfileForm();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Profile' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Manage your business preferences.')
    ).toBeInTheDocument();
  });

  it('renders all 5 profile cards', () => {
    renderProfileForm();
    expect(screen.getByText('Home Location')).toBeInTheDocument();
    expect(screen.getByText('Available Capital')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Your Activity')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });
});

describe('HomeLocationCard', () => {
  it('renders initial location and help text', () => {
    const onSave = vi.fn();
    render(
      <HomeLocationCard
        initialLocation="Kheragarh, Agra, Uttar Pradesh"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Home location search input');
    expect(input).toHaveValue('Kheragarh, Agra, Uttar Pradesh');
    expect(
      screen.getByText('Start typing to search for your village, town or district.')
    ).toBeInTheDocument();
  });

  it('allows editing location and calls onSave on save button click', async () => {
    const onSave = vi.fn();
    render(
      <HomeLocationCard
        initialLocation="Kheragarh"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Home location search input');
    await userEvent.clear(input);
    await userEvent.type(input, 'Fatehabad, Agra');

    const saveBtn = screen.getByRole('button', { name: 'Save home location' });
    await userEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith('Fatehabad, Agra');
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('clears location input when clear X button is clicked', async () => {
    const onSave = vi.fn();
    render(
      <HomeLocationCard
        initialLocation="Kheragarh"
        onSave={onSave}
      />
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear location input' });
    await userEvent.click(clearBtn);

    const input = screen.getByLabelText('Home location search input');
    expect(input).toHaveValue('');
  });
});

describe('AvailableCapitalCard', () => {
  it('renders formatted initial capital and helper text', () => {
    const onSave = vi.fn();
    render(
      <AvailableCapitalCard
        initialCapital={100_000}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Available capital amount in rupees');
    expect(input).toHaveValue('₹ 1,00,000');
    expect(
      screen.getByText('Enter a valid amount (e.g. 50000).')
    ).toBeInTheDocument();
  });

  it('formats user input with Indian currency and saves parsed amount', async () => {
    const onSave = vi.fn();
    render(
      <AvailableCapitalCard
        initialCapital={100_000}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Available capital amount in rupees');
    await userEvent.clear(input);
    await userEvent.type(input, '250000');

    const saveBtn = screen.getByRole('button', { name: 'Save available capital' });
    await userEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(250000);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('handles empty input gracefully by setting 0', async () => {
    const onSave = vi.fn();
    render(
      <AvailableCapitalCard
        initialCapital={50_000}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Available capital amount in rupees');
    await userEvent.clear(input);

    const saveBtn = screen.getByRole('button', { name: 'Save available capital' });
    await userEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(0);
  });

  it('clamps capital when input exceeds MAX_CAPITAL', async () => {
    const onSave = vi.fn();
    render(
      <AvailableCapitalCard
        initialCapital={50_000}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Available capital amount in rupees');
    await userEvent.clear(input);
    await userEvent.type(input, '999999999999');

    const saveBtn = screen.getByRole('button', { name: 'Save available capital' });
    await userEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(100_000_000);
  });
});

describe('LanguageCard', () => {
  it('renders supported languages and calls onLanguageChange on selection', async () => {
    const onLanguageChange = vi.fn();
    render(
      <LanguageCard
        language="en"
        onLanguageChange={onLanguageChange}
      />
    );

    const select = screen.getByLabelText('Select app language');
    expect(select).toHaveValue('en');

    await userEvent.selectOptions(select, 'hi');
    expect(onLanguageChange).toHaveBeenCalledWith('hi');
  });
});

describe('ActivitySummaryCard', () => {
  it('renders activity stats correctly', () => {
    render(
      <ActivitySummaryCard
        totalAssessments={4}
        completedAssessments={1}
        savedAssessments={1}
      />
    );

    expect(screen.getByText('Total Assessments')).toBeInTheDocument();
    expect(screen.getByText('All your assessments')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Analysis ready')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Saved for later')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);
  });
});

describe('LogoutCard', () => {
  it('renders logout button and triggers onLogout callback', async () => {
    const onLogout = vi.fn();
    render(<LogoutCard onLogout={onLogout} />);

    const logoutBtn = screen.getByRole('button', {
      name: /Log out\. Return to the landing page\./i,
    });
    await userEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('defaults to setting window.location.href when onLogout is not provided', async () => {
    const originalLocation = window.location;
    // @ts-expect-error Mocking window.location for testing
    delete window.location;
    window.location = { href: '' } as unknown as Location;

    render(<LogoutCard />);
    const logoutBtn = screen.getByRole('button', {
      name: /Log out\. Return to the landing page\./i,
    });
    await userEvent.click(logoutBtn);
    expect(window.location.href).toBe('/');

    window.location = originalLocation;
  });
});
