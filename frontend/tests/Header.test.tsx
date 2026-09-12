import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Header } from '@/components/layout/Header';
import { ShellProvider } from '@/lib/shell-context';

const mockPush = vi.fn();
let mockPathname = '/';
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Header Component (Exclusive AI Chatbot Search Bar & Past Sent Messages)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
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

  it('hides the search bar when on the discover page', () => {
    mockPathname = '/discover';
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    expect(screen.queryByRole('combobox', { name: /Ask SAKSHAM a question/i })).not.toBeInTheDocument();
    mockPathname = '/';
  });

  it('shows only past sent messages in the dropdown, with empty state when none exist', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.click(searchInput);

    // Dropdown listbox appears showing only past sent messages
    expect(screen.getByRole('listbox', { name: /Past sent messages/i })).toBeInTheDocument();
    expect(screen.getByText(/No past sent messages/i)).toBeInTheDocument();

    // Verifies popular ideas / categories are NOT shown
    expect(screen.queryByText(/Popular Ideas, Regions & Schemes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Retail & Kirana Store/i)).not.toBeInTheDocument();
  });

  it('submits query on Enter and directly asks AI chatbot, saving query to past messages', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.type(searchInput, 'What is the dairy yogurt plant capex?{enter}');

    // Directs directly to AI chatbot modal
    expect(screen.getByRole('dialog', { name: /SAKSHAM AI Assistant/i })).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();

    // Verify saved to localStorage
    const saved = JSON.parse(localStorage.getItem('saksham_past_sent_queries') || '[]');
    expect(saved).toContain('What is the dairy yogurt plant capex?');
  });

  it('displays past sent messages in dropdown and opens AI chat when clicked', async () => {
    localStorage.setItem(
      'saksham_past_sent_queries',
      JSON.stringify(['Dairy plant setup costs', 'PMFME 35% subsidy'])
    );

    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.click(searchInput);

    // Listbox shows past sent messages
    expect(screen.getByText(/Past Sent Messages/i)).toBeInTheDocument();
    expect(screen.getByText('Dairy plant setup costs')).toBeInTheDocument();
    expect(screen.getByText('PMFME 35% subsidy')).toBeInTheDocument();

    // Click on past query
    await user.click(screen.getByText('PMFME 35% subsidy'));

    // Directly asks AI chatbot
    expect(screen.getByRole('dialog', { name: /SAKSHAM AI Assistant/i })).toBeInTheDocument();
  });

  it('clears all past sent messages when Clear all is clicked', async () => {
    localStorage.setItem(
      'saksham_past_sent_queries',
      JSON.stringify(['Mathura Chhata agro cluster'])
    );

    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.click(searchInput);

    expect(screen.getByText('Mathura Chhata agro cluster')).toBeInTheDocument();

    const clearAllBtn = screen.getByRole('button', { name: /Clear all past messages/i });
    await user.click(clearAllBtn);

    expect(screen.queryByText('Mathura Chhata agro cluster')).not.toBeInTheDocument();
    expect(screen.getByText(/No past sent messages/i)).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.type(searchInput, 'Solar energy');
    expect(searchInput).toHaveValue('Solar energy');

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

  it('does not save invalid or symbol-only inputs to past sent messages history', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <Header />
      </ShellProvider>
    );

    const searchInput = screen.getByRole('combobox', { name: /Ask SAKSHAM a question/i });
    await user.type(searchInput, '\\{enter}');

    // Modal opens with invalid query explanation
    expect(screen.getByRole('dialog', { name: /SAKSHAM AI Assistant/i })).toBeInTheDocument();

    // Verify '\' was NOT saved to localStorage past queries
    const saved = JSON.parse(localStorage.getItem('saksham_past_sent_queries') || '[]');
    expect(saved).not.toContain('\\');
  });
});

