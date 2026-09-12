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

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL
const cache = new Map<string, CacheEntry>();

// RSS parser with custom fields for Bing News XML <News:Image> and <News:Source>
const parser = new Parser({
  customFields: {
    item: [
      ['News:Image', 'newsImage'],
      ['News:Source', 'newsSource'],
      'source',
      'description',
      'content:encoded',
      'enclosure',
      'media:content',
    ],
  },
});

/**
 * Deterministic string hash to stably distribute articles across varied image pools.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ─────────────────── DIVERSE CONTEXTUAL IMAGE POOLS ───────────────────
const SECTOR_IMAGE_POOLS: Record<string, string[]> = {
  leather: [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&q=80',
  ],
  textile: [
    'https://images.unsplash.com/photo-1617083934555-563d67b2d561?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
  ],
  dairy: [
    'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80',
  ],
  agri: [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=800&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  ],
  ev: [
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
  ],
  solar: [
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
  ],
  tech: [
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80',
  ],
  defense: [
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  ],
  handicraft: [
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
  ],
  finance: [
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=800&q=80',
  ],
  logistics: [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80',
  ],
  retail: [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=800&q=80',
  ],
  healthcare: [
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
  ],
  infrastructure: [
    'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=800&q=80',
  ],
  general: [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=800&q=80',
  ],
};

/**
 * Maps article context to a diverse, thematic image pool with stable title-hashing.
 */
export function getContextualArticleImage(title: string, snippet: string = ''): string {
  const text = `${title} ${snippet}`.toLowerCase();

  let category = 'general';

  if (
    text.includes('leather') ||
    text.includes('footwear') ||
    text.includes('shoe') ||
    text.includes('tannery') ||
    text.includes('tanning')
  ) {
    category = 'leather';
  } else if (
    text.includes('textile') ||
    text.includes('cloth') ||
    text.includes('garment') ||
    text.includes('weaver') ||
    text.includes('handloom') ||
    text.includes('fabric') ||
    text.includes('silk') ||
    text.includes('cotton') ||
    text.includes('apparel')
  ) {
    category = 'textile';
  } else if (
    text.includes('dairy') ||
    text.includes('milk') ||
    text.includes('cattle') ||
    text.includes('cow') ||
    text.includes('butter') ||
    text.includes('ghee')
  ) {
    category = 'dairy';
  } else if (
    text.includes('agri') ||
    text.includes('farm') ||
    text.includes('crop') ||
    text.includes('harvest') ||
    text.includes('grain') ||
    text.includes('horticulture')
  ) {
    category = 'agri';
  } else if (
    text.includes('food') ||
    text.includes('spice') ||
    text.includes('bakery') ||
    text.includes('snack') ||
    text.includes('processing') ||
    text.includes('cold chain')
  ) {
    category = 'food';
  } else if (
    text.includes('ev') ||
    text.includes('electric vehicle') ||
    text.includes('mobility') ||
    text.includes('auto') ||
    text.includes('motor') ||
    text.includes('vehicle') ||
    text.includes('battery')
  ) {
    category = 'ev';
  } else if (
    text.includes('solar') ||
    text.includes('clean energy') ||
    text.includes('renewable') ||
    text.includes('power') ||
    text.includes('green energy') ||
    text.includes('wind')
  ) {
    category = 'solar';
  } else if (
    text.includes('tech') ||
    text.includes('startup') ||
    text.includes('software') ||
    text.includes('digital') ||
    text.includes('app') ||
    text.includes('ai') ||
    text.includes('electronics') ||
    text.includes('innovation')
  ) {
    category = 'tech';
  } else if (
    text.includes('defense') ||
    text.includes('defence') ||
    text.includes('aerospace') ||
    text.includes('engineering') ||
    text.includes('machin') ||
    text.includes('corridor')
  ) {
    category = 'defense';
  } else if (
    text.includes('handicraft') ||
    text.includes('pottery') ||
    text.includes('artisan') ||
    text.includes('wood') ||
    text.includes('odop') ||
    text.includes('brass')
  ) {
    category = 'handicraft';
  } else if (
    text.includes('bank') ||
    text.includes('loan') ||
    text.includes('fund') ||
    text.includes('credit') ||
    text.includes('invest') ||
    text.includes('crore') ||
    text.includes('finance') ||
    text.includes('sidbi') ||
    text.includes('subsidy') ||
    text.includes('mudra')
  ) {
    category = 'finance';
  } else if (
    text.includes('logistics') ||
    text.includes('freight') ||
    text.includes('warehouse') ||
    text.includes('shipping') ||
    text.includes('cargo') ||
    text.includes('port') ||
    text.includes('supply chain')
  ) {
    category = 'logistics';
  } else if (
    text.includes('retail') ||
    text.includes('store') ||
    text.includes('kirana') ||
    text.includes('shop') ||
    text.includes('market') ||
    text.includes('seller') ||
    text.includes('ecommerce') ||
    text.includes('e-commerce')
  ) {
    category = 'retail';
  } else if (
    text.includes('pharma') ||
    text.includes('health') ||
    text.includes('medical') ||
    text.includes('medicine') ||
    text.includes('drug')
  ) {
    category = 'healthcare';
  } else if (
    text.includes('factory') ||
    text.includes('manufactur') ||
    text.includes('industrial') ||
    text.includes('plant') ||
    text.includes('cluster') ||
    text.includes('park') ||
    text.includes('construction') ||
    text.includes('infrastructure')
  ) {
    category = 'infrastructure';
  }

  const pool = SECTOR_IMAGE_POOLS[category] || SECTOR_IMAGE_POOLS.general;
  const hash = Math.abs(hashString(title));
  return pool[hash % pool.length];
}


