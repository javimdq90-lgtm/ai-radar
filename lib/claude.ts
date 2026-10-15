import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { SOURCE_NAMES } from "./sources";
import { CATEGORIES, type Item, type Story } from "./types";

/**
 * Sonnet for everything: triage runs on every item (most of the bill), grouping and
 * briefings once per run, the newsletter three times a week. "claude-haiku-5-5" is about
 * 20x cheaper per token but groups stories noticeably worse.
 */
const MODELS = { triage: "claude-sonnet-5-5", desk: "claude-sonnet-5-5", writing: "claude-sonnet-5-5" };

/**
 * Server-side fallback: if a safety classifier declines a request (rare for news, but
 * possible on security or bio stories), the API retries on a fallback model instead of
 * returning a refusal. Haiku has no fallback model, so it is only sent for Opus/Sonnet.
 */
const fallbackFor = (model: string) =>
  model.startsWith("claude-haiku") ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

let client: Anthropic | undefined;
const claude = () => (client ??= new Anthropic());

async function structured<T>(params: {
  model: string;
  effort: "low" | "medium" | "high";
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
}): Promise<T> {
  const stream = claude().beta.messages.stream({
    model: params.model,
    max_tokens: 64000,
    ...fallbackFor(params.model),
    output_config: { effort: params.effort, format: betaZodOutputFormat(params.schema) },
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new Error(`Claude declined (${message.stop_details?.category ?? "no category"})`);
  }
  if (message.stop_reason === "max_tokens") throw new Error("Claude ran out of output tokens");
  if (!message.parsed_output) throw new Error("Claude returned output that did not match the schema");
  const { input_tokens, output_tokens } = message.usage;
  console.log(`  claude: ${input_tokens} in / ${output_tokens} out`);
  return message.parsed_output as T;
}

/** What we tell Claude a link's source is. */
function sourceLabel(i: Item) {
  // For Hacker News links, name the site the link points to: told "Hacker News", the
  // model summarises the thread ("A Hacker News discussion argues…") instead of the news.
  if (i.sourceId !== "hn") return SOURCE_NAMES[i.sourceId] ?? i.sourceId;
  return i.url === i.discussionUrl ? "a forum post" : new URL(i.url).hostname.replace(/^www\./, "");
}

// ---------------------------------------------------------------------------
// Triage: summarise, categorise and score each new item

const EnrichmentSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      relevant: z.boolean().describe("False when the item is not about AI, or is pure spam/promo."),
      summary: z.string(),
      whyItMatters: z.string(),
      // Plain string/number rather than enum/int: one off-list value would otherwise fail the
      // whole batch. ingest.ts normalises both.
      category: z.string().describe(`One of: ${CATEGORIES.join(", ")}`),
      importance: z.number().describe("1 to 5, see rubric"),
      entities: z.array(z.string()),
    }),
  ),
});

export type Enrichment = z.infer<typeof EnrichmentSchema>["items"][number];

const ENRICH_SYSTEM = `You triage AI news for one reader: someone who follows AI closely (builder, not a researcher) and wants signal, not hype.

For every new item, return:
- relevant: false only if it is clearly not about AI/ML (general science, politics or hardware with no AI angle), or is an event ticket offer, sales pitch, webinar or job post. AI culture, commentary, criticism and quirky experiments ARE relevant; when unsure, keep it and give it a low importance.
- summary: 1-2 plain sentences stating the news itself: who did what, with the specifics (names, numbers, what's new). Write it as a news brief, never about where it was posted or discussed: no "a Hacker News discussion", "is drawing attention on", "X has posted its announcement", "this article". For an essay or opinion piece, state its argument ("Developers are wrong to …, argues X"). If you only have a title, restate the news plainly in one sentence. Don't invent details.
- whyItMatters: one sentence on the consequence for people building with or following AI. Empty string if it would just repeat the summary.
- category: models (new/updated models, benchmarks), research (papers, findings), products (apps and features for end users), open-source (open weights, repos, libraries), policy (regulation, safety, legal, labour), business (funding, deals, hiring, earnings), tools (developer tools, APIs, infra).
- importance:
  5 = the story everyone in AI will talk about this week (frontier model launch, landmark ruling, giant acquisition)
  4 = significant: notable launch from a major lab, widely discussed paper, big funding round or strategy shift
  3 = solid news worth knowing
  2 = minor update, niche release, incremental paper
  1 = opinion, listicle, recap, tutorial, promo
  Opinion and analysis pieces from respected writers can still be 3 if they add real insight.
- entities: the companies, models and people at the centre of it (max 5), as commonly written ("OpenAI", "Gemini 3").

Return exactly one entry per item, using its id.`;

