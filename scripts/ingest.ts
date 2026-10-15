/**
 * Fetch every source, store new links, then have Claude summarise, score and group them,
 * find images, and write briefings for the biggest stories.
 *
 *   npm run ingest              fetch + enrich
 *   npm run ingest -- --no-ai   fetch only (items are enriched on the next normal run)
 *   npm run ingest -- --redo    also redo the last few days, after changing a prompt
 */
import { appendFile } from "node:fs/promises";
import { fetchArticle, mapLimit } from "@/lib/article";
import { enrichBatch, groupStories, writeBrief, type BriefMaterial } from "@/lib/claude";
import { clean, fetchSource } from "@/lib/fetchers";
import { assignStoryIds } from "@/lib/grouping";
import { SOURCE_NAMES, SOURCES } from "@/lib/sources";
import { canonicalUrl, itemId, loadBriefs, loadItems, saveBriefs, saveItems } from "@/lib/store";
import { buildStories } from "@/lib/stories";
import { CATEGORIES, type Category, type Item } from "@/lib/types";

/** Only links published this recently are taken, so a feed's back catalogue doesn't flood in. */
const LOOKBACK_HOURS = 72;
/** Stories this recent are regrouped on every run (and redone with --redo). */
const GROUP_WINDOW_HOURS = 72;
/** Big stories this recent get a briefing. */
const BRIEF_WINDOW_HOURS = 48;
const BATCH_SIZE = 25;
/** Caps per run so a backlog (e.g. after a long outage) can't blow up one run's cost or time. */
const MAX_ENRICH_PER_RUN = 200;
const MAX_IMAGE_LOOKUPS = 60;
const MAX_BRIEFS_PER_RUN = 6;
/** A briefing is rewritten when new coverage arrives, but not more often than this. */
const BRIEF_REFRESH_HOURS = 3;

const ENRICHMENT_FIELDS = [
  "enrichedAt", "irrelevant", "summary", "whyItMatters", "category", "importance", "entities", "storyId",
] as const satisfies readonly (keyof Item)[];

const noAi = process.argv.includes("--no-ai");
const redo = process.argv.includes("--redo");
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

