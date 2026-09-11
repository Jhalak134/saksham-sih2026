import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/discover'),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}));

import { ShellProvider } from '@/lib/shell-context';
import { BottomNav } from '@/components/layout/BottomNav';
import { usePathname } from 'next/navigation';
import { BOTTOM_NAV_ITEMS } from '@/lib/constants';

function renderNav(): void {
  render(
    <ShellProvider>
      <BottomNav />
    </ShellProvider>
  );
}

describe('BottomNav — structure', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/discover');
    renderNav();
  });

  it('renders all four tab labels', () => {
    BOTTOM_NAV_ITEMS.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders a nav landmark', () => {
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();
  });
});

describe('BottomNav — active state', () => {
  it('marks Discover tab as current page on /discover', () => {
    vi.mocked(usePathname).mockReturnValue('/discover');
    renderNav();
    const discoverLink = screen.getByText('Discover').closest('a');
    expect(discoverLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks Discover as current when pathname is /', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    renderNav();
    const discoverLink = screen.getByText('Discover').closest('a');
    expect(discoverLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark Discover as current on /reports', () => {
    vi.mocked(usePathname).mockReturnValue('/reports');
    renderNav();
    const discoverLink = screen.getByText('Discover').closest('a');
    expect(discoverLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('marks My Reports as current on /reports', () => {
    vi.mocked(usePathname).mockReturnValue('/reports');
    renderNav();
    const reportsLink = screen.getByText('My Reports').closest('a');
    expect(reportsLink).toHaveAttribute('aria-current', 'page');
  });
});
