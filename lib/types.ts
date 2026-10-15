export const CATEGORIES = [
  "models",
  "research",
  "products",
  "open-source",
  "policy",
  "business",
  "tools",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  models: "Models",
  research: "Research",
  products: "Products",
  "open-source": "Open source",
  policy: "Policy & safety",
  business: "Business & funding",
  tools: "Dev tools",
};

/** A link as it comes out of a fetcher, before it is stored. */
export type RawItem = {
  url: string;
  title: string;
  sourceId: string;
  publishedAt: string; // ISO
  snippet?: string;
  /** Source-specific popularity (HN points, paper upvotes). */
  score?: number;
  /** Comment thread when the link points elsewhere (Hacker News). */
  discussionUrl?: string;
};

/** A stored link. Enrichment fields are filled in by Claude on the next ingest run. */
export type Item = RawItem & {
  id: string;
  fetchedAt: string;
  enrichedAt?: string;
  /** Claude judged it not to be about AI. Kept so it isn't fetched and judged again. */
  irrelevant?: boolean;
  summary?: string;
  whyItMatters?: string;
  category?: Category;
  importance?: number; // 1-5
  entities?: string[];
  /** Id of the first item that covered the same story (its own id when it is the first). */
  storyId?: string;
};

/** One or more items about the same news, ranked as a unit. */
export type Story = {
  id: string;
  lead: Item;
  items: Item[];
  sourceCount: number;
  category: Category;
  importance: number;
  firstSeen: string;
  score: number;
};

export type IssueStory = { storyId: string; headline: string; body: string };

export type Issue = {
  number: number;
  date: string; // ISO
  subject: string;
  preview: string;
  intro: string;
  sections: { heading: string; stories: IssueStory[] }[];
  quickHits: { storyId: string; text: string }[];
  /** storyId -> links, frozen at send time so the archive never changes under you. */
  links: Record<string, { title: string; url: string; source: string }[]>;
};
