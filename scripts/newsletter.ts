/**
 * Write the next issue from the top stories since the last one, email it, and archive it.
 *
 *   npm run newsletter               write, send, save
 *   npm run newsletter -- --dry-run  write and save a preview to preview/, send nothing
 */
import { mkdir, writeFile } from "node:fs/promises";
import { Resend } from "resend";
import { writeIssue } from "@/lib/claude";
import { renderIssueHtml, renderIssueText } from "@/lib/email";
import { SOURCE_NAMES } from "@/lib/sources";
import { loadBriefs, loadIssues, loadItems, saveIssue } from "@/lib/store";
import { buildStories } from "@/lib/stories";
import type { Issue, Item } from "@/lib/types";

const DAY = 86_400_000;
/** First issue (or after a long gap) looks back this far at most. */
const MAX_LOOKBACK_DAYS = 4;
const MAX_STORIES_TO_CLAUDE = 30;
const MIN_STORIES = 3;

const dryRun = process.argv.includes("--dry-run");

function linksFor(items: Item[]) {
  const out: Issue["links"][string] = [];
  const seen = new Set<string>();
  const add = (title: string, url: string, source: string) => {
    if (seen.has(url)) return;
    seen.add(url);
    out.push({ title, url, source });
  };
  for (const item of items) {
    if (item.sourceId === "hn") {
      if (item.url !== item.discussionUrl) add(item.title, item.url, new URL(item.url).hostname.replace(/^www\./, ""));
      if (item.discussionUrl) add(item.title, item.discussionUrl, "HN discussion");
    } else {
      add(item.title, item.url, SOURCE_NAMES[item.sourceId] ?? item.sourceId);
    }
  }
  return out;
}

async function main() {
  const [items, issues, briefs] = await Promise.all([loadItems(), loadIssues(), loadBriefs()]);
  const last = issues[0];
  const since = new Date(Math.max(last ? new Date(last.date).getTime() : 0, Date.now() - MAX_LOOKBACK_DAYS * DAY));
  const covered = new Set(issues.flatMap((i) => Object.keys(i.links)));

  const candidates = buildStories(items, briefs)
    .filter((s) => s.firstSeen >= since.toISOString() && !covered.has(s.id) && s.importance >= 2)
    .sort((a, b) => b.importance - a.importance || b.sourceCount - a.sourceCount || b.firstSeen.localeCompare(a.firstSeen))
    .slice(0, MAX_STORIES_TO_CLAUDE);

  if (candidates.length < MIN_STORIES) {
    console.log(`Only ${candidates.length} new stories since ${since.toISOString()}; skipping this issue.`);
    return;
  }

  const number = (last?.number ?? 0) + 1;
  console.log(`Writing issue #${number} from ${candidates.length} stories since ${since.toDateString()}`);
  const draft = await writeIssue(number, since, candidates);

  // Keep only stories Claude was actually given, each once; links come from our data, never the model.
  const byId = new Map(candidates.map((s) => [s.id, s]));
  const used = new Set<string>();
  const take = (id: string) => {
    if (!byId.has(id) || used.has(id)) return false;
    used.add(id);
    return true;
  };
  const sections = draft.sections
    .map((sec) => ({ heading: sec.heading, stories: sec.stories.filter((s) => take(s.storyId)) }))
    .filter((sec) => sec.stories.length);
  const quickHits = draft.quickHits.filter((q) => take(q.storyId));

  const issue: Issue = {
    number,
    date: new Date().toISOString(),
    subject: draft.subject,
    preview: draft.preview,
    intro: draft.intro,
    sections,
    quickHits,
    links: Object.fromEntries([...used].map((id) => [id, linksFor(byId.get(id)!.items)])),
  };

  const html = renderIssueHtml(issue, process.env.SITE_URL);
  if (dryRun) {
    await mkdir("preview", { recursive: true });
    await writeFile("preview/issue.html", html);
    await writeFile("preview/issue.json", JSON.stringify(issue, null, 2));
    console.log(`Dry run: wrote preview/issue.html ("${issue.subject}")`);
    return;
  }

  const { RESEND_API_KEY, NEWSLETTER_TO } = process.env;
  if (RESEND_API_KEY && NEWSLETTER_TO) {
    const { data, error } = await new Resend(RESEND_API_KEY).emails.send({
      from: process.env.NEWSLETTER_FROM || "AI Radar <onboarding@resend.dev>",
      to: NEWSLETTER_TO.split(",").map((s) => s.trim()),
      subject: issue.subject,
      html,
      text: renderIssueText(issue),
    });
    // Don't archive an issue that wasn't sent, so the next run retries with the same stories.
    if (error) throw new Error(`Resend: ${error.message}`);
    console.log(`Sent issue #${number} to ${NEWSLETTER_TO} (${data?.id})`);
  } else {
    console.warn("RESEND_API_KEY or NEWSLETTER_TO not set: archiving on the site without emailing.");
  }

  await saveIssue(issue);
  console.log(`Saved issue #${number}: ${issue.subject}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
