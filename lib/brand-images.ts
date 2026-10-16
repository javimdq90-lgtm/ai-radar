import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Brand photography, picked up from public/brand by file name so adding or swapping an image
 * needs no code change:
 *   hero.(jpg|jpeg|png|webp|avif)         front-page hero, wide
 *   hero-mobile.(…)                       front-page hero on phones, portrait (optional)
 *   fallback-<anything>.(…)               visuals for stories without an image of their own
 *   author.(…)                            the byline photo, square
 * Anything missing falls back to the generated SVG scenes. Read once per build.
 */
const DIR = join(process.cwd(), "public", "brand");
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;

function list(): string[] {
  try {
    return readdirSync(DIR).filter((f) => IMAGE.test(f)).sort();
  } catch {
    return [];
  }
}

const files = list();
const find = (base: string) => files.find((f) => f.replace(IMAGE, "").toLowerCase() === base);
const url = (f?: string) => (f ? `/brand/${f}` : null);

export const BRAND = {
  hero: url(find("hero")),
  heroMobile: url(find("hero-mobile")),
  author: url(find("author")),
  fallbacks: files.filter((f) => f.toLowerCase().startsWith("fallback")).map((f) => `/brand/${f}`),
};

/** A stable brand image for a story id, or null when there are none. */
export function fallbackImageFor(id: string): string | null {
  if (!BRAND.fallbacks.length) return null;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return BRAND.fallbacks[h % BRAND.fallbacks.length];
}
