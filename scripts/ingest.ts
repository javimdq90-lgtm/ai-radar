/**
 * Fetch every source, store new links, then have Claude summarise, score and group them.
 *
 *   npm run ingest              fetch + enrich
 *   npm run ingest -- --no-ai   fetch only (items are enriched on the next normal run)
 */
import { appendFile } from "node:fs/promises";
import { enrichBatch } from "@/lib/claude";
import { fetchSource } from "@/lib/fetchers";
import { SOURCES } from "@/lib/sources";
import { canonicalUrl, itemId, loadItems, saveItems } from "@/lib/store";
import { CATEGORIES, type Category, type Item } from "@/lib/types";

/** Only links published this recently are taken, so a feed's back catalogue doesn't flood in. */
const LOOKBACK_HOURS = 72;
/** Stories this recent are shown to Claude so it can spot repeat coverage. */
const DEDUPE_WINDOW_HOURS = 96;
const BATCH_SIZE = 25;
/** Cap per run so a backlog (e.g. after a long outage) can't blow up one run's cost. */
const MAX_ENRICH_PER_RUN = 200;

const noAi = process.argv.includes("--no-ai");
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

async function main() {
  const items = await loadItems();
  const byId = new Map(items.map((i) => [i.id, i]));
  const seenUrls = new Set(items.map((i) => canonicalUrl(i.url)));
  const since = hoursAgo(LOOKBACK_HOURS);
  const now = new Date().toISOString();

  // 1. Fetch
  const report: string[] = [];
  const results = await Promise.allSettled(SOURCES.map((s) => fetchSource(s, since)));
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

  // 2. Enrich (also retries items a previous run fetched but couldn't enrich)
  const all = [...byId.values()];
  const pending = all
    .filter((i) => !i.enrichedAt && !i.irrelevant)
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
    .slice(0, MAX_ENRICH_PER_RUN);
  let enriched = 0;
  let dropped = 0;
  let enrichError: string | undefined;

  if (!noAi && pending.length) {
    const cutoff = hoursAgo(DEDUPE_WINDOW_HOURS).toISOString();
    const recent = all
      .filter((i) => i.enrichedAt && !i.irrelevant && i.publishedAt >= cutoff && (i.storyId ?? i.id) === i.id)
      .map((i) => ({ id: i.id, title: i.title, source: i.sourceId }));

    for (let start = 0; start < pending.length; start += BATCH_SIZE) {
      const batch = pending.slice(start, start + BATCH_SIZE);
      console.log(`Enriching ${start + 1}-${start + batch.length} of ${pending.length}`);
      try {
        const results = await enrichBatch(batch, recent);
        for (const r of results) {
          const item = byId.get(r.id);
          if (!item || item.enrichedAt) continue;
          item.enrichedAt = new Date().toISOString();
          if (!r.relevant) {
            item.irrelevant = true;
            dropped++;
            continue;
          }
          const target = r.sameStoryAs && r.sameStoryAs !== item.id ? byId.get(r.sameStoryAs) : undefined;
          Object.assign(item, {
            summary: r.summary,
            whyItMatters: r.whyItMatters || undefined,
            category: CATEGORIES.includes(r.category as Category) ? (r.category as Category) : "products",
            importance: Math.min(5, Math.max(1, Math.round(r.importance))),
            entities: r.entities.slice(0, 5),
            storyId: target?.enrichedAt && !target.irrelevant ? (target.storyId ?? target.id) : item.id,
          });
          enriched++;
          if (item.storyId === item.id) recent.push({ id: item.id, title: item.title, source: item.sourceId });
        }
      } catch (err) {
        // Leave the rest pending; the next run picks them up.
        enrichError = (err as Error).message;
        console.error(`Enrichment failed: ${enrichError}`);
        break;
      }
    }
  }

  await saveItems(all);
  const stillPending = all.filter((i) => !i.enrichedAt).length;
  console.log(`Enriched ${enriched}, dropped ${dropped} off-topic, ${stillPending} still pending.`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = [
      `### Ingest: ${added} new, ${enriched} enriched, ${dropped} off-topic, ${stillPending} pending`,
      enrichError ? `\n> ⚠️ Enrichment stopped: ${enrichError}\n` : "",
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