// ─────────────────── STRICT BUSINESS RELEVANCE FILTERS ───────────────────
const NEGATIVE_NON_BUSINESS_TOPICS = [
  'murder',
  'killed',
  'arrested',
  'rape',
  'police custody',
  'crime',
  'encounter',
  'accident',
  'ipl match',
  't20',
  'cricket',
  'box office',
  'bollywood',
  'actor',
  'actress',
  'trailer',
  'suicide',
  'cheat',
  'scamster caught',
];

const POSITIVE_BUSINESS_KEYWORDS = [
  'business',
  'msme',
  'industry',
  'industrial',
  'enterprise',
  'enterprises',
  'startup',
  'startups',
  'investment',
  'investor',
  'investments',
  'trade',
  'export',
  'exports',
  'import',
  'manufacturing',
  'manufacture',
  'factory',
  'commerce',
  'commercial',
  'economy',
  'economic',
  'market',
  'markets',
  'subsidy',
  'subsidies',
  'loan',
  'loans',
  'credit',
  'bank',
  'banking',
  'finance',
  'financial',
  'crore',
  'lakh',
  'artisan',
  'handloom',
  'textile',
  'textiles',
  'agro',
  'agriculture',
  'agricultural',
  'dairy',
  'farm',
  'farming',
  'crop',
  'crops',
  'production',
  'cluster',
  'odop',
  'retail',
  'store',
  'gst',
  'tax',
  'revenue',
  'incentive',
  'policy',
  'infrastructure',
  'logistics',
  'transport',
  'ev',
  'solar',
  'green energy',
  'hydrogen',
  'employment',
  'jobs',
  'entrepreneur',
  'entrepreneurs',
  'corporate',
  'gem',
  'procurement',
  'park',
  'chemical',
  'chemicals',
  'leather',
  'footwear',
  'electronics',
  'hardware',
  'software',
  'pharma',
  'port',
  'corridor',
  'summit',
  'mou',
  'scheme',
  'growth',
];

/**
 * Validates that an article is genuinely about business, economy, commerce, or industry.
 */