export async function enrichBatch(items: Item[]): Promise<Enrichment[]> {
  const input = items.map((i) => ({
    id: i.id,
    source: sourceLabel(i),
    title: i.title,
    snippet: i.snippet ?? "",
    ...(i.score ? { popularity: i.score } : {}),
  }));
  const prompt = `<items>\n${JSON.stringify(input)}\n</items>`;
  const result = await structured({ model: MODELS.triage, effort: "low", system: ENRICH_SYSTEM, prompt, schema: EnrichmentSchema });
  return result.items;
}

// ---------------------------------------------------------------------------
// Desk: group every recent item into stories, in one pass so nothing is split across batches

const GroupsSchema = z.object({
  groups: z.array(z.object({ itemIds: z.array(z.string()) })),
});

const GROUP_SYSTEM = `You are the news desk of an AI news site. You get every item from the last few days. Group the items that are about the same story, so the site shows each story once with all its coverage.

Same story:
- the same launch, announcement, paper, deal, ruling or incident, reported by different outlets;
- follow-ups within days: hands-on reviews, reactions, analysis and discussion of that same event;
- later developments in the same situation within days: a company's bankruptcy filing, the bid for its assets and regulators' response to the sale are one story; so are an incident, the arrest it leads to and the company's statement;
- companion announcements made alongside a launch by the same company (a variant of the launched model, its safety report, its API pricing).

Not the same story: different events that merely share a company, product or topic (two separate lawsuits against OpenAI by different plaintiffs; a model launch and an unrelated outage). A reader should never see the same situation twice on the front page, but should never find two unrelated events merged either.

Return only groups of two or more items. Every item id may appear in at most one group. Leave items that stand alone out.`;

export async function groupStories(items: Item[]): Promise<string[][]> {
  const input = items.map((i) => ({
    id: i.id,
    date: i.publishedAt.slice(0, 10),
    source: sourceLabel(i),
    title: i.title,
    summary: (i.summary ?? "").slice(0, 220),
  }));
  const prompt = `<items>\n${JSON.stringify(input)}\n</items>`;
  const result = await structured({ model: MODELS.desk, effort: "medium", system: GROUP_SYSTEM, prompt, schema: GroupsSchema });
  return result.groups.map((g) => g.itemIds);
}

// ---------------------------------------------------------------------------
// Briefings: a short explainer for the biggest stories, from the articles themselves

const BriefSchema = z.object({
  headline: z.string(),
  dek: z.string(),
  keyPoints: z.array(z.string()),
  context: z.string(),
  whatsNext: z.string(),
});

export type BriefDraft = z.infer<typeof BriefSchema>;

