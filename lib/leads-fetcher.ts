// Next.js extends the native fetch with a `next` cache option
type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

export interface Lead {
  id: string;
  source: 'reddit' | 'hackernews' | 'devto';
  title: string;
  url: string;
  author: string;
  excerpt: string;
  createdAt: string;
  matchedKeywords: string[];
  subreddit?: string;
  score?: number;
}

// Keywords that indicate someone needs help in our target domains
const HELP_KEYWORDS = [
  // Vibe coding
  'vibe coding', 'vibecoding', 'vibe-coding', 'ai coding', 'cursor ide',
  // Project / task management pain
  'project management', 'task management', 'manage tasks', 'manage projects',
  'track tasks', 'todo app', 'productivity tool', 'overwhelmed with tasks',
  // Solopreneur / indie
  'solopreneur', 'indie dev', 'indie hacker', 'indiehacker', 'building in public',
  'side project', 'solo founder', 'bootstrapped',
  // Freelance
  'freelancer', 'freelance dev', 'client management', 'manage clients',
  // General help signals
  'need help with', 'looking for tool', 'how do i manage', 'struggling with',
  'any tool for', 'recommend a tool', 'workflow help',
];

// Subreddits that attract our target audience
const REDDIT_SUBREDDITS = [
  'indiehackers',
  'solopreneur',
  'webdev',
  'freelance',
  'productivity',
  'entrepreneur',
  'SideProject',
  'vibecoding',
  'nocode',
  'startups',
  'learnprogramming',
  'devops',
];

// Reddit search queries (each targets a pain point)
const REDDIT_QUERIES = [
  'help project management solopreneur',
  'vibe coding help',
  'indie dev workflow tool',
  'freelancer client task management',
  'overwhelmed side project',
  'need tool manage tasks entrepreneur',
];

function matchKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return HELP_KEYWORDS.filter((kw) => lower.includes(kw));
}

function truncate(text: string, maxLen = 280): string {
  if (!text) return '';
  const cleaned = text.replace(/\n+/g, ' ').trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '…' : cleaned;
}

// ── Reddit ────────────────────────────────────────────────────────────────────

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    subreddit: string;
    permalink: string;
    score: number;
    created_utc: number;
  };
}

async function fetchRedditLeads(): Promise<Lead[]> {
  const leads: Lead[] = [];
  const seen = new Set<string>();

  for (const subreddit of REDDIT_SUBREDDITS) {
    try {
      const url =
        `https://www.reddit.com/r/${subreddit}/new.json?limit=25&t=day`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'yoda-coach-bot/1.0' },
        next: { revalidate: 86400 },
      } as NextFetchInit);
      if (!res.ok) continue;

      const json = await res.json();
      const posts: RedditPost[] = json?.data?.children ?? [];

      for (const post of posts) {
        const { id, title, selftext, author, subreddit: sub, permalink, score, created_utc } =
          post.data;
        if (seen.has(id)) continue;

        const combined = `${title} ${selftext}`;
        const matched = matchKeywords(combined);
        if (matched.length === 0) continue;

        seen.add(id);
        leads.push({
          id: `reddit_${id}`,
          source: 'reddit',
          title,
          url: `https://reddit.com${permalink}`,
          author: `u/${author}`,
          excerpt: truncate(selftext || title),
          createdAt: new Date(created_utc * 1000).toISOString(),
          matchedKeywords: matched,
          subreddit: sub,
          score,
        });
      }
    } catch {
      // silently skip failing subreddits
    }
  }

  return leads;
}

// ── Hacker News (via Algolia) ─────────────────────────────────────────────────

interface HNHit {
  objectID: string;
  title?: string;
  story_title?: string;
  comment_text?: string;
  story_text?: string;
  author: string;
  url?: string;
  story_url?: string;
  created_at: string;
  points?: number;
  _tags: string[];
}

async function fetchHNLeads(): Promise<Lead[]> {
  const leads: Lead[] = [];
  const seen = new Set<string>();
  const yesterday = Math.floor(Date.now() / 1000) - 86400;

  const queries = [
    'indie developer help',
    'solopreneur project management',
    'vibe coding',
    'freelance tool workflow',
    'side project productivity',
  ];

  for (const q of queries) {
    try {
      const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=story&numericFilters=created_at_i>${yesterday}&hitsPerPage=20`;
      const res = await fetch(url, { next: { revalidate: 86400 } } as NextFetchInit);
      if (!res.ok) continue;

      const json = await res.json();
      const hits: HNHit[] = json?.hits ?? [];

      for (const hit of hits) {
        if (seen.has(hit.objectID)) continue;
        const title = hit.title ?? hit.story_title ?? '';
        const body = hit.story_text ?? hit.comment_text ?? '';
        const combined = `${title} ${body}`;
        const matched = matchKeywords(combined);
        if (matched.length === 0) continue;

        seen.add(hit.objectID);
        leads.push({
          id: `hn_${hit.objectID}`,
          source: 'hackernews',
          title,
          url: hit.url ?? hit.story_url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
          author: hit.author,
          excerpt: truncate(body || title),
          createdAt: hit.created_at,
          matchedKeywords: matched,
          score: hit.points ?? 0,
        });
      }
    } catch {
      // silently skip
    }
  }

  return leads;
}

// ── Dev.to ────────────────────────────────────────────────────────────────────

interface DevtoArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  user: { username: string };
  published_at: string;
  positive_reactions_count: number;
  tag_list: string[];
}

const DEVTO_TAGS = [
  'webdev', 'productivity', 'freelance', 'startup',
  'solopreneur', 'indiehacker', 'showdev', 'discuss',
];

async function fetchDevtoLeads(): Promise<Lead[]> {
  const leads: Lead[] = [];
  const seen = new Set<number>();

  for (const tag of DEVTO_TAGS) {
    try {
      const url = `https://dev.to/api/articles?tag=${tag}&per_page=20&state=rising`;
      const res = await fetch(url, { next: { revalidate: 86400 } } as NextFetchInit);
      if (!res.ok) continue;

      const articles: DevtoArticle[] = await res.json();
      for (const article of articles) {
        if (seen.has(article.id)) continue;
        const combined = `${article.title} ${article.description}`;
        const matched = matchKeywords(combined);
        if (matched.length === 0) continue;

        seen.add(article.id);
        leads.push({
          id: `devto_${article.id}`,
          source: 'devto',
          title: article.title,
          url: article.url,
          author: `@${article.user.username}`,
          excerpt: truncate(article.description),
          createdAt: article.published_at,
          matchedKeywords: matched,
          score: article.positive_reactions_count,
        });
      }
    } catch {
      // silently skip
    }
  }

  return leads;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchAllLeads(): Promise<Lead[]> {
  const [reddit, hn, devto] = await Promise.allSettled([
    fetchRedditLeads(),
    fetchHNLeads(),
    fetchDevtoLeads(),
  ]);

  const all: Lead[] = [
    ...(reddit.status === 'fulfilled' ? reddit.value : []),
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(devto.status === 'fulfilled' ? devto.value : []),
  ];

  // Sort: most keywords matched first, then by recency
  return all.sort((a, b) => {
    const diff = b.matchedKeywords.length - a.matchedKeywords.length;
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