export function isBusinessArticle(title: string, snippet: string = ''): boolean {
  const text = `${title} ${snippet}`.toLowerCase();

  // Exclude explicit non-business topics (crime, sports, celebrity)
  for (const negative of NEGATIVE_NON_BUSINESS_TOPICS) {
    if (text.includes(negative)) {
      return false;
    }
  }

  // Require at least one genuine business, MSME, or economic keyword
  for (const keyword of POSITIVE_BUSINESS_KEYWORDS) {
    if (text.includes(keyword)) {
      return true;
    }
  }

  return false;
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

/**
 * Extracts a clean destination URL from Bing click-tracking wrapper if present.
 */
function cleanArticleUrl(rawUrl: string): string {
  if (!rawUrl) return '#';
  try {
    const parsed = new URL(rawUrl);
    const destUrl = parsed.searchParams.get('url');
    if (destUrl && (destUrl.startsWith('http://') || destUrl.startsWith('https://'))) {
      return destUrl;
    }
  } catch {
    // Return original if parsing fails
  }
  return rawUrl;
}

/**
 * Approach 3: Fetch directly from GNews.io API with strict business category.
 */
export async function fetchFromGNews(state: string, apiKey: string): Promise<ArticleItem[] | null> {
  try {
    // Restrict query to state and business category
    const query = `"${state}" AND (business OR MSME OR industry OR startup OR trade OR investment OR economy)`;
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&category=business&lang=en&country=in&max=10&apikey=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      console.warn(`GNews API returned status ${res.status}: ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    if (!json || !Array.isArray(json.articles) || json.articles.length === 0) {
      return null;
    }

    const parsedArticles: ArticleItem[] = [];

    for (const item of json.articles) {
      const title = item.title || 'Untitled Article';
      const snippet = cleanSnippet(item.description || item.content, title, state);

      // Verify business relevance
      if (!isBusinessArticle(title, snippet) && parsedArticles.length > 0) {
        continue;
      }

      const imageUrl =
        item.image && typeof item.image === 'string' && item.image.startsWith('http')
          ? item.image
          : getContextualArticleImage(title, snippet);

      parsedArticles.push({
        title,
        link: item.url || '#',
        source: item.source?.name || 'News',
        publishedAt: item.publishedAt || new Date().toISOString(),
        snippet,
        imageUrl,
      });

      if (parsedArticles.length >= 6) break;
    }

    return parsedArticles.length > 0 ? parsedArticles : null;
  } catch (err) {
    console.error('Error in fetchFromGNews:', err);
    return null;
  }
}

/**
 * Approach 3 Alternative: Fetch directly from NewsAPI.org with business scope.
 */
export async function fetchFromNewsApi(state: string, apiKey: string): Promise<ArticleItem[] | null> {
  try {
    const query = `"${state}" AND (business OR MSME OR industry OR economy OR startup OR commerce)`;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=10&apiKey=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      console.warn(`NewsAPI returned status ${res.status}: ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    if (!json || !Array.isArray(json.articles) || json.articles.length === 0) {
      return null;
    }

    const parsedArticles: ArticleItem[] = [];

    for (const item of json.articles) {
      const title = item.title || 'Untitled Article';
      const snippet = cleanSnippet(item.description || item.content, title, state);

      if (!isBusinessArticle(title, snippet) && parsedArticles.length > 0) {
        continue;
      }

      const imageUrl =
        item.urlToImage && typeof item.urlToImage === 'string' && item.urlToImage.startsWith('http')
          ? item.urlToImage
          : getContextualArticleImage(title, snippet);

      parsedArticles.push({
        title,
        link: item.url || '#',
        source: item.source?.name || 'News',
        publishedAt: item.publishedAt || new Date().toISOString(),
        snippet,
        imageUrl,
      });

      if (parsedArticles.length >= 6) break;
    }

    return parsedArticles.length > 0 ? parsedArticles : null;
  } catch (err) {
    console.error('Error in fetchFromNewsApi:', err);
    return null;
  }
}

/**
 * Resilient RSS Fallback: Strict State Business News on Bing and Google.
 */
export async function fetchFromRssFeeds(state: string): Promise<ArticleItem[]> {
  // Try Bing News RSS with strict state business query
  try {
    const bingQuery = `"${state}" (business OR MSME OR industry OR enterprise OR startup OR trade OR investment OR economy)`;
    const bingUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(bingQuery)}&format=rss`;
    const feed = await parser.parseURL(bingUrl);

    if (feed.items && feed.items.length > 0) {
      const parsedItems: ArticleItem[] = [];

      for (const item of feed.items) {
        const fullTitle = item.title || 'Untitled Article';
        const lastDashIndex = fullTitle.lastIndexOf(' - ');

        let title = fullTitle;
        const anyItem = item as Record<string, any>;
        let source = anyItem.newsSource || 'News';

        if (lastDashIndex !== -1) {
          title = fullTitle.substring(0, lastDashIndex).trim();
          if (!anyItem.newsSource) {
            source = fullTitle.substring(lastDashIndex + 3).trim();
          }
        }

        const snippet = cleanSnippet(item.contentSnippet || item.content, title, state);

        // Filter out non-business articles
        if (!isBusinessArticle(title, snippet) && parsedItems.length > 0) {
          continue;
        }

        let imageUrl: string | undefined;
        if (anyItem.newsImage && typeof anyItem.newsImage === 'string') {
          imageUrl = anyItem.newsImage.replace(/^http:\/\//i, 'https://');
        } else if (anyItem.enclosure?.url) {
          imageUrl = anyItem.enclosure.url;
        } else {
          imageUrl = getContextualArticleImage(title, snippet);
        }

        const link = cleanArticleUrl(item.link || '#');

        parsedItems.push({
          title,
          link,
          source,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          snippet,
          imageUrl,
        });

        if (parsedItems.length >= 6) break;
      }

      if (parsedItems.length > 0) {
        return parsedItems;
      }
    }
  } catch (bingError) {
    console.warn('Bing News RSS unavailable, falling back to Google News RSS:', bingError);
  }

  // Fallback to Google News RSS with strict business query
  const googleQuery = `"${state}" (business OR MSME OR industry OR enterprise OR startup OR trade OR economy)`;
  const googleUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(googleQuery)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const feed = await parser.parseURL(googleUrl);

  const parsedGoogleItems: ArticleItem[] = [];

  for (const item of feed.items || []) {
    const fullTitle = item.title || 'Untitled Article';
    const lastDashIndex = fullTitle.lastIndexOf(' - ');

    let title = fullTitle;
    let source = 'Google News';

    if (lastDashIndex !== -1) {
      title = fullTitle.substring(0, lastDashIndex).trim();
      source = fullTitle.substring(lastDashIndex + 3).trim();
    }

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

    if (!isBusinessArticle(title, snippet) && parsedGoogleItems.length > 0) {
      continue;
    }

    const imageUrl = getContextualArticleImage(title, snippet);

    parsedGoogleItems.push({
      title,
      link: item.link || '#',
      source,
      publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      snippet,
      imageUrl,
    });

    if (parsedGoogleItems.length >= 6) break;
  }

  return parsedGoogleItems;
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

    let articles: ArticleItem[] | null = null;

    // 1. If GNEWS_API_KEY is configured, try Approach 3: GNews REST API
    const gnewsKey = process.env.GNEWS_API_KEY?.trim();
    if (gnewsKey) {
      articles = await fetchFromGNews(state, gnewsKey);
    }

    // 2. If NEWS_API_KEY is configured and no articles yet, try NewsAPI.org
    const newsApiKey = process.env.NEWS_API_KEY?.trim();
    if (!articles && newsApiKey) {
      articles = await fetchFromNewsApi(state, newsApiKey);
    }

    // 3. Fallback to resilient RSS feeds (Bing News RSS with images, then Google News RSS + smart pools)
    if (!articles || articles.length === 0) {
      articles = await fetchFromRssFeeds(state);
    }

    // Store in cache
    cache.set(cacheKey, {
      data: articles,
      timestamp: now,
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching/parsing articles:', error);
    return NextResponse.json([], { status: 200 });
  }
}

