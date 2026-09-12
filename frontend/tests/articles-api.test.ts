import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { GET, getContextualArticleImage, isBusinessArticle } from '@/app/api/articles/route';

describe('Articles API Route (/api/articles)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    mockParseURL.mockReset();
    process.env = { ...originalEnv };
    delete process.env.GNEWS_API_KEY;
    delete process.env.NEWS_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('fetches and returns parsed articles with max 6 items from RSS feed', async () => {
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

  it('preserves native Bing <News:Image> and upgrades http to https', async () => {
    mockParseURL.mockResolvedValueOnce({
      items: [
        {
          title: 'Leather Footwear Industry Gets Major Grant in Agra - TOI',
          link: 'http://www.bing.com/news/apiclick.aspx?url=https%3a%2f%2ftimesofindia.com%2farticle1',
          newsImage: 'http://www.bing.com/th?id=ORMS.sample123&pid=News',
          newsSource: 'Times of India',
          pubDate: '2026-09-12T00:00:00.000Z',
        },
      ],
    });

    const request = new Request('http://localhost:3000/api/articles?state=UttarPradesh');
    const response = await GET(request);
    const data = await response.json();

    expect(data[0].title).toBe('Leather Footwear Industry Gets Major Grant in Agra');
    expect(data[0].source).toBe('Times of India');
    expect(data[0].link).toBe('https://timesofindia.com/article1');
    expect(data[0].imageUrl).toBe('https://www.bing.com/th?id=ORMS.sample123&pid=News');
  });

  it('fetches directly from GNews API when GNEWS_API_KEY is configured', async () => {
    process.env.GNEWS_API_KEY = 'test-gnews-key';

    const mockGNewsResponse = {
      totalArticles: 1,
      articles: [
        {
          title: 'UP Startups Raise ₹500 Cr in Seed Funding',
          description: 'Venture funds expand incubation in Uttar Pradesh.',
          content: 'Full article text...',
          url: 'https://example.com/startup-funding',
          image: 'https://images.example.com/authentic-publisher-photo.jpg',
          publishedAt: '2026-09-12T08:00:00Z',
          source: { name: 'VentureDaily', url: 'https://example.com' },
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGNewsResponse,
    } as Response);

    const request = new Request('http://localhost:3000/api/articles?state=UttarPradeshGNews');
    const response = await GET(request);
    const data = await response.json();

    expect(fetchSpy).toHaveBeenCalled();
    expect(data[0].title).toBe('UP Startups Raise ₹500 Cr in Seed Funding');
    expect(data[0].source).toBe('VentureDaily');
    expect(data[0].imageUrl).toBe('https://images.example.com/authentic-publisher-photo.jpg');
    expect(data[0].link).toBe('https://example.com/startup-funding');
  });

  it('fetches directly from NewsAPI when NEWS_API_KEY is configured', async () => {
    process.env.NEWS_API_KEY = 'test-newsapi-key';

    const mockNewsApiResponse = {
      status: 'ok',
      totalResults: 1,
      articles: [
        {
          title: 'Electric Vehicle Policy Unveiled for Maharashtra MSMEs',
          description: 'Subsidies announced for commercial EV manufacturing.',
          url: 'https://example.com/ev-policy',
          urlToImage: 'https://images.example.com/ev-photo.jpg',
          publishedAt: '2026-09-12T09:00:00Z',
          source: { name: 'AutoEnterprise' },
        },
      ],
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockNewsApiResponse,
    } as Response);

    const request = new Request('http://localhost:3000/api/articles?state=MaharashtraEV');
    const response = await GET(request);
    const data = await response.json();

    expect(data[0].title).toBe('Electric Vehicle Policy Unveiled for Maharashtra MSMEs');
    expect(data[0].source).toBe('AutoEnterprise');
    expect(data[0].imageUrl).toBe('https://images.example.com/ev-photo.jpg');
  });

  it('gracefully falls back to RSS when GNews API returns HTTP 429 quota error', async () => {
    process.env.GNEWS_API_KEY = 'rate-limited-key';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    } as Response);

    mockParseURL.mockResolvedValueOnce({
      items: [
        {
          title: 'Fallback Solar Park Approved for Tamil Nadu - Hindu',
          link: 'https://thehindu.com/solar',
          pubDate: '2026-09-12T00:00:00.000Z',
        },
      ],
    });

    const request = new Request('http://localhost:3000/api/articles?state=TamilNaduFallback');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0].title).toBe('Fallback Solar Park Approved for Tamil Nadu');
  });

  it('handles empty feed or failures gracefully returning an empty array', async () => {
    mockParseURL.mockRejectedValue(new Error('Feed timeout'));

    const request = new Request('http://localhost:3000/api/articles?state=UnknownRegionFailed');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it('getContextualArticleImage generates thematic, diverse images across sectors', () => {
    const leatherImg = getContextualArticleImage('Agra Footwear cluster gets new subsidy', 'tannery');
    const solarImg = getContextualArticleImage('Rooftop solar initiative launched in Gujarat');
    const dairyImg = getContextualArticleImage('Cow milk yields surge in dairy cooperative');

    expect(leatherImg).toBeDefined();
    expect(solarImg).toBeDefined();
    expect(dairyImg).toBeDefined();

    // Verify different sectors receive different sector images
    expect(leatherImg).not.toBe(solarImg);
    expect(solarImg).not.toBe(dairyImg);
  });

  it('isBusinessArticle validates genuine state business news and filters non-business content', () => {
    // Valid business, industry, trade headlines
    expect(isBusinessArticle('UP Rolls Out Leather and Footwear Policy With Investment Incentives')).toBe(true);
    expect(isBusinessArticle('Maharashtra Plans 5,000-Acre Chemical Parks, ₹1,000-Crore Innovation Fund')).toBe(true);
    expect(isBusinessArticle('Gujarat eyes Rs 17L crore investment from data centre push')).toBe(true);
    expect(isBusinessArticle('Textile MSMEs receive export subsidy in Tirupur')).toBe(true);

    // Negative non-business headlines (crime, accidents, entertainment, sports)
    expect(isBusinessArticle('Three arrested in Lucknow murder case by city police')).toBe(false);
    expect(isBusinessArticle('Bollywood actor visits temple in Varanasi for movie trailer launch')).toBe(false);
    expect(isBusinessArticle('India defeats Australia in thrilling T20 cricket match')).toBe(false);
    expect(isBusinessArticle('Traffic diversion in Pune following road accident')).toBe(false);
  });
});

