import Parser from "rss-parser";
import type { Source } from "./sources";
import type { RawItem } from "./types";

const UA = "Mozilla/5.0 (compatible; ai-radar/0.1; personal news reader)";
const TIMEOUT_MS = 20_000;

/** Hacker News stories need this many points to count. */
const HN_MIN_POINTS = 80;
/** Daily papers below this many upvotes are skipped, but the top few always make it. */
const PAPERS_MIN_UPVOTES = 15;
const PAPERS_ALWAYS_TOP = 5;

const AI_TERMS =
  /\b(ai|a\.i\.|agi|llms?|gpt[-\w.]*|chatgpt|openai|anthropic|claude|gemini|deepmind|mistral|llama|qwen|deepseek|grok|xai|copilot|transformers?|diffusion|neural|machine learning|ml|deep learning|reinforcement learning|rlhf|inference|fine-?tun\w*|embeddings?|agents?|agentic|reasoning model|language models?|hugging ?face|nvidia|gpus?|tpus?|cuda|vllm|ollama|rag|mcp|prompt\w*|chatbots?|sora|midjourney|stable diffusion|perplexity|cursor)\b/i;

async function get(url: string, accept: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
  }).catch((err: Error & { cause?: { code?: string; message?: string } }) => {
    // Node's "fetch failed" hides the useful part (DNS, TLS, reset) in `cause`.
    throw new Error(err.cause ? `${err.message}: ${err.cause.code ?? err.cause.message}` : err.message);
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function toIso(value: string | number | undefined | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function clean(text: string | undefined, max = 600): string | undefined {
  if (!text) return undefined;
  const t = text
    .replace(/\s+/g, " ")
    .replace(/The post .{1,300} appeared first on .{1,100}$/, "") // WordPress feed footer
    .trim();
  if (!t) return undefined;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

const rss = new Parser();

async function fetchRss(source: Source): Promise<RawItem[]> {
  const xml = await get(source.url, "application/rss+xml, application/atom+xml, application/xml, text/xml");
  const feed = await rss.parseString(xml);
  const out: RawItem[] = [];
  for (const entry of feed.items) {
    const publishedAt = toIso(entry.isoDate ?? entry.pubDate);
    if (!entry.link || !entry.title || !publishedAt) continue;
    out.push({
      url: entry.link,
      title: clean(entry.title, 300)!,
      sourceId: source.id,
      publishedAt,
      snippet: clean(entry.contentSnippet ?? entry.summary),
    });
  }
  return out;
}

type HnHit = { objectID: string; title?: string; url?: string | null; points?: number; created_at?: string };

async function fetchHackerNews(source: Source, since: Date): Promise<RawItem[]> {
  const params = new URLSearchParams({
    tags: "story",
    numericFilters: `created_at_i>${Math.floor(since.getTime() / 1000)},points>=${HN_MIN_POINTS}`,
    hitsPerPage: "300",
  });
  const data = JSON.parse(await get(`${source.url}?${params}`, "application/json")) as { hits: HnHit[] };
  return data.hits
    .filter((h) => h.title && AI_TERMS.test(h.title))
    .map((h) => {
      const discussionUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
      return {
        url: h.url || discussionUrl,
        title: h.title!,
        sourceId: source.id,
        publishedAt: toIso(h.created_at) ?? new Date().toISOString(),
        score: h.points,
        discussionUrl,
      };
    });
}

type DailyPaper = {
  publishedAt?: string;
  title?: string;
  paper?: { id?: string; title?: string; summary?: string; upvotes?: number; publishedAt?: string };
};

async function fetchDailyPapers(source: Source): Promise<RawItem[]> {
  const papers = JSON.parse(await get(source.url, "application/json")) as DailyPaper[];
  return papers
    .filter((p) => p.paper?.id && (p.paper.title ?? p.title))
    .sort((a, b) => (b.paper?.upvotes ?? 0) - (a.paper?.upvotes ?? 0))
    .filter((p, i) => i < PAPERS_ALWAYS_TOP || (p.paper?.upvotes ?? 0) >= PAPERS_MIN_UPVOTES)
    .map((p) => ({
      url: `https://huggingface.co/papers/${p.paper!.id}`,
      title: clean(p.paper!.title ?? p.title, 300)!,
      sourceId: source.id,
      publishedAt: toIso(p.publishedAt ?? p.paper!.publishedAt) ?? new Date().toISOString(),
      snippet: clean(p.paper!.summary),
      score: p.paper!.upvotes,
    }));
}

const stripTags = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

/** anthropic.com has no feed; read the cards on the news index instead. */
export function parseAnthropicNews(html: string, baseUrl: string): Omit<RawItem, "sourceId">[] {
  const seen = new Set<string>();
  const out: Omit<RawItem, "sourceId">[] = [];
  for (const m of html.matchAll(/<a[^>]+href="(\/news\/[a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const [, href, inner] = m;
    if (seen.has(href)) continue;
    const title =
      inner.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/)?.[1] ??
      inner.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1];
    const date = inner.match(/<time[^>]*>([\s\S]*?)<\/time>/)?.[1];
    const publishedAt = toIso(date ? stripTags(date).trim() : undefined);
    if (!title || !publishedAt) continue;
    seen.add(href);
    const body = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1];
    out.push({
      url: new URL(href, baseUrl).toString(),
      title: clean(stripTags(title), 300)!,
      publishedAt,
      snippet: clean(body ? stripTags(body) : undefined),
    });
  }
  return out;
}

async function fetchAnthropic(source: Source): Promise<RawItem[]> {
  const html = await get(source.url, "text/html");
  return parseAnthropicNews(html, source.url).map((i) => ({ ...i, sourceId: source.id }));
}

export async function fetchSource(source: Source, since: Date): Promise<RawItem[]> {
  const items = await (() => {
    switch (source.kind) {
      case "rss":
        return fetchRss(source);
      case "hn":
        return fetchHackerNews(source, since);
      case "hf-papers":
        return fetchDailyPapers(source);
      case "anthropic":
        return fetchAnthropic(source);
    }
  })();
  return items.filter((i) => new Date(i.publishedAt) >= since);
}
