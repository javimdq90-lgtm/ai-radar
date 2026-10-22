/**
 * Write the next issue from the top stories since the last one, email it, and archive it.
 * It goes to the site's sign-ups (RESEND_SEGMENT_ID) or, without a segment, to NEWSLETTER_TO.
 *
 *   npm run newsletter               write, send, save
 *   npm run newsletter -- --dry-run  write and save a preview to preview/, send nothing
 */
import { mkdir, writeFile } from "node:fs/promises";
import { Resend } from "resend";
import { writeIssue } from "@/lib/claude";
import { type EmailOptions, RESEND_UNSUBSCRIBE_URL, renderIssueHtml, renderIssueText } from "@/lib/email";
import { emailImageFor } from "@/lib/share-image";
import { SITE_URL } from "@/lib/site";
import { SOURCE_NAMES } from "@/lib/sources";
import { loadBriefs, loadIssues, loadItems, loadSponsor, saveIssue } from "@/lib/store";
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

type Delivery =
  | { mode: "subscribers"; apiKey: string; segmentId: string; from: string; postalAddress: string }
  | { mode: "direct"; apiKey: string; from: string; to: string[] }
  | { mode: "none" };

/**
 * Who gets the issue. With RESEND_SEGMENT_ID it goes to everyone who signed up on the site, as a
 * Resend broadcast; otherwise to NEWSLETTER_TO. Checked before Claude writes anything, so a
 * misconfigured send fails without spending a call.
 */
function resolveDelivery(): Delivery {
  const { RESEND_API_KEY, RESEND_SEGMENT_ID, NEWSLETTER_TO, NEWSLETTER_FROM, NEWSLETTER_ADDRESS } = process.env;
  const from = NEWSLETTER_FROM || "Context Window <onboarding@resend.dev>";

  if (RESEND_SEGMENT_ID) {
    // A dry run only renders, so show the subscriber footer without requiring the real settings.
    if (dryRun) {
      return { mode: "subscribers", apiKey: "", segmentId: RESEND_SEGMENT_ID, from, postalAddress: NEWSLETTER_ADDRESS || "[Postal address]" };
    }
    if (!RESEND_API_KEY) throw new Error("RESEND_SEGMENT_ID is set but RESEND_API_KEY is not.");
    // Bulk email has to say where it comes from (CAN-SPAM and similar laws).
    if (!NEWSLETTER_ADDRESS) throw new Error("Set NEWSLETTER_ADDRESS (a postal address for the footer) to send to subscribers.");
    if (from.includes("@resend.dev")) {
      throw new Error("Broadcasts need a sender on your own verified domain: set NEWSLETTER_FROM.");
    }
    return { mode: "subscribers", apiKey: RESEND_API_KEY, segmentId: RESEND_SEGMENT_ID, from, postalAddress: NEWSLETTER_ADDRESS };
  }
  if (RESEND_API_KEY && NEWSLETTER_TO) {
    return { mode: "direct", apiKey: RESEND_API_KEY, from, to: NEWSLETTER_TO.split(",").map((s) => s.trim()) };
  }
  return { mode: "none" };
}

async function main() {
  const delivery = resolveDelivery();
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
  // A paid placement, if one is booked for today (data/sponsor.json). Rendered with a "Sponsored" label.
  const sponsor = await loadSponsor();
  if (sponsor) issue.sponsor = sponsor;

  // Section stories get a picture; checked now, since a mail client can't fall back on its own.
  const imageSite = process.env.SITE_URL || SITE_URL;
  const images = new Map(
    await Promise.all(
      sections.flatMap((sec) => sec.stories).map(async (s) => [s.storyId, await emailImageFor(byId.get(s.storyId)!, imageSite)] as const),
    ),
  );
  const emailOptions: EmailOptions = {
    siteUrl: process.env.SITE_URL,
    stories: Object.fromEntries(
      [...used].map((id) => [id, { category: byId.get(id)!.category, briefed: Boolean(byId.get(id)!.brief), image: images.get(id) }]),
    ),
    subscribers: delivery.mode === "subscribers"
      ? { unsubscribeUrl: RESEND_UNSUBSCRIBE_URL, postalAddress: delivery.postalAddress }
      : undefined,
  };
  const html = renderIssueHtml(issue, emailOptions);
  const text = renderIssueText(issue, emailOptions);
  if (dryRun) {
    await mkdir("preview", { recursive: true });
    await writeFile("preview/issue.html", html);
    await writeFile("preview/issue.json", JSON.stringify(issue, null, 2));
    console.log(`Dry run: wrote preview/issue.html ("${issue.subject}")`);
    return;
  }

  // Don't archive an issue that wasn't sent, so the next run retries with the same stories.
  if (delivery.mode === "subscribers") {
    const { data, error } = await new Resend(delivery.apiKey).broadcasts.create({
      name: `Issue #${number}`,
      segmentId: delivery.segmentId,
      from: delivery.from,
      subject: issue.subject,
      previewText: issue.preview,
      html,
      text,
      send: true,
    });
    if (error) throw new Error(`Resend broadcast: ${error.message}`);
    console.log(`Sent issue #${number} to segment ${delivery.segmentId} (broadcast ${data?.id})`);
  } else if (delivery.mode === "direct") {
    const { data, error } = await new Resend(delivery.apiKey).emails.send({
      from: delivery.from,
      to: delivery.to,
      subject: issue.subject,
      html,
      text,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
    console.log(`Sent issue #${number} to ${delivery.to.join(", ")} (${data?.id})`);
  } else {
    console.warn("RESEND_API_KEY or a recipient (RESEND_SEGMENT_ID / NEWSLETTER_TO) not set: archiving on the site without emailing.");
  }

  await saveIssue(issue);
  console.log(`Saved issue #${number}: ${issue.subject}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
