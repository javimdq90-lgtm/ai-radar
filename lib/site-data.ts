import { cacheLife } from "next/cache";
import { loadIssues, loadItems } from "./store";
import { buildStories, byRecency } from "./stories";
import type { Category } from "./types";

/**
 * Data only changes when GitHub Actions pushes a commit, which triggers a new deploy,
 * so the site reads the JSON once per build and the "hours" profile keeps rankings fresh in between.
 */
export async function getStories() {
  "use cache";
  cacheLife("hours");
  return buildStories(await loadItems());
}

const TOP_COUNT = 10;
const FRONT_PAGE_HOURS = 72;

/** Top stories by score, then everything else from the last few days, newest first. */
export async function getFrontPage() {
  "use cache";
  cacheLife("hours");
  const stories = await getStories();
  const cutoff = new Date(Date.now() - FRONT_PAGE_HOURS * 3_600_000).toISOString();
  const recent = stories.filter((s) => s.firstSeen >= cutoff);
  const top = recent.slice(0, TOP_COUNT);
  const topIds = new Set(top.map((s) => s.id));
  const latest = recent.filter((s) => !topIds.has(s.id)).sort(byRecency);
  return { top, latest, generatedAt: new Date().toISOString() };
}

export async function getTopic(category: Category) {
  "use cache";
  cacheLife("hours");
  return (await getStories()).filter((s) => s.category === category).sort(byRecency).slice(0, 60);
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