const BRIEF_SYSTEM = `You write the briefing for one of the day's biggest AI stories on AI Radar, a news site for people who follow AI closely. You get every piece of coverage, with article text where it could be fetched.

Write:
- headline: a news headline in sentence case, under 90 characters, that states what happened concretely ("Google launches Gemini 4 Argon, its most capable model yet"). Not the company's marketing title.
- dek: one sentence, under 35 words, with the key specifics a reader needs first.
- keyPoints: 3 to 5 bullet points, each a concrete fact from the coverage (numbers, availability, prices, names, claims and who makes them). Under 30 words each. Most important first.
- context: 2-3 sentences of background: how this fits what came before (earlier versions, competitors, the dispute so far) and why it matters. You may use well-established background knowledge; don't speculate.
- whatsNext: one sentence on what to watch for next, only if the coverage points to something concrete (a rollout date, a ruling, a vote). Otherwise an empty string.

Rules: use only facts in the material, apart from well-established background in context. Attribute claims ("Google says…"). No hype words, no exclamation marks, no "In a move that…". Plain, specific, a little dry.`;

export type BriefMaterial = { source: string; title: string; summary?: string; text?: string };

export async function writeBrief(material: BriefMaterial[]): Promise<BriefDraft> {
  const prompt = material
    .map((m, n) => `<coverage index="${n + 1}" source="${m.source}">\n<title>${m.title}</title>\n${m.summary ? `<summary>${m.summary}</summary>\n` : ""}${m.text ? `<text>${m.text}</text>\n` : ""}</coverage>`)
    .join("\n\n");
  return structured({ model: MODELS.desk, effort: "medium", system: BRIEF_SYSTEM, prompt, schema: BriefSchema });
}

// ---------------------------------------------------------------------------
// Newsletter: write an issue from the top stories since the last one

const IssueDraftSchema = z.object({
  subject: z.string(),
  preview: z.string(),
  intro: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      stories: z.array(z.object({ storyId: z.string(), headline: z.string(), body: z.string() })),
    }),
  ),
  quickHits: z.array(z.object({ storyId: z.string(), text: z.string() })),
});

export type IssueDraft = z.infer<typeof IssueDraftSchema>;

const ISSUE_SYSTEM = `You write AI Radar, a short newsletter about the latest in AI, sent every two or three days to one reader who follows the field closely and has five minutes.

Voice: a well-informed friend. Plain, specific and a little dry. No hype words (revolutionary, game-changer, unleash, delve), no exclamation marks, no "In this issue".

Structure:
- subject: under 70 characters, names the biggest story concretely.
- preview: one line shown in the inbox after the subject, teasing the second or third story.
- intro: 2-3 sentences on the shape of the past few days. Don't restate the headlines.
- sections: 2-4 sections with short, plain headings (e.g. "The big one", "Models", "Research worth reading", "Money and policy"). 4-8 stories in total, most important first. Each story: a headline that states the news, and a body of 50-110 words covering what happened, the specifics that matter, and why the reader should care. Merge closely related stories into one entry.
- quickHits: 4-10 one-line items for the rest worth knowing, each under 25 words.

Rules:
- Use only facts present in the material. If a detail is missing, leave it out; never guess numbers, dates or quotes.
- Refer to stories only by the storyId given. Each storyId appears at most once in the whole issue. Links are added for you, so don't write URLs.
- Skip anything that's filler. Fewer, better stories beat coverage.`;

export async function writeIssue(number: number, since: Date, stories: Story[]): Promise<IssueDraft> {
  const material = stories.map((s) => ({
    storyId: s.id,
    title: s.brief?.headline ?? s.lead.title,
    category: s.category,
    importance: s.importance,
    coveredBy: [...new Set(s.items.map(sourceLabel))],
    summary: s.brief?.dek ?? s.lead.summary,
    ...(s.brief ? { keyPoints: s.brief.keyPoints, context: s.brief.context } : { whyItMatters: s.lead.whyItMatters }),
    otherAngles: s.items
      .filter((i) => i !== s.lead && i.summary)
      .slice(0, 3)
      .map((i) => i.summary),
  }));
  const prompt = `Issue #${number}, covering ${since.toDateString()} to ${new Date().toDateString()}.\n\n<stories>\n${JSON.stringify(material, null, 1)}\n</stories>`;
  return structured({ model: MODELS.writing, effort: "high", system: ISSUE_SYSTEM, prompt, schema: IssueDraftSchema });
}
