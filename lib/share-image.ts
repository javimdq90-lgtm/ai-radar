import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Images for link previews and the email, where WebP doesn't work (next/og can't decode it,
 * Outlook can't show it). public/brand/share holds 1200×630 JPEG crops of the brand images,
 * same base names as in public/brand:
 *   hero.jpg            the site card
 *   fallback-<…>.jpg    stories without a usable image of their own
 * Regenerate them when the brand images change. No "server-only" here: scripts/newsletter.ts
 * uses it too.
 */
const DIR = join(process.cwd(), "public", "brand", "share");

function list(): string[] {
  try {
    return readdirSync(DIR).filter((f) => f.endsWith(".jpg")).sort();
  } catch {
    return [];
  }
}

const files = list();
const fallbacks = files.filter((f) => f.startsWith("fallback"));

/** A stable index into a list of `n` for an id, so a story keeps the same brand image everywhere. */
export function stableIndex(id: string, n: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % n;
}

/** Site path of the hero's JPEG crop, or null. */
export const SHARE_HERO = files.includes("hero.jpg") ? "/brand/share/hero.jpg" : null;

/** Site path of the story's brand image as a JPEG crop (the same one the site shows), or null. */
export function shareFallbackFor(id: string): string | null {
  return fallbacks.length ? `/brand/share/${fallbacks[stableIndex(id, fallbacks.length)]}` : null;
}

/** JPEG, PNG or GIF by their first bytes: what both next/og and every mail client can show. */
function imageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  return null;
}

/** Width and height from the header of a PNG, GIF or JPEG (its first SOF marker), or null. */
function imageSize(bytes: Uint8Array, type: string): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (type === "image/png" && bytes.length >= 24) return { width: view.getUint32(16), height: view.getUint32(20) };
  if (type === "image/gif" && bytes.length >= 10) return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  let i = 2;
  while (i + 9 < bytes.length && bytes[i] === 0xff) {
    const marker = bytes[i + 1];
    // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC), carry the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: view.getUint16(i + 7), height: view.getUint16(i + 5) };
    }
    i += 2 + view.getUint16(i + 2);
  }
  return null;
}

const MAX_BYTES = 5_000_000;
/** Below this, or narrower than landscape, a picture looks like an icon or a blurry crop. */
const MIN_WIDTH = 600;
const MIN_RATIO = 1.3;

/**
 * A publisher's image, as bytes for next/og, or null when it can't be used: unreachable, too slow, too
 * big, a format other than JPEG, PNG or GIF (WebP, AVIF, SVG), too small, or not landscape
 * (logos and avatars).
 */
export async function remoteImage(url: string, timeoutMs = 4000): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: "image/jpeg,image/png,image/gif" } });
    if (!res.ok || Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const type = bytes.length <= MAX_BYTES ? imageType(bytes) : null;
    const size = type && imageSize(bytes, type);
    if (!type || !size || size.width < MIN_WIDTH || size.width < size.height * MIN_RATIO) return null;
    return bytes.buffer;
  } catch {
    return null;
  }
}

/**
 * A site path from public/ (one of the JPEGs above), as bytes for next/og. Bytes rather than a
 * data URI or URL, and read synchronously, so next/og fetches nothing and the card can prerender.
 */
export function localImage(sitePath: string): ArrayBuffer {
  return Uint8Array.from(readFileSync(join(process.cwd(), "public", sitePath))).buffer;
}

/**
 * Absolute URL of the image the email shows for a story: the publisher's when it loads and is a
 * format every mail client shows, otherwise the story's brand crop on our own site.
 */
export async function emailImageFor(story: { id: string; image?: string }, siteUrl: string): Promise<string | undefined> {
  if (story.image && (await remoteImage(story.image))) return story.image;
  const fallback = shareFallbackFor(story.id);
  return fallback ? `${siteUrl.replace(/\/$/, "")}${fallback}` : undefined;
}
