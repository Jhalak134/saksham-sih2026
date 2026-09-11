import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, className, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}));

const mockQueryAI = vi.fn();

vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/api-client');
  return {
    ...actual,
    queryAI: (...args: unknown[]) => mockQueryAI(...args),
  };
});

import { ShellProvider } from '@/lib/shell-context';
import { Header } from '@/components/layout/Header';

function renderHeader(): void {
  render(
    <ShellProvider>
      <Header />
    </ShellProvider>
  );
}

describe('Header — Global AI Search Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder and prompt in header', () => {
    renderHeader();
    const searchInputs = screen.getAllByRole('searchbox');
    expect(searchInputs.length).toBeGreaterThanOrEqual(1);
    expect(searchInputs[0]).toHaveAttribute(
      'placeholder',
      expect.stringContaining('Ask SAKSHAM anything')
    );
  });

  it('does not submit or call queryAI when input is empty or whitespace', async () => {
    renderHeader();
    const forms = screen.getAllByRole('search');
    fireEvent.submit(forms[0]);
    expect(mockQueryAI).not.toHaveBeenCalled();
  });

  it('submits query on form submit, shows loading, and renders grounded AI advisory modal', async () => {
    mockQueryAI.mockResolvedValueOnce({
      available: true,
      source: 'ai_service',
      summary: 'Dairy farming around Bera benefits from established Mat block milk routes.',
      explanation: 'Bera is an active rural settlement in Mat block with significant buffalo milk production.',
      recommendation: 'Establish chilling collection center.',
      key_points: ['Dense dairy population', 'Proximity to Yamuna Expressway transit'],
      citations: [
        {
          source: 'business_knowledge/dairy_yogurt_plant_project_report.pdf',
          title: 'Project Report: Yogurt Plant Unit',
          page_start: 3,
          page_end: 3,
          chunk_id: 'dairy_yogurt_plant_project_report_p003_c001',
          excerpt: 'India Yogurt Market is projected to witness robust growth.',
          is_template_data: true,
          document_id: 'dairy_yogurt_plant_project_report',
        },
      ],
      limitations: ['Milk spoilage risk in summer months.'],
      warnings: ['Strict cold-chain hygiene required.'],
      grounding_status: 'grounded',
      retrieval_status: 'grounded',
      evidence_available: true,
      result_count: 1,
    });

    renderHeader();
    const searchInput = screen.getAllByRole('searchbox')[0];
    await userEvent.type(searchInput, 'What dairy opportunities exist in Bera?');

    const form = screen.getAllByRole('search')[0];
    fireEvent.submit(form);

    expect(mockQueryAI).toHaveBeenCalledWith({
      query: 'What dairy opportunities exist in Bera?',
      language: 'en',
      top_k: 5,
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('SAKSHAM AI Advisory')).toBeInTheDocument();
      expect(screen.getByText('Grounded Evidence')).toBeInTheDocument();
      expect(screen.getByText(/Bera is an active rural settlement/i)).toBeInTheDocument();
      expect(screen.getByText('Dense dairy population')).toBeInTheDocument();
      expect(screen.getByText('Project Report: Yogurt Plant Unit')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Template / Model Estimate')).toBeInTheDocument();
      expect(screen.getByText(/Milk spoilage risk in summer months/i)).toBeInTheDocument();
      expect(screen.getByText(/Strict cold-chain hygiene required/i)).toBeInTheDocument();
    });
  });

  it('displays error alert and retry button when AI query fails', async () => {
    mockQueryAI.mockRejectedValueOnce(
      new Error('AI advisory service is currently unavailable. Please try again later.')
    );

    renderHeader();
    const searchInput = screen.getAllByRole('searchbox')[0];
    await userEvent.type(searchInput, 'Failing query');
    const form = screen.getAllByRole('search')[0];
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/AI advisory service is currently unavailable/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry inquiry/i })).toBeInTheDocument();
    });

    // Test retry
    mockQueryAI.mockResolvedValueOnce({
      available: true,
      source: 'ai_service',
      summary: 'Recovered advice.',
      explanation: 'Recovered advice successfully.',
      recommendation: 'Proceed.',
      key_points: [],
      citations: [],
      limitations: [],
      warnings: [],
      grounding_status: 'partial',
      retrieval_status: 'partial',
      evidence_available: false,
      result_count: 0,
    });

    await userEvent.click(screen.getByRole('button', { name: /retry inquiry/i }));
    await waitFor(() => {
      expect(screen.getByText(/Recovered advice successfully/i)).toBeInTheDocument();
      expect(screen.getByText('🟡 Partially Grounded')).toBeInTheDocument();
    });
  });

  it('closes dialog when Close button is clicked', async () => {
    mockQueryAI.mockResolvedValueOnce({
      available: true,
      source: 'ai_service',
      summary: 'Advice.',
      explanation: 'Advice.',
      recommendation: 'Advice.',
      key_points: [],
      citations: [],
      limitations: [],
      warnings: [],
      grounding_status: 'no_match',
      retrieval_status: 'no_match',
      evidence_available: false,
      result_count: 0,
    });

    renderHeader();
    const searchInput = screen.getAllByRole('searchbox')[0];
    await userEvent.type(searchInput, 'General query');
    fireEvent.submit(screen.getAllByRole('search')[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    await userEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
