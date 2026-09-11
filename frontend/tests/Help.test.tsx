import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { HelpView } from '@/components/help/HelpView';
import { FaqAccordion } from '@/components/help/FaqAccordion';
import { ContactCard } from '@/components/help/ContactCard';
import { LearnMoreBanner } from '@/components/help/LearnMoreBanner';

describe('HelpView — full page render', () => {
  it('renders page header and main sections', () => {
    render(<HelpView />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Help & Support' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Answers, guidance, and ways to reach us.')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Frequently Asked Questions' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Still need help?' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Want to learn more?' })
    ).toBeInTheDocument();
  });
});

describe('FaqAccordion', () => {
  it('renders search input and FAQ questions', () => {
    render(<FaqAccordion />);

    expect(
      screen.getByPlaceholderText('Search questions...')
    ).toBeInTheDocument();
    expect(screen.getByText('What is SAKSHAM?')).toBeInTheDocument();
    expect(screen.getByText('How does the Fit Score work?')).toBeInTheDocument();
  });

  it('toggles FAQ item open and closed', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);

    const questionButton = screen.getByRole('button', {
      name: /What is SAKSHAM\?/i,
    });
    expect(questionButton).toHaveAttribute('aria-expanded', 'false');

    // Click to open
    await user.click(questionButton);
    expect(questionButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(/intelligent business planning platform/i)
    ).toBeInTheDocument();

    // Click to close
    await user.click(questionButton);
    expect(questionButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters FAQs by search term and clears search query', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);

    const searchInput = screen.getByPlaceholderText('Search questions...');
    await user.type(searchInput, 'language');

    // Matching item should be displayed
    expect(
      screen.getByText('How do I change the app language?')
    ).toBeInTheDocument();
    expect(screen.queryByText('What is SAKSHAM?')).not.toBeInTheDocument();

    // Clear search
    const clearButton = screen.getByRole('button', { name: 'Clear search query' });
    await user.click(clearButton);

    expect(screen.getByText('What is SAKSHAM?')).toBeInTheDocument();
  });

  it('shows zero state when no results match', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);

    const searchInput = screen.getByPlaceholderText('Search questions...');
    await user.type(searchInput, 'xyznonexistentterm123');

    expect(screen.getByText('No questions found')).toBeInTheDocument();
  });

  it('toggles mobile expansion button', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);

    const showMoreBtn = screen.getByRole('button', {
      name: /Show 5 more questions/i,
    });
    expect(showMoreBtn).toBeInTheDocument();

    await user.click(showMoreBtn);
    expect(
      screen.getByRole('button', { name: /Show fewer questions/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show fewer questions/i }));
    expect(
      screen.getByRole('button', { name: /Show 5 more questions/i })
    ).toBeInTheDocument();
  });
});

describe('ContactCard', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders email support info and feedback form', () => {
    render(<ContactCard />);

    expect(screen.getByText('support@saksham.app')).toBeInTheDocument();
    expect(screen.getByText('Email us at')).toBeInTheDocument();

    const emailLink = screen.getByRole('link', { name: 'support@saksham.app' });
    expect(emailLink).toHaveAttribute('href', 'mailto:support@saksham.app');
  });

  it('handles message typing, character limit, and submission', async () => {
    const user = userEvent.setup();
    render(<ContactCard />);

    const textarea = screen.getByPlaceholderText('Tell us how we can help...');
    const submitBtn = screen.getByRole('button', { name: /Send feedback/i });

    expect(submitBtn).toBeDisabled();

    await user.type(textarea, 'I need help with my dairy assessment');
    expect(textarea).toHaveValue('I need help with my dairy assessment');
    expect(submitBtn).not.toBeDisabled();

    await user.click(submitBtn);

    expect(
      screen.getByText('Thank you! Your feedback has been submitted successfully.')
    ).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  it('prevents submission when message is whitespace only', () => {
    render(<ContactCard />);
    const form = screen.getByPlaceholderText('Tell us how we can help...').closest('form')!;
    fireEvent.submit(form);
    expect(
      screen.queryByText('Thank you! Your feedback has been submitted successfully.')
    ).not.toBeInTheDocument();
  });
});

describe('LearnMoreBanner', () => {
  it('renders learn more banner with link to how it works', () => {
    render(<LearnMoreBanner />);

    expect(screen.getByText('Want to learn more?')).toBeInTheDocument();
    expect(
      screen.getByText('Check out our detailed guide on how SAKSHAM works.')
    ).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/how-it-works')).toBe(true);
  });
});
