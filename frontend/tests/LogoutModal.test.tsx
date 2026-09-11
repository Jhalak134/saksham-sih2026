import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LogoutModal } from '@/components/ui/LogoutModal';

describe('LogoutModal component', () => {
  it('does not render when isOpen is false', () => {
    render(<LogoutModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with title, description, Cancel, and Yes Log Out when isOpen is true', () => {
    render(<LogoutModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument();
    expect(
      screen.getByText(/You will need to log in again to view your saved reports/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yes, Log Out/i })).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const onClose = vi.fn();
    render(<LogoutModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Yes, Log Out button is clicked', async () => {
    const onConfirm = vi.fn();
    render(<LogoutModal isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: /Yes, Log Out/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', async () => {
    const onClose = vi.fn();
    render(<LogoutModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
