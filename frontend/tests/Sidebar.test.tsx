import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock next/navigation before importing Sidebar
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/discover'),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}));

import { usePathname } from 'next/navigation';
import { ShellProvider } from '@/lib/shell-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { SIDEBAR_PRIMARY_ITEMS, SIDEBAR_SECONDARY_ITEMS } from '@/lib/constants';

function renderSidebar(): void {
  render(
    <ShellProvider>
      <Sidebar />
    </ShellProvider>
  );
}

describe('Sidebar — structure', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/discover');
    renderSidebar();
  });

  it('renders the SAKSHAM wordmark', () => {
    expect(screen.getByText('SAKSHAM')).toBeInTheDocument();
  });

  it('renders the brand tagline', () => {
    expect(screen.getByText(/Your business\. A stronger tomorrow\./)).toBeInTheDocument();
  });

  it('renders all primary nav items', () => {
    SIDEBAR_PRIMARY_ITEMS.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders all secondary nav items', () => {
    SIDEBAR_SECONDARY_ITEMS.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders the Language selector', () => {
    expect(screen.getByLabelText('Select language')).toBeInTheDocument();
  });

  it('renders the Log out button', () => {
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('does not render the version footer', () => {
    expect(screen.queryByText('SAKSHAM v1.0.0')).not.toBeInTheDocument();
  });
});

describe('Sidebar — active state', () => {
  it('applies active class to Discover when on /discover', () => {
    vi.mocked(usePathname).mockReturnValue('/discover');
    renderSidebar();
    const link = screen.getByText('Discover').closest('a');
    expect(link?.className).toContain('bg-[var(--color-nav-active-bg)]');
  });

  it('applies active class to My Reports when on /reports', () => {
    vi.mocked(usePathname).mockReturnValue('/reports');
    renderSidebar();
    const link = screen.getByText('My Reports').closest('a');
    expect(link?.className).toContain('bg-[var(--color-nav-active-bg)]');
  });

  it('does not apply active class to Discover when on /reports', () => {
    vi.mocked(usePathname).mockReturnValue('/reports');
    renderSidebar();
    const link = screen.getByText('Discover').closest('a');
    expect(link?.className).not.toContain('bg-[var(--color-nav-active-bg)]');
  });

  it('Discover is active when pathname is /', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    renderSidebar();
    const link = screen.getByText('Discover').closest('a');
    expect(link?.className).toContain('bg-[var(--color-nav-active-bg)]');
  });
});

describe('Sidebar — compare badge', () => {
  it('does not render a count badge when compareCount is 0', () => {
    vi.mocked(usePathname).mockReturnValue('/discover');
    renderSidebar();
    const compareLink = screen.getByText('Compare').closest('a');
    const badge = compareLink?.querySelector('.rounded-full');
    expect(badge).toBeNull();
  });
});

describe('Sidebar — resize handle', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/discover');
    localStorage.clear();
  });

  it('renders the resize handle', () => {
    renderSidebar();
    expect(screen.getByTestId('resize-handle')).toBeInTheDocument();
  });

  it('persists width to localStorage after double-click reset', async () => {
    renderSidebar();
    const handle = screen.getByTestId('resize-handle');
    await userEvent.dblClick(handle);
    expect(localStorage.getItem('saksham_sidebar_width')).toBe('200');
  });

  // Width is loaded from localStorage in a useEffect (client-only), so
  // the test must wait for React to flush the effect.
  it('reads persisted width from localStorage on mount', async () => {
    localStorage.setItem('saksham_sidebar_width', '320');
    const { container } = render(
      <ShellProvider>
        <Sidebar />
      </ShellProvider>
    );
    const aside = container.querySelector('aside');
    await waitFor(() => {
      expect(aside).toHaveStyle({ width: '320px' });
    });
  });

  it('clamps stored width below minimum to MIN_WIDTH on mount', async () => {
    localStorage.setItem('saksham_sidebar_width', '50');
    const { container } = render(
      <ShellProvider>
        <Sidebar />
      </ShellProvider>
    );
    const aside = container.querySelector('aside');
    await waitFor(() => {
      expect(aside).toHaveStyle({ width: '160px' });
    });
  });

  it('clamps stored width above maximum to MAX_WIDTH on mount', async () => {
    localStorage.setItem('saksham_sidebar_width', '9999');
    const { container } = render(
      <ShellProvider>
        <Sidebar />
      </ShellProvider>
    );
    const aside = container.querySelector('aside');
    await waitFor(() => {
      expect(aside).toHaveStyle({ width: '400px' });
    });
  });

  it('uses DEFAULT_WIDTH when stored value is not a number', async () => {
    localStorage.setItem('saksham_sidebar_width', 'bad');
    const { container } = render(
      <ShellProvider>
        <Sidebar />
      </ShellProvider>
    );
    const aside = container.querySelector('aside');
    // Effect fires but invalid value → stays at DEFAULT_WIDTH.
    await waitFor(() => {
      expect(aside).toHaveStyle({ width: '200px' });
    });
  });

  it('renders at DEFAULT_WIDTH before useEffect fires (SSR-safe initial state)', () => {
    const { container } = render(
      <ShellProvider>
        <Sidebar />
      </ShellProvider>
    );
    const aside = container.querySelector('aside');
    // Synchronous check — effect hasn't fired yet, must be DEFAULT_WIDTH.
    expect(aside).toHaveStyle({ width: '200px' });
  });
});

describe('Sidebar — user profile and logout modal', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/discover');
    localStorage.clear();
  });

  it('renders the user profile card with profile link', () => {
    renderSidebar();
    const profileLink = screen.getByTitle('Manage Profile');
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/profile');
    expect(screen.getByText('Rural Entrepreneur')).toBeInTheDocument();
  });

  it('shows the confirmation modal when Log out is clicked', async () => {
    renderSidebar();
    expect(screen.queryByText('Are you sure you want to log out?')).not.toBeInTheDocument();

    const logoutBtn = screen.getByText('Log out');
    await userEvent.click(logoutBtn);

    expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yes, Log Out/i })).toBeInTheDocument();
  });

  it('closes the modal when Cancel is clicked', async () => {
    renderSidebar();
    const logoutBtn = screen.getByText('Log out');
    await userEvent.click(logoutBtn);
    expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to log out?')).not.toBeInTheDocument();
    });
  });

  it('clears auth user on Yes, Log Out confirmation', async () => {
    localStorage.setItem('saksham_user', JSON.stringify({ name: 'Test User' }));
    const originalLocation = window.location;
    // @ts-expect-error Mocking window.location for test
    delete window.location;
    window.location = { href: '' } as unknown as Location;

    renderSidebar();
    const logoutBtn = screen.getByText('Log out');
    await userEvent.click(logoutBtn);

    const confirmBtn = screen.getByRole('button', { name: /Yes, Log Out/i });
    await userEvent.click(confirmBtn);

    expect(localStorage.getItem('saksham_user')).toBeNull();
    expect(window.location.href).toBe('/');

    window.location = originalLocation;
  });
});
