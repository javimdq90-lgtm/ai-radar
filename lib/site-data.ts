import { cacheLife } from "next/cache";
import { loadBriefs, loadIssues, loadItems } from "./store";
import { sourceName } from "./sources";
import { buildStories, byRecency } from "./stories";
import { CATEGORIES, type Category } from "./types";

/**
 * Data only changes when GitHub Actions pushes a commit, which triggers a new deploy,
 * so the site reads the JSON once per build and the "hours" profile keeps rankings fresh in between.
 */
export async function getStories() {
  "use cache";
  cacheLife("hours");
  const [items, briefs] = await Promise.all([loadItems(), loadBriefs()]);
  return buildStories(items, briefs);
}

const HOUR = 3_600_000;
const FRONT_PAGE_HOURS = 72;
const SECTION_DAYS = 7;

/**
 * The front page: the twelve top-ranked recent stories (the page picks its top story, hero
 * cards and grid from them), a chronological wire of the rest, and one block per section.
 */
export async function getFrontPage() {
  "use cache";
  cacheLife("hours");
  const stories = await getStories();
  const now = Date.now();
  const recent = stories.filter((s) => s.firstSeen >= new Date(now - FRONT_PAGE_HOURS * HOUR).toISOString());

  // 10: the top story, three hero cards and a grid of six (two rows of four with the two-wide sign-up tile).
  const top = recent.slice(0, 10);
  const shown = new Set(top.map((s) => s.id));
  const weekCutoff = new Date(now - SECTION_DAYS * 24 * HOUR).toISOString();
  const sections = CATEGORIES.map((category) => ({
    category,
    stories: stories.filter((s) => s.category === category && !shown.has(s.id) && s.firstSeen >= weekCutoff).slice(0, 4),
  })).filter((s) => s.stories.length);

  return {
    lead: top[0] ?? null,
    top: top.slice(1),
    // Everything newest-first, minus what the main column already shows.
    wire: recent.filter((s) => !shown.has(s.id)).sort(byRecency).slice(0, 16),
    sections,
    generatedAt: new Date(now).toISOString(),
  };
}

/** Our own multi-source briefings, newest first. */
export async function getBriefings() {
  "use cache";
  cacheLife("hours");
  return {
    stories: (await getStories()).filter((s) => s.brief).sort(byRecency).slice(0, 60),
    generatedAt: new Date().toISOString(),
  };
}

export async function getTopic(category: Category) {
  "use cache";
  cacheLife("hours");
  return {
    stories: (await getStories()).filter((s) => s.category === category).sort(byRecency).slice(0, 60),
    generatedAt: new Date().toISOString(),
  };
}

/** A briefed story and a few others from the same section. */
export async function getStory(id: string) {
  "use cache";
  cacheLife("hours");
  const stories = await getStories();
  const story = stories.find((s) => s.id === id);
  if (!story) return null;
  const others = stories.filter((s) => s.id !== id);
  const sameSection = others.filter((s) => s.category === story.category).slice(0, 4);
  // A section can be a single big story (every Models item grouped into one); show the latest instead.
  const related = sameSection.length ? sameSection : [...others].sort(byRecency).slice(0, 4);
  return { story, related, relatedIsSection: sameSection.length > 0, generatedAt: new Date().toISOString() };
}

export async function getBriefedStoryIds() {
  "use cache";
  cacheLife("hours");
  return (await getStories()).filter((s) => s.brief).map((s) => s.id);
}

export async function getIssues() {
  "use cache";
  cacheLife("max");
  return loadIssues();
}

export async function getIssue(number: number) {
  "use cache";
  cacheLife("max");
  return (await loadIssues()).find((i) => i.number === number) ?? null;
}

/** "Now" for the masthead dateline, refreshed on the same schedule as the stories. */
export async function getGeneratedAt() {
  "use cache";
  cacheLife("hours");
  return new Date().toISOString();
}

export type SearchEntry = {
  id: string;
  title: string;
  summary: string;
  category: Category;
  source: string;
  /** The briefing page for briefed stories, the original article otherwise. */
  href: string;
  external: boolean;
  firstSeen: string;
  /** Lower-case text the search box matches against: title, summary, outlets, names. */
  text: string;
};

/** Every story, newest first, for the search box. Served as static JSON by app/search-index. */
export async function getSearchIndex(): Promise<SearchEntry[]> {
  "use cache";
  cacheLife("hours");
  return [...(await getStories())].sort(byRecency).map((s) => {
    const title = s.brief?.headline ?? s.lead.title;
    const summary = s.brief?.dek ?? s.lead.summary ?? "";
    const outlets = [...new Set(s.items.map(sourceName))];
    return {
      id: s.id,
      title,
      summary: summary.length > 180 ? `${summary.slice(0, 177)}…` : summary,
      category: s.category,
      source: sourceName(s.lead),
      href: s.brief ? `/story/${s.id}` : s.lead.url,
      external: !s.brief,
      firstSeen: s.firstSeen,
      text: [title, summary, ...outlets, ...s.items.flatMap((i) => [i.title, ...(i.entities ?? [])])].join(" ").toLowerCase(),
    };
  });
}
