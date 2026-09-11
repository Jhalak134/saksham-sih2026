import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ComparePage from '@/app/(shell)/compare/page';
import { ShellProvider } from '@/lib/shell-context';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('ComparePage', () => {
  it('renders CompareScreen inside Suspense', () => {
    render(
      <ShellProvider>
        <ComparePage />
      </ShellProvider>
    );
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByText('Dairy vs Food Processing')).toBeInTheDocument();
  });
});
