// tests/SakshamAIChatModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SakshamAIChatModal, parseAIMessageBlocks } from '@/components/chat/SakshamAIChatModal';
import { ShellProvider } from '@/lib/shell-context';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('SakshamAIChatModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('AI service offline (testing fallback)'))
    );
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={false} onClose={vi.fn()} />
      </ShellProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders conversational modal with greeting when isOpen is true', () => {
    render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={true} onClose={vi.fn()} />
      </ShellProvider>
    );

    expect(screen.getByRole('dialog', { name: /SAKSHAM AI Assistant/i })).toBeInTheDocument();
    expect(screen.getByText(/ai\/ Knowledge Base Live/i)).toBeInTheDocument();
    expect(
      screen.getByText(/dairy_yogurt_plant_project_report/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pmfme_scheme_guidelines/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/mathura_district_industrial_profile/i)
    ).toBeInTheDocument();
  });

  it('allows user to type a query and receive grounded AI response', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={true} onClose={vi.fn()} />
      </ShellProvider>
    );

    const input = screen.getByRole('textbox', { name: /Ask SAKSHAM AI a question/i });
    await user.type(input, 'Tell me about the 10% borrower margin{enter}');

    // Check user message is displayed
    expect(
      screen.getByText(/Tell me about the 10% borrower margin/i)
    ).toBeInTheDocument();

    // Wait for AI response
    await waitFor(() => {
      expect(
        screen.getByText(/statutory priority financing guidelines/i)
      ).toBeInTheDocument();
    });

    // Verify key points and citations from knowledge base
    expect(
      screen.getByText(/Financing Structure: 10% borrower equity margin/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/saksham_core_architecture/i)).toBeInTheDocument();
  });

  it('renders pre-feasibility response with action button for Dairy queries', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={true} onClose={vi.fn()} />
      </ShellProvider>
    );

    const input = screen.getByRole('textbox', { name: /Ask SAKSHAM AI a question/i });
    await user.type(input, 'What is the dairy yogurt plant capex and capacity?');
    const sendBtn = screen.getByRole('button', { name: /Send query/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/500-liter\/day yogurt manufacturing unit/i)
      ).toBeInTheDocument();
    });

    // Check action button to launch assessment
    const assessBtn = screen.getByRole('button', {
      name: /Start Assessment for Dairy & Livestock/i,
    });
    expect(assessBtn).toBeInTheDocument();
    await user.click(assessBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/new-assessment?idea=Dairy%20%26%20Livestock')
    );
  });

  it('triggers query automatically when initialQuery is provided', async () => {
    render(
      <ShellProvider>
        <SakshamAIChatModal
          isOpen={true}
          onClose={vi.fn()}
          initialQuery="Mathura Chhata agro cluster"
        />
      </ShellProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Mathura is an active pilot district/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getAllByText(/mathura_district_industrial_profile/i).length
    ).toBeGreaterThanOrEqual(2);
  });

  it('closes on escape or close button click', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={true} onClose={handleClose} />
      </ShellProvider>
    );

    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('resets conversation when clear chat history is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={true} onClose={vi.fn()} />
      </ShellProvider>
    );

    const input = screen.getByRole('textbox', { name: /Ask SAKSHAM AI a question/i });
    await user.type(input, 'PMFME subsidies{enter}');

    await waitFor(() => {
      expect(screen.getByText(/PMFME subsidies/i)).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /Clear chat history/i });
    await user.click(clearBtn);

    expect(screen.queryByText(/PMFME subsidies/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Hello! I am SAKSHAM AI/i)).toBeInTheDocument();
  });

  it('does not respond with enterprise data on invalid or gibberish inputs', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={true} onClose={vi.fn()} />
      </ShellProvider>
    );

    const input = screen.getByRole('textbox', { name: /Ask SAKSHAM AI a question/i });
    await user.type(input, 'asdfghjk{enter}');

    await waitFor(() => {
      expect(screen.getByText(/Input Not Recognized/i)).toBeInTheDocument();
    });

    // Verifies it does NOT fabricate Uttar Pradesh census report or dairy plant for gibberish
    expect(screen.getByText(/I could not understand that query/i)).toBeInTheDocument();
    expect(screen.queryByText(/Agra Leather Products/i)).not.toBeInTheDocument();
  });

  it('allows changing assistant language to Hindi and responds in Hindi', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={true} onClose={vi.fn()} />
      </ShellProvider>
    );

    // Find and change the language dropdown
    const langSelect = screen.getByRole('combobox', { name: /Select Assistant Language/i });
    await user.selectOptions(langSelect, 'hi');

    const input = screen.getByRole('textbox', { name: /Ask SAKSHAM AI a question/i });
    await user.type(input, '10% margin{enter}');

    await waitFor(() => {
      expect(screen.getByText(/व्यावसायिक वित्तपोषण/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/10% borrower equity margin/i)).toBeInTheDocument();
  });

  it('allows user to open Gemini API key configuration dialog and save a key', async () => {
    const user = userEvent.setup();
    render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={true} onClose={vi.fn()} />
      </ShellProvider>
    );

    const keyBtn = screen.getByRole('button', { name: /Configure Gemini API Key/i });
    await user.click(keyBtn);

    expect(screen.getByRole('heading', { name: /Google Gemini API Key/i })).toBeInTheDocument();
    const keyInput = screen.getByPlaceholderText('AIzaSy...');
    await user.type(keyInput, 'AIzaSyTestGeminiKey123');

    const saveBtn = screen.getByRole('button', { name: /Save Key/i });
    await user.click(saveBtn);

    expect(localStorage.getItem('saksham_gemini_api_key')).toBe('AIzaSyTestGeminiKey123');
  });

  it('renders markdown tables, headers, and dividers properly in assistant messages', async () => {
    const user = userEvent.setup();
    const markdownReply = `
### Quick Comparison Overview
Here is the breakdown of schemes:

| Feature | PMFME | PMEGP |
| --- | --- | --- |
| Max Loan | ₹10 Lakhs | ₹50 Lakhs |
| Subsidy | 35% | 15% - 35% |

---
**Key Insight:** Choose PMFME for agro-processing.
`;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true, answer: markdownReply }),
      })
    );

    render(
      <ShellProvider>
        <SakshamAIChatModal isOpen={true} onClose={vi.fn()} />
      </ShellProvider>
    );

    const input = screen.getByRole('textbox', { name: /Ask SAKSHAM AI a question/i });
    await user.type(input, 'Compare PMFME and PMEGP');
    const sendBtn = screen.getByRole('button', { name: /Send query/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Quick Comparison Overview/i })).toBeInTheDocument();
    });

    // Check table elements
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /PMFME/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /PMEGP/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /₹10 Lakhs/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /₹50 Lakhs/i })).toBeInTheDocument();
  });
});

describe('parseAIMessageBlocks parser', () => {
  it('correctly parses headers, tables, dividers, insights, and lists', () => {
    const raw = `
### Summary Header
Introductory text paragraph.

| Column 1 | Column 2 |
| --- | --- |
| Val A | Val B |
| Val C | Val D |

---
**Key Insight:** This is an important strategic insight.

* First bullet point
* Second bullet point

1. Step one
2. Step two
`;

    const blocks = parseAIMessageBlocks(raw);

    expect(blocks).toEqual([
      { type: 'heading', level: 3, text: 'Summary Header' },
      { type: 'paragraph', text: 'Introductory text paragraph.' },
      {
        type: 'table',
        headers: ['Column 1', 'Column 2'],
        rows: [
          ['Val A', 'Val B'],
          ['Val C', 'Val D'],
        ],
      },
      { type: 'divider' },
      { type: 'insight', text: 'This is an important strategic insight.' },
      { type: 'list', items: ['First bullet point', 'Second bullet point'], isOrdered: false },
      { type: 'list', items: ['Step one', 'Step two'], isOrdered: true },
    ]);
  });
});


