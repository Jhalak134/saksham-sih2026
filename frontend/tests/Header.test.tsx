import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Header } from '@/components/layout/Header';
import { ShellProvider } from '@/lib/shell-context';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Header Component (Exclusive Functioning Search Bar)', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders only the search bar in place of location and capital chips', () => {
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    // Search bar is rendered
    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute(
      'placeholder',
      expect.stringContaining('Ask SAKSHAM anything...')
    );

    // Location & Capital chips are removed
    expect(screen.queryByLabelText(/Current location/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Capital:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Telangana/i)).not.toBeInTheDocument();
  });

  it('shows autocomplete suggestions on focus/typing and navigates on selection', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.click(searchInput);

    // Dropdown listbox appears
    expect(screen.getByRole('listbox', { name: /Search suggestions/i })).toBeInTheDocument();
    expect(screen.getByText(/Dairy & Livestock/i)).toBeInTheDocument();

    // Type "Textiles"
    await user.type(searchInput, 'Textiles');
    expect(screen.getByText(/Assess "Textiles"/i)).toBeInTheDocument();

    // Click on suggestion
    const textileOption = screen.getByText(/Textiles & Handloom/i);
    await user.click(textileOption);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/new-assessment?idea=Textiles%20%26%20Handloom')
    );
  });

  it('submits form on enter and redirects to new assessment', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.type(searchInput, 'Bakery shop{enter}');

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/new-assessment?idea=Bakery%20shop')
    );
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.type(searchInput, 'Solar');
    expect(searchInput).toHaveValue('Solar');

    const clearBtn = screen.getByRole('button', { name: /Clear search input/i });
    await user.click(clearBtn);

    expect(searchInput).toHaveValue('');
  });
});
