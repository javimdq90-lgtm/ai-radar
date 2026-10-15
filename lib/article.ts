import { decodeEntities, get } from "./fetchers";

export type Article = { text?: string; image?: string };

const MAX_TEXT = 6000;

function meta(html: string, names: string[]): string | undefined {
  for (const name of names) {
    // Attribute order varies between sites: property/name before or after content.
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      "i",
    );
    const m = html.match(re);
    if (m) return decodeEntities(m[1] ?? m[2]);
  }
  return undefined;
}

/** Readable body text: paragraphs inside <article> (or <main>, or the page), boilerplate stripped. */
export function extractText(html: string): string | undefined {
  const body =
    html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  const cleaned = body.replace(/<(script|style|noscript|nav|footer|aside|figure|form|header)[\s\S]*?<\/\1>/gi, " ");
  const paragraphs = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 60);
  if (!paragraphs.length) return undefined;
  const text = paragraphs.join("\n\n");
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
}

export function extractImage(html: string, pageUrl: string): string | undefined {
  const raw = meta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
  if (!raw) return undefined;
  try {
    const url = new URL(raw, pageUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Fetches a page for its text and share image. Never throws: paywalls and blocks just return {}. */
export async function fetchArticle(url: string): Promise<Article> {
  try {
    const html = await get(url, "text/html,application/xhtml+xml");
    return { text: extractText(html), image: extractImage(html, url) };
  } catch {
    return {};
  }
}

/** Runs `fn` over `items` with at most `limit` in flight. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}
