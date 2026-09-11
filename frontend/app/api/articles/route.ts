// app/api/articles/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export interface ArticleItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  snippet?: string;
  imageUrl?: string;
}

interface CacheEntry {
  data: ArticleItem[];
  timestamp: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL
const cache = new Map<string, CacheEntry>();

const parser = new Parser({
  customFields: {
    item: ['source', 'description', 'content:encoded'],
  },
});

function getContextualArticleImage(title: string, state: string): string {
  const t = title.toLowerCase();
  if (
    t.includes('dairy') ||
    t.includes('milk') ||
    t.includes('cattle') ||
    t.includes('cow') ||
    t.includes('butter')
  ) {
    return 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80';
  }
  if (
    t.includes('textile') ||
    t.includes('cloth') ||
    t.includes('garment') ||
    t.includes('weaver') ||
    t.includes('handloom') ||
    t.includes('fabric') ||
    t.includes('silk') ||
    t.includes('cotton')
  ) {
    return 'https://images.unsplash.com/photo-1617083934555-563d67b2d561?auto=format&fit=crop&w=800&q=80';
  }
  if (
    t.includes('solar') ||
    t.includes('clean energy') ||
    t.includes('renewable') ||
    t.includes('power') ||
    t.includes('green energy')
  ) {
    return 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80';
  }
  if (
    t.includes('agri') ||
    t.includes('farm') ||
    t.includes('crop') ||
    t.includes('harvest') ||
    t.includes('food') ||
    t.includes('grain')
  ) {
    return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80';
  }
  if (
    t.includes('retail') ||
    t.includes('store') ||
    t.includes('kirana') ||
    t.includes('shop') ||
    t.includes('market') ||
    t.includes('seller') ||
    t.includes('ecommerce') ||
    t.includes('amazon') ||
    t.includes('flipkart') ||
    t.includes('walmart')
  ) {
    return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
  }
  if (
    t.includes('factory') ||
    t.includes('manufactur') ||
    t.includes('industrial') ||
    t.includes('machin') ||
    t.includes('industry') ||
    t.includes('plant') ||
    t.includes('mou') ||
    t.includes('cluster') ||
    t.includes('park')
  ) {
    return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80';
  }
  if (
    t.includes('bank') ||
    t.includes('loan') ||
    t.includes('fund') ||
    t.includes('credit') ||
    t.includes('invest') ||
    t.includes('crore') ||
    t.includes('finance') ||
    t.includes('gold loan') ||
    t.includes('sidbi') ||
    t.includes('hdfc')
  ) {
    return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80';
  }
  if (
    t.includes('handicraft') ||
    t.includes('pottery') ||
    t.includes('artisan') ||
    t.includes('wood') ||
    t.includes('odop')
  ) {
    return 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80';
  }
  // Default MSME business image
  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';
}

function cleanSnippet(raw: string | undefined, title: string, state: string): string {
  if (!raw) {
    return `Latest MSME business policy, trade opportunities, and market updates from ${state}.`;
  }
  // Strip HTML tags
  const clean = raw.replace(/<[^>]*>?/gm, '').trim();
  // If the snippet is just the title + source, make a nice contextual summary
  if (clean.length === 0 || clean.toLowerCase() === title.toLowerCase()) {
    return `Latest MSME enterprise insights, sector growth, and government updates for ${state}.`;
  }
  return clean;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const rawState = searchParams.get('state')?.trim();
    const state = rawState && rawState.length > 0 ? rawState : 'India';
    const cacheKey = state.toLowerCase();

    // Check in-memory cache
    const cached = cache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    // Construct Google News RSS query URL
    const query = `${state} business MSME`;
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;

    const feed = await parser.parseURL(rssUrl);

    const articles: ArticleItem[] = (feed.items || [])
      .slice(0, 6)
      .map((item) => {
        const fullTitle = item.title || 'Untitled Article';
        const lastDashIndex = fullTitle.lastIndexOf(' - ');

        let title = fullTitle;
        let source = 'Google News';

        if (lastDashIndex !== -1) {
          title = fullTitle.substring(0, lastDashIndex).trim();
          source = fullTitle.substring(lastDashIndex + 3).trim();
        }

        // Check if rss-parser extracted a dedicated source field
        if (typeof item.source === 'string' && item.source.trim()) {
          source = item.source.trim();
        } else if (
          typeof item.source === 'object' &&
          item.source !== null &&
          '_' in item.source &&
          typeof (item.source as { _: string })._ === 'string'
        ) {
          source = (item.source as { _: string })._.trim();
        }

        const snippet = cleanSnippet(item.contentSnippet || item.content, title, state);
        const imageUrl = getContextualArticleImage(title, state);

        return {
          title,
          link: item.link || '#',
          source,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          snippet,
          imageUrl,
        };
      });

    // Store in cache
    cache.set(cacheKey, {
      data: articles,
      timestamp: now,
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching/parsing articles RSS feed:', error);

    // Return empty array gracefully without crashing
    return NextResponse.json([], { status: 200 });
  }
}
