export interface FeedNewsItem {
  title: string;
  link: string;
  source: string;
  summary?: string;
  publishedAt: string;
}

const RSS_SOURCES = [
  { url: 'https://www.bangkokpost.com/rss/data/life.xml', source: 'Bangkok Post — Life' },
  { url: 'https://www.bangkokpost.com/rss/data/thailand.xml', source: 'Bangkok Post — Thailand' },
  { url: 'https://www.bangkokpost.com/rss/data/topstories.xml', source: 'Bangkok Post — Top stories' },
] as const;

const MAX_AGE_MS = 120 * 24 * 60 * 60 * 1000;
let cached: { expiresAt: number; items: FeedNewsItem[] } | null = null;

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function readTag(block: string, tag: string): string {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i');
  return decodeXml((block.match(pattern)?.[1] ?? '').replace(/<[^>]+>/g, '').trim());
}

function parseRss(xml: string, source: string): FeedNewsItem[] {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return blocks.flatMap((block) => {
    const title = readTag(block, 'title');
    const link = readTag(block, 'link');
    const published = new Date(readTag(block, 'pubDate'));
    if (!title || !/^https?:\/\//i.test(link)) return [];
    return [{
      title,
      link,
      source,
      summary: readTag(block, 'description') || undefined,
      publishedAt: Number.isFinite(published.getTime()) ? published.toISOString() : new Date().toISOString(),
    }];
  });
}

function mentionsGuinness(text: string): boolean {
  const value = text.toLowerCase();
  if (!value.includes('guinness')) return false;
  if (!value.includes('guinness world record')) return true;
  return /beer|stout|pub|bar|draught|draft|irish pub/.test(value);
}

async function fetchRss(source: (typeof RSS_SOURCES)[number]): Promise<FeedNewsItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(source.url, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    return parseRss(await response.text(), source.source);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/** Optional Thailand Guinness news, mirroring the web feed without making the main feed depend on RSS. */
export async function fetchThailandGuinnessFeedNews(limit = 8): Promise<FeedNewsItem[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.items.slice(0, limit);

  const groups = await Promise.all(RSS_SOURCES.map(fetchRss));
  const seen = new Set<string>();
  const items = groups
    .flat()
    .filter((item) => {
      const age = Date.now() - new Date(item.publishedAt).getTime();
      const unique = !seen.has(item.link);
      seen.add(item.link);
      return unique && age <= MAX_AGE_MS && mentionsGuinness(`${item.title} ${item.summary ?? ''}`);
    })
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, limit);

  cached = { expiresAt: Date.now() + 5 * 60_000, items };
  return items;
}
