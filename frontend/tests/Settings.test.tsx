import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ShellProvider } from '@/lib/shell-context';
import { SettingsView } from '@/components/settings/SettingsView';
import { NotificationsCard } from '@/components/settings/NotificationsCard';
import { DataPrivacyCard } from '@/components/settings/DataPrivacyCard';
import { AboutCard } from '@/components/settings/AboutCard';
import { ClearDataModal } from '@/components/settings/ClearDataModal';
import { STORAGE_KEYS } from '@/lib/constants';

function renderSettingsView(): void {
  render(
    <ShellProvider>
      <SettingsView />
    </ShellProvider>
  );
}

describe('SettingsView — full component render', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders page header and subtitle', () => {
    renderSettingsView();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Settings' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Manage how SAKSHAM works for you.')
    ).toBeInTheDocument();
  });

  it('renders all 3 settings sections', () => {
    renderSettingsView();
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Data & Privacy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
  });

  it('performs full clear local data flow and displays dismissable notification', async () => {
    const user = userEvent.setup();
    renderSettingsView();

    // Open modal
    const clearButton = screen.getByRole('button', { name: 'Clear data' });
    await user.click(clearButton);

    // Modal is shown
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Clear Local Data?')).toBeInTheDocument();

    // Confirm clear
    const confirmBtn = screen.getByRole('button', { name: 'Yes, clear data' });
    await user.click(confirmBtn);

    // Modal closes & success banner appears
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByText('Local data, preferences and saved items have been cleared.')
    ).toBeInTheDocument();

    // Dismiss banner
    const dismissBtn = screen.getByRole('button', { name: 'Dismiss message' });
    await user.click(dismissBtn);
    expect(
      screen.queryByText('Local data, preferences and saved items have been cleared.')
    ).not.toBeInTheDocument();
  });
});

describe('NotificationsCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders notification toggle and handles switch toggle on click', async () => {
    const user = userEvent.setup();
    render(<NotificationsCard />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(
      screen.getByText('Choose what updates you\'d like to receive.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Email me when a saved category\'s data updates')
    ).toBeInTheDocument();

    const toggle = screen.getByRole('switch', {
      name: "Email me when a saved category's data updates",
    });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Toggle on
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem(STORAGE_KEYS.emailNotifications)).toBe('true');

    // Toggle off
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(localStorage.getItem(STORAGE_KEYS.emailNotifications)).toBe('false');
  });

  it('initializes with stored value true from localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.emailNotifications, 'true');
    render(<NotificationsCard />);

    const toggle = screen.getByRole('switch', {
      name: "Email me when a saved category's data updates",
    });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});

describe('ClearDataModal', () => {
  it('returns null when not open', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { container } = render(
      <ClearDataModal isOpen={false} onClose={onClose} onConfirm={onConfirm} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('handles close on Cancel button and X button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    const { rerender } = render(
      <ClearDataModal isOpen={true} onClose={onClose} onConfirm={onConfirm} />
    );

    // Cancel button
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // X button
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('handles close on Escape keydown', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ClearDataModal isOpen={true} onClose={onClose} onConfirm={onConfirm} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles close on backdrop click and stops propagation on modal click', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ClearDataModal isOpen={true} onClose={onClose} onConfirm={onConfirm} />
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);

    const modalContent = screen.getByText('Clear Local Data?');
    fireEvent.click(modalContent);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ClearDataModal isOpen={true} onClose={onClose} onConfirm={onConfirm} />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Yes, clear data' });
    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('DataPrivacyCard', () => {
  it('renders correctly and opens modal when Clear data is clicked', async () => {
    const user = userEvent.setup();
    const onClearData = vi.fn();

    render(<DataPrivacyCard onClearData={onClearData} />);

    expect(screen.getByText('Data & Privacy')).toBeInTheDocument();
    expect(screen.getByText('Manage your app data.')).toBeInTheDocument();
    expect(screen.getByText('Clear local data')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: 'Clear data' });
    await user.click(clearButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('AboutCard', () => {
  it('renders version and how saksham works link', () => {
    render(<AboutCard />);

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('App information and resources.')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('SAKSHAM v1.0.0')).toBeInTheDocument();
    expect(screen.getByText("You're on the latest version.")).toBeInTheDocument();

    const link = screen.getByRole('link', {
      name: /How SAKSHAM Works/i,
    });
    expect(link).toHaveAttribute('href', '/how-it-works');
  });
});
