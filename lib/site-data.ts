import { cacheLife } from "next/cache";
import { loadIssues, loadItems } from "./store";
import { buildStories, byRecency } from "./stories";
import { CATEGORIES, type Category } from "./types";

/**
 * Data only changes when GitHub Actions pushes a commit, which triggers a new deploy,
 * so the site reads the JSON once per build and the "hours" profile keeps rankings fresh in between.
 */
export async function getStories() {
  "use cache";
  cacheLife("hours");
  return buildStories(await loadItems());
}

const HOUR = 3_600_000;
const FRONT_PAGE_HOURS = 72;
const SECTION_DAYS = 7;

/**
 * The front page: a lead story, four secondary ones and a list of more, a chronological
 * wire, and one block per section with what didn't make the top.
 */
export async function getFrontPage() {
  "use cache";
  cacheLife("hours");
  const [stories, issues] = await Promise.all([getStories(), loadIssues()]);
  const now = Date.now();
  const recent = stories.filter((s) => s.firstSeen >= new Date(now - FRONT_PAGE_HOURS * HOUR).toISOString());

  const top = recent.slice(0, 11);
  const shown = new Set(top.map((s) => s.id));
  const weekCutoff = new Date(now - SECTION_DAYS * 24 * HOUR).toISOString();
  const sections = CATEGORIES.map((category) => ({
    category,
    stories: stories.filter((s) => s.category === category && !shown.has(s.id) && s.firstSeen >= weekCutoff).slice(0, 4),
  })).filter((s) => s.stories.length);

  return {
    lead: top[0] ?? null,
    secondary: top.slice(1, 5),
    more: top.slice(5),
    wire: [...recent].sort(byRecency).slice(0, 18),
    sections,
    latestIssue: issues[0] ?? null,
    generatedAt: new Date(now).toISOString(),
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
