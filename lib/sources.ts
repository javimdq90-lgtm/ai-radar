export type SourceKind = "rss" | "hn" | "hf-papers" | "anthropic";

export type Source = {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
};

/**
 * Where the news comes from. Add a feed by appending a line; `id` must stay stable
 * because stored items reference it. Off-topic links (common on Hacker News and
 * Microsoft Research) are dropped by Claude during enrichment.
 */
export const SOURCES: Source[] = [
  // Labs
  { id: "openai", name: "OpenAI", kind: "rss", url: "https://openai.com/news/rss.xml" },
  { id: "anthropic", name: "Anthropic", kind: "anthropic", url: "https://www.anthropic.com/news" },
  { id: "deepmind", name: "Google DeepMind", kind: "rss", url: "https://deepmind.google/blog/rss.xml" },
  { id: "google-ai", name: "Google AI", kind: "rss", url: "https://blog.google/technology/ai/rss/" },
  { id: "hf-blog", name: "Hugging Face", kind: "rss", url: "https://huggingface.co/blog/feed.xml" },
  { id: "msr", name: "Microsoft Research", kind: "rss", url: "https://www.microsoft.com/en-us/research/feed/" },

  // Research and community
  { id: "hf-papers", name: "HF Daily Papers", kind: "hf-papers", url: "https://huggingface.co/api/daily_papers" },
  { id: "hn", name: "Hacker News", kind: "hn", url: "https://hn.algolia.com/api/v1/search_by_date" },

  // Press
  { id: "verge", name: "The Verge", kind: "rss", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { id: "techcrunch", name: "TechCrunch", kind: "rss", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { id: "ars", name: "Ars Technica", kind: "rss", url: "https://arstechnica.com/ai/feed/" },
  { id: "mit-tr", name: "MIT Technology Review", kind: "rss", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },

  // Writers
  { id: "simonw", name: "Simon Willison", kind: "rss", url: "https://simonwillison.net/atom/entries/" },
  { id: "import-ai", name: "Import AI", kind: "rss", url: "https://importai.substack.com/feed" },
  { id: "interconnects", name: "Interconnects", kind: "rss", url: "https://www.interconnects.ai/feed" },
  { id: "latent-space", name: "Latent Space", kind: "rss", url: "https://www.latent.space/feed" },
];

export const SOURCE_NAMES: Record<string, string> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s.name]),
);
