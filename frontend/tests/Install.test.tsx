import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { InstallView } from '@/components/install/InstallView';
import { AndroidInstallCard } from '@/components/install/AndroidInstallCard';
import { IosInstallCard } from '@/components/install/IosInstallCard';
import { OtherBrowsersCard } from '@/components/install/OtherBrowsersCard';
import { MobileInstallView } from '@/components/install/MobileInstallView';
import { AlreadyInstalledBanner } from '@/components/install/AlreadyInstalledBanner';
import { InstallAppIcon } from '@/components/install/InstallAppIcon';

describe('InstallView — full page render', () => {
  it('renders page header, top info banner, cards, and bottom banner', () => {
    render(<InstallView />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Install SAKSHAM' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Add SAKSHAM to your home screen for one-tap access.')
    ).toBeInTheDocument();

    expect(
      screen.getByText('A faster, app-like experience')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Android (Chrome)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'iOS (Safari)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Other browsers' })
    ).toBeInTheDocument();
    expect(screen.getByText('Already installed?')).toBeInTheDocument();
  });
});

describe('AndroidInstallCard', () => {
  it('renders Android instructions and triggers install on button click', async () => {
    const user = userEvent.setup();
    const onInstall = vi.fn();

    render(<AndroidInstallCard onInstall={onInstall} />);

    expect(screen.getByText('Android (Chrome)')).toBeInTheDocument();
    expect(
      screen.getByText('Install SAKSHAM with a single tap.')
    ).toBeInTheDocument();
    expect(screen.getByText('saksham.app')).toBeInTheDocument();

    const installButtons = screen.getAllByRole('button', { name: /Install App/i });
    await user.click(installButtons[0]);

    expect(onInstall).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Don't see the install prompt?")).toBeInTheDocument();
  });
});

describe('IosInstallCard', () => {
  it('renders all 3 steps for iOS Safari setup and optional tip', () => {
    const { rerender } = render(<IosInstallCard />);

    expect(screen.getByText('iOS (Safari)')).toBeInTheDocument();
    expect(
      screen.getByText('Follow these steps to add SAKSHAM.')
    ).toBeInTheDocument();

    expect(screen.getByText('Tap the Share icon')).toBeInTheDocument();
    expect(screen.getByText('Select "Add to Home Screen"')).toBeInTheDocument();
    expect(screen.getByText('Tap "Add"')).toBeInTheDocument();

    expect(
      screen.queryByText(/Safari is the best browser/i)
    ).not.toBeInTheDocument();

    rerender(<IosInstallCard showTip={true} />);
    expect(
      screen.getByText(/Safari is the best browser/i)
    ).toBeInTheDocument();
  });
});

describe('OtherBrowsersCard', () => {
  it('renders laptop mockup and mobile recommendation', () => {
    render(<OtherBrowsersCard />);

    expect(screen.getByText('Other browsers')).toBeInTheDocument();
    expect(screen.getByText('This works best on a phone.')).toBeInTheDocument();
    expect(
      screen.getByText(/Adding SAKSHAM to your home screen is currently supported/i)
    ).toBeInTheDocument();
  });
});

describe('AlreadyInstalledBanner', () => {
  it('renders already installed info and link to discover', () => {
    render(<AlreadyInstalledBanner />);

    expect(screen.getByText('Already installed?')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Open SAKSHAM/i });
    expect(link).toHaveAttribute('href', '/discover');
  });
});

describe('MobileInstallView', () => {
  it('allows switching between Android and iOS views and toggling fallback', async () => {
    const user = userEvent.setup();
    const onInstall = vi.fn();

    render(<MobileInstallView onInstall={onInstall} />);

    // Default Android view
    expect(screen.getByText('Quick access')).toBeInTheDocument();
    expect(screen.getByText('A faster experience')).toBeInTheDocument();
    expect(screen.getByText('Works like an app')).toBeInTheDocument();

    // Toggle fallback
    const fallbackBtn = screen.getByRole('button', {
      name: "Don't see the install prompt?",
    });
    await user.click(fallbackBtn);

    expect(
      screen.getByText('Tip: Use Google Chrome on Android for the best experience.')
    ).toBeInTheDocument();

    // Go back to main
    const backBtn = screen.getByRole('button', { name: /Back to Install/i });
    await user.click(backBtn);
    expect(screen.getByText('Quick access')).toBeInTheDocument();

    // Switch to iOS tab
    const iosTab = screen.getByRole('button', { name: 'iOS (Safari)' });
    await user.click(iosTab);

    expect(screen.getByText('Tap the Share icon')).toBeInTheDocument();
    expect(
      screen.getByText(/Safari is the best browser/i)
    ).toBeInTheDocument();
  });
});

describe('InstallAppIcon', () => {
  it('renders different sizes cleanly', () => {
    const { rerender } = render(<InstallAppIcon size="sm" />);
    expect(screen.getByLabelText('SAKSHAM app logo')).toBeInTheDocument();

    rerender(<InstallAppIcon size="md" />);
    expect(screen.getByLabelText('SAKSHAM app logo')).toBeInTheDocument();

    rerender(<InstallAppIcon size="lg" />);
    expect(screen.getByLabelText('SAKSHAM app logo')).toBeInTheDocument();
  });
});
