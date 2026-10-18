import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

/**
 * Guides: practical how-tos written with Claude from official documentation, in our own words,
 * citing every source. One JSON file per guide in content/guides/<slug>.json. Text fields are
 * plain text; step bodies and FAQ answers may use Markdown (paragraphs, lists, `code`, fenced code).
 * Check a file with `npx tsx scripts/check-guides.ts`.
 */
export const GuideSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(10).max(90),
  dek: z.string().min(40).max(220),
  vendor: z.string().min(2), // "Anthropic", "OpenAI", "Google", "Ollama", "Several"
  product: z.string().min(2), // "Claude Code"
  level: z.enum(["Beginner", "Intermediate"]),
  minutes: z.number().int().min(5).max(90), // time to work through it
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // when the facts were last checked against the sources
  intro: z.array(z.string().min(40)).min(1).max(3),
  youNeed: z.array(z.string().min(3)).min(1).max(6),
  steps: z.array(z.object({ title: z.string().min(3).max(80), body: z.string().min(40) })).min(3).max(10),
  tips: z.array(z.string().min(20)).max(6),
  faq: z.array(z.object({ q: z.string().min(8), a: z.string().min(20) })).max(5),
  sources: z.array(z.object({ title: z.string().min(3), publisher: z.string().min(2), url: z.string().url() })).min(2),
});

export type Guide = z.infer<typeof GuideSchema>;

const DIR = join(process.cwd(), "content", "guides");

/** Every guide, newest first. Throws on a malformed file so a bad guide fails the build, not the page. */
export function loadGuides(): Guide[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  return files
    .map((f) => {
      const guide = GuideSchema.parse(JSON.parse(readFileSync(join(DIR, f), "utf8")));
      if (`${guide.slug}.json` !== f) throw new Error(`${f}: slug "${guide.slug}" must match the file name`);
      return guide;
    })
    .sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title));
}