async function main() {
  const [items, briefs] = await Promise.all([loadItems(), loadBriefs()]);
  if (redo) {
    const cutoff = hoursAgo(GROUP_WINDOW_HOURS);
    let reset = 0;
    for (const item of items) {
      if (item.publishedAt < cutoff) continue;
      item.title = clean(item.title, 300) ?? item.title;
      item.snippet = clean(item.snippet);
      for (const key of ENRICHMENT_FIELDS) delete item[key];
      reset++;
    }
    for (const [id, brief] of Object.entries(briefs)) if (brief.writtenAt >= cutoff) delete briefs[id];
    console.log(`Redo: cleared ${reset} items from the last ${GROUP_WINDOW_HOURS}h and their briefings`);
  }
  const byId = new Map(items.map((i) => [i.id, i]));
  const seenUrls = new Set(items.map((i) => canonicalUrl(i.url)));
  const now = new Date().toISOString();
  const warnings: string[] = [];

  // 1. Fetch
  const report: string[] = [];
  const results = await Promise.allSettled(SOURCES.map((s) => fetchSource(s, new Date(hoursAgo(LOOKBACK_HOURS)))));
  let added = 0;
  results.forEach((result, idx) => {
    const source = SOURCES[idx];
    if (result.status === "rejected") {
      report.push(`| ${source.name} | ❌ ${String(result.reason?.message ?? result.reason)} |`);
      return;
    }
    let fresh = 0;
    for (const raw of result.value) {
      const url = canonicalUrl(raw.url);
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      const item: Item = { ...raw, id: itemId(raw.url), fetchedAt: now };
      byId.set(item.id, item);
      fresh++;
    }
    added += fresh;
    report.push(`| ${source.name} | ${result.value.length} in window, ${fresh} new |`);
  });
  console.log(`Fetched: ${added} new items\n${report.join("\n")}`);
  const all = [...byId.values()];

  // 2. Triage (also retries items a previous run fetched but couldn't enrich)
  const pending = all
    .filter((i) => !i.enrichedAt && !i.irrelevant)
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
    .slice(0, MAX_ENRICH_PER_RUN);
  let enriched = 0;
  let dropped = 0;
  let enrichError: string | undefined;
  if (!noAi) {
    for (let start = 0; start < pending.length; start += BATCH_SIZE) {
      const batch = pending.slice(start, start + BATCH_SIZE);
      console.log(`Triage ${start + 1}-${start + batch.length} of ${pending.length}`);
      try {
        for (const r of await enrichBatch(batch)) {
          const item = byId.get(r.id);
          if (!item || item.enrichedAt) continue;
          item.enrichedAt = new Date().toISOString();
          if (!r.relevant) {
            item.irrelevant = true;
            dropped++;
            continue;
          }
          Object.assign(item, {
            summary: r.summary,
            whyItMatters: r.whyItMatters || undefined,
            category: CATEGORIES.includes(r.category as Category) ? (r.category as Category) : "products",
            importance: Math.min(5, Math.max(1, Math.round(r.importance))),
            entities: r.entities.slice(0, 5),
          });
          enriched++;
        }
      } catch (err) {
        // Leave the rest pending; the next run picks them up.
        enrichError = (err as Error).message;
        console.error(`Triage failed: ${enrichError}`);
        break;
      }
    }
  }
  const live = (i: Item) => Boolean(i.enrichedAt && !i.irrelevant);

  // 3. Images: feed images arrive with the item; otherwise read the article's og:image.
  // Article text is kept for the briefings below so a page is fetched at most once per run.
  const articles = new Map<string, Awaited<ReturnType<typeof fetchArticle>>>();
  const needImage = all
    .filter((i) => live(i) && !i.image && !i.imageCheckedAt && i.publishedAt >= hoursAgo(GROUP_WINDOW_HOURS))
    .filter((i) => (i.importance ?? 1) >= 3 || i.sourceId === "anthropic")
    .slice(0, MAX_IMAGE_LOOKUPS);
  await mapLimit(needImage, 8, async (item) => {
    const article = await fetchArticle(item.url);
    articles.set(item.url, article);
    item.image = article.image;
    item.imageCheckedAt = new Date().toISOString();
  });
  console.log(`Images: looked up ${needImage.length}, found ${needImage.filter((i) => i.image).length}`);

  // 4. Group: one pass over the whole window, so coverage is never split across batches.
  // Existing stories are sent as one representative each; Claude merges them with new items.
  let grouped = false;
  if (!noAi && !enrichError) {
    const cutoff = hoursAgo(GROUP_WINDOW_HOURS);
    const inWindow = new Set(all.filter((i) => live(i) && i.publishedAt >= cutoff).map((i) => i.storyId ?? i.id));
    const members = new Map<string, Item[]>();
    for (const item of all) {
      const key = item.storyId ?? item.id;
      if (live(item) && inWindow.has(key)) members.set(key, [...(members.get(key) ?? []), item]);
    }
    const reps = [...members.values()].map((group) =>
      group.reduce((best, i) => ((i.importance ?? 1) > (best.importance ?? 1) ? i : best)),
    );
    const repOf = new Map(reps.map((rep) => [rep.id, members.get(rep.storyId ?? rep.id)!]));
    try {
      console.log(`Grouping ${reps.length} stories`);
      const groups = await groupStories(reps);
      // Expand each representative back to its whole story before assigning ids.
      const expanded = groups.map((g) => g.flatMap((id) => (repOf.get(id) ?? []).map((i) => i.id)));
      const existing = [...members.values()].map((g) => g.map((i) => i.id));
      const storyIds = assignStoryIds([...members.values()].flat(), [...existing, ...expanded]);
      for (const [id, storyId] of storyIds) byId.get(id)!.storyId = storyId;
      grouped = true;
    } catch (err) {
      warnings.push(`Grouping failed: ${(err as Error).message}`);
      console.error(warnings.at(-1));
    }
  }
  for (const item of all) if (live(item) && !item.storyId) item.storyId = item.id;

  // 5. Briefings for the biggest recent stories, written from the articles themselves.
  let briefed = 0;
  if (!noAi && grouped) {
    const stories = buildStories(all, briefs)
      .filter((s) => s.firstSeen >= hoursAgo(BRIEF_WINDOW_HOURS) && (s.importance >= 4 || s.sourceCount >= 3))
      .filter((s) => {
        if (!s.brief) return true;
        const hasNew = s.items.some((i) => !s.brief!.itemIds.includes(i.id));
        return hasNew && s.brief.writtenAt < hoursAgo(BRIEF_REFRESH_HOURS);
      })
      .slice(0, MAX_BRIEFS_PER_RUN);
    for (const story of stories) {
      const sources = [story.lead, ...story.items.filter((i) => i !== story.lead).sort((a, b) => (b.importance ?? 1) - (a.importance ?? 1))].slice(0, 5);
      const texts = await mapLimit(sources, 5, async (i) => articles.get(i.url) ?? fetchArticle(i.url));
      const material: BriefMaterial[] = sources.map((i, n) => ({
        source: i.sourceId === "hn" ? new URL(i.url).hostname : (SOURCE_NAMES[i.sourceId] ?? i.sourceId),
        title: i.title,
        summary: i.summary,
        text: texts[n].text,
      }));
      try {
        console.log(`Briefing: ${story.lead.title}`);
        const draft = await writeBrief(material);
        briefs[story.id] = {
          storyId: story.id,
          itemIds: story.items.map((i) => i.id),
          writtenAt: new Date().toISOString(),
          headline: draft.headline,
          dek: draft.dek,
          keyPoints: draft.keyPoints.slice(0, 5),
          context: draft.context,
          whatsNext: draft.whatsNext || undefined,
        };
        briefed++;
      } catch (err) {
        warnings.push(`Briefing failed for "${story.lead.title}": ${(err as Error).message}`);
        console.error(warnings.at(-1));
      }
    }
    // Drop briefings whose story was regrouped under another id, or that are a month old.
    const storyIds = new Set(all.map((i) => i.storyId));
    for (const [id, brief] of Object.entries(briefs)) {
      if (!storyIds.has(id) || brief.writtenAt < hoursAgo(24 * 30)) delete briefs[id];
    }
  }

  await Promise.all([saveItems(all), saveBriefs(briefs)]);
  const stillPending = all.filter((i) => !i.enrichedAt).length;
  const stories = new Set(all.filter((i) => live(i) && i.publishedAt >= hoursAgo(GROUP_WINDOW_HOURS)).map((i) => i.storyId)).size;
  const line = `${added} new, ${enriched} triaged, ${dropped} off-topic, ${stillPending} pending, ${stories} stories in the last ${GROUP_WINDOW_HOURS}h, ${briefed} briefings written`;
  console.log(line);

  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = [
      `### Ingest: ${line}`,
      enrichError ? `\n> ⚠️ Triage stopped: ${enrichError}\n` : "",
      ...warnings.map((w) => `\n> ⚠️ ${w}\n`),
      "| Source | Result |",
      "| --- | --- |",
      ...report,
      "",
    ].join("\n");
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  // Fail the job (GitHub emails you) when Claude is unreachable, e.g. a missing key or no credits,
  // or when every source fails, which means the runner lost its network rather than the news stopping.
  // Fetched items are saved either way and the workflow still commits them.
  if (enrichError || results.every((r) => r.status === "rejected")) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
