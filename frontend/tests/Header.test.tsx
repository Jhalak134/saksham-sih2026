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

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Header Component (Exclusive Functioning Search Bar & AI Chatbot)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('AI service offline (fallback)'))
    );
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

  it('opens SAKSHAM AI Chatbot modal when Ask AI button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const askAiBtn = screen.getByRole('button', { name: /Ask SAKSHAM AI/i });
    expect(askAiBtn).toBeInTheDocument();
    await user.click(askAiBtn);

    // Modal dialog opens
    expect(screen.getByRole('dialog', { name: /SAKSHAM AI Assistant/i })).toBeInTheDocument();
    expect(screen.getByText(/ai\/ Knowledge Base Live/i)).toBeInTheDocument();
  });

  it('opens SAKSHAM AI Chatbot modal when conversational question is submitted', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.type(searchInput, 'What subsidies are available under PMFME?{enter}');

    // Does not redirect to new assessment, opens chatbot modal instead
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: /SAKSHAM AI Assistant/i })).toBeInTheDocument();
  });

  it('opens SAKSHAM AI Chatbot modal when clicking AI Chatbot option in dropdown', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.click(searchInput);

    const aiOption = screen.getByText(/Chat with SAKSHAM AI Assistant/i);
    await user.click(aiOption);

    expect(screen.getByRole('dialog', { name: /SAKSHAM AI Assistant/i })).toBeInTheDocument();
  });
});

