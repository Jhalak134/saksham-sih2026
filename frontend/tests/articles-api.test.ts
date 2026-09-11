import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockParseURL } = vi.hoisted(() => ({
  mockParseURL: vi.fn(),
}));

vi.mock('rss-parser', () => {
  return {
    default: class MockParser {
      parseURL = mockParseURL;
    },
  };
});

import { GET } from '@/app/api/articles/route';

describe('Articles API Route (/api/articles)', () => {
  beforeEach(() => {
    mockParseURL.mockReset();
  });

  it('fetches and returns parsed articles with max 6 items', async () => {
    const mockItems = Array.from({ length: 10 }, (_, i) => ({
      title: `MSME Growth Story ${i + 1} - Economic Times`,
      link: `https://news.google.com/story-${i + 1}`,
      pubDate: '2026-09-11T12:00:00.000Z',
      isoDate: '2026-09-11T12:00:00.000Z',
    }));

    mockParseURL.mockResolvedValueOnce({
      items: mockItems,
    });

    const request = new Request('http://localhost:3000/api/articles?state=Kerala');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(6);
    expect(data[0]).toEqual(
      expect.objectContaining({
        title: 'MSME Growth Story 1',
        source: 'Economic Times',
        link: 'https://news.google.com/story-1',
        publishedAt: '2026-09-11T12:00:00.000Z',
      })
    );
    expect(data[0].snippet).toBeDefined();
    expect(data[0].imageUrl).toBeDefined();
  });

  it('handles empty feed or failures gracefully returning an empty array', async () => {
    mockParseURL.mockRejectedValueOnce(new Error('Feed timeout'));

    const request = new Request('http://localhost:3000/api/articles?state=UnknownRegion');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });
});
