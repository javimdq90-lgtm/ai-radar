import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { SOURCE_NAMES } from "./sources";
import { CATEGORIES, type Item, type Story } from "./types";

/**
 * Triage runs on every item, so it is where the cost is. Switching it to "claude-haiku-5-5"
 * cuts the bill by more than 90%, with somewhat flatter summaries.
 */
const MODELS = { triage: "claude-opus-5-5", writing: "claude-opus-5-5" };

/**
 * Server-side fallback: if a safety classifier declines a request (rare for news, but
 * possible on security or bio stories), the API retries on a fallback model instead of
 * returning a refusal.
 */
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

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
    ...FALLBACK,
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

// ---------------------------------------------------------------------------
// Ingest: summarise, categorise, score and group new items

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
      sameStoryAs: z.string().nullable(),
    }),
  ),
});

export type Enrichment = z.infer<typeof EnrichmentSchema>["items"][number];

const ENRICH_SYSTEM = `You triage AI news for one reader: someone who follows AI closely (builder, not a researcher) and wants signal, not hype.

For every new item, return:
- relevant: false if it is not about AI/ML (common on Hacker News and general research feeds) or is a sales pitch, webinar or job post. If false, the other fields can be empty/1.
- summary: 1-2 plain sentences saying what actually happened, with the specifics (names, numbers, what's new). No hype, no "This article discusses". Work only from the title and snippet; don't invent details.
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
- sameStoryAs: if the item reports the same event as one of the RECENT STORIES or an EARLIER item in NEW ITEMS (same launch, paper, deal or ruling, not merely the same topic), that item's id. Otherwise null.

Return exactly one entry per new item, using its id.`;

type RecentStory = { id: string; title: string; source: string };

export async function enrichBatch(items: Item[], recent: RecentStory[]): Promise<Enrichment[]> {
  const newItems = items.map((i) => ({
    id: i.id,
    source: SOURCE_NAMES[i.sourceId] ?? i.sourceId,
    title: i.title,
    snippet: i.snippet ?? "",
    ...(i.score ? { popularity: i.score } : {}),
  }));
  const prompt = `<recent_stories>\n${JSON.stringify(recent)}\n</recent_stories>\n\n<new_items>\n${JSON.stringify(newItems)}\n</new_items>`;
  const result = await structured({ model: MODELS.triage, effort: "low", system: ENRICH_SYSTEM, prompt, schema: EnrichmentSchema });
  return result.items;
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
    title: s.lead.title,
    category: s.category,
    importance: s.importance,
    coveredBy: [...new Set(s.items.map((i) => SOURCE_NAMES[i.sourceId] ?? i.sourceId))],
    summary: s.lead.summary,
    whyItMatters: s.lead.whyItMatters,
    otherAngles: s.items
      .filter((i) => i !== s.lead && i.summary)
      .slice(0, 3)
      .map((i) => i.summary),
  }));
  const prompt = `Issue #${number}, covering ${since.toDateString()} to ${new Date().toDateString()}.\n\n<stories>\n${JSON.stringify(material, null, 1)}\n</stories>`;
  return structured({ model: MODELS.writing, effort: "high", system: ISSUE_SYSTEM, prompt, schema: IssueDraftSchema });
}
