import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { StateArticles } from '@/components/discover/StateArticles';
import { ShellProvider } from '@/lib/shell-context';

const mockArticles = [
  {
    title: 'UP MSME Sector Receives ₹1000 Crore Boost for Rural Artisans',
    link: 'https://news.google.com/sample-article-1',
    source: 'Financial Express',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'New Dairy Subsidies Announced for Small Scale Farmers in India',
    link: 'https://news.google.com/sample-article-2',
    source: 'The Hindu',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

describe('StateArticles Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders section header with default state "India" and allows sliding between articles', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockArticles),
        })
      )
    );

    render(
      <ShellProvider>
        <StateArticles selectedState={null} />
      </ShellProvider>
    );

    expect(screen.getByText(/News · India/i)).toBeInTheDocument();
    expect(screen.getByText(/Live business & MSME updates/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText('UP MSME Sector Receives ₹1000 Crore Boost for Rural Artisans')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Financial Express')).toBeInTheDocument();

    // Click next slide arrow to see second article
    const nextBtn = screen.getByRole('button', { name: /Next article/i });
    await user.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('The Hindu')).toBeInTheDocument();
      expect(
        screen.getByText('New Dairy Subsidies Announced for Small Scale Farmers in India')
      ).toBeInTheDocument();
    });
  });

  it('renders section header with specific state name and fetches for that state', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockArticles),
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ShellProvider>
        <StateArticles selectedState="Maharashtra" />
      </ShellProvider>
    );

    expect(screen.getByText(/News · Maharashtra/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/articles?state=Maharashtra');
    });
  });

  it('renders empty state when no articles are returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      )
    );

    render(
      <ShellProvider>
        <StateArticles selectedState="Goa" />
      </ShellProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No recent articles found')).toBeInTheDocument();
    });
  });

  it('renders error state gracefully when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.reject(new Error('Network error'))
      )
    );

    render(
      <ShellProvider>
        <StateArticles selectedState="Punjab" />
      </ShellProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Unable to load news at this moment/i)).toBeInTheDocument();
    });
  });

  it('article cards link out to original articles and contain card thumbnail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockArticles),
        })
      )
    );

    render(
      <ShellProvider>
        <StateArticles selectedState="Uttar Pradesh" />
      </ShellProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText('UP MSME Sector Receives ₹1000 Crore Boost for Rural Artisans')
      ).toBeInTheDocument();
    });

    const link = screen.getByRole('link', {
      name: /UP MSME Sector Receives ₹1000 Crore Boost for Rural Artisans/i,
    });
    expect(link).toHaveAttribute('href', 'https://news.google.com/sample-article-1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    // Confirm img element exists in the component
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
  });

  it('automatically advances to next slide after 3 seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockArticles),
        })
      )
    );

    render(
      <ShellProvider>
        <StateArticles selectedState="Uttar Pradesh" />
      </ShellProvider>
    );

    // Initial state: first article displayed
    await vi.waitFor(() => {
      expect(
        screen.getByText('UP MSME Sector Receives ₹1000 Crore Boost for Rural Artisans')
      ).toBeInTheDocument();
    });

    // Advance clock by 3000ms
    vi.advanceTimersByTime(3000);

    // Second article should now be visible
    await vi.waitFor(() => {
      expect(
        screen.getByText('New Dairy Subsidies Announced for Small Scale Farmers in India')
      ).toBeInTheDocument();
    });

    // Advance another 3000ms: loops back to first article
    vi.advanceTimersByTime(3000);

    await vi.waitFor(() => {
      expect(
        screen.getByText('UP MSME Sector Receives ₹1000 Crore Boost for Rural Artisans')
      ).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('allows pausing and resuming auto slide via toggle button', async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockArticles),
        })
      )
    );

    render(
      <ShellProvider>
        <StateArticles selectedState="Gujarat" />
      </ShellProvider>
    );

    await vi.waitFor(() => {
      expect(
        screen.getByText('UP MSME Sector Receives ₹1000 Crore Boost for Rural Artisans')
      ).toBeInTheDocument();
    });

    // Click pause button
    const pauseBtn = screen.getByRole('button', { name: /Pause auto slide/i });
    fireEvent.click(pauseBtn);

    // Advance by 6 seconds (2 cycles) - should remain paused on first article
    vi.advanceTimersByTime(6000);

    expect(
      screen.getByText('UP MSME Sector Receives ₹1000 Crore Boost for Rural Artisans')
    ).toBeInTheDocument();

    // Click resume button
    const playBtn = screen.getByRole('button', { name: /Resume auto slide/i });
    fireEvent.click(playBtn);

    // Advance by 3 seconds - should advance to second article
    vi.advanceTimersByTime(3000);

    await vi.waitFor(() => {
      expect(
        screen.getByText('New Dairy Subsidies Announced for Small Scale Farmers in India')
      ).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('allows clicking indicator dots to jump directly to a slide', async () => {
    vi.useRealTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockArticles),
        })
      )
    );

    render(
      <ShellProvider>
        <StateArticles selectedState="Rajasthan" />
      </ShellProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText('UP MSME Sector Receives ₹1000 Crore Boost for Rural Artisans')
      ).toBeInTheDocument();
    });

    // Click slide dot 2
    const dot2 = screen.getByRole('button', { name: /Go to slide 2/i });
    fireEvent.click(dot2);

    await waitFor(() => {
      expect(
        screen.getByText('New Dairy Subsidies Announced for Small Scale Farmers in India')
      ).toBeInTheDocument();
    });
  });
});
