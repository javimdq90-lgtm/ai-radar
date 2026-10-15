# AI Radar

A personal AI news aggregator. Every 3 hours it collects the latest AI news from labs, papers, Hacker News, the press and a few good writers. Claude summarises, scores and groups it, and a small site shows what matters. On Monday, Wednesday and Friday mornings Claude writes a short newsletter from the top stories and emails it to you.

Next.js 16 · React 19 · Tailwind v4 · Claude API · Resend · GitHub Actions. No database: the repo is the database.

## How it works

```
GitHub Actions, every 3h               GitHub Actions, Mon/Wed/Fri 06:07 UTC
────────────────────────               ─────────────────────────────────────
npm run ingest                         npm run newsletter
  fetch 16 sources                       top stories since the last issue
  drop links already seen                Claude writes the issue
  Claude: summary, why it matters,       email via Resend
    category, importance 1-5,            save data/issues/NNN.json
    "same story as …"                    commit + push
  save data/items/YYYY-MM.json
  commit + push ───────────────► Vercel redeploys the site on every push
```

- **Ranking:** Claude's importance (1–5), plus a bump when several sources cover the same story, decaying with a half-life of about 18 hours.
- **Grouping:** Claude sees the last four days of stories and links new coverage of the same event to the first item that reported it.
- **Safety nets:** links in the newsletter come from the stored data, never from the model. Items that couldn't be enriched are retried on the next run. A failed send doesn't archive the issue, so the next run retries it.

## Setup

1. **Claude API key.** Create one at [console.anthropic.com](https://console.anthropic.com). In this repo, add it as a secret named `ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions).
2. **Email (optional).** Create a [Resend](https://resend.com) account and API key, then add the secrets `RESEND_API_KEY` and `NEWSLETTER_TO` (your email). The default sender `onboarding@resend.dev` only delivers to the email on your Resend account, which is fine for "just me". To send from your own domain, verify it in Resend and add a repository *variable* `NEWSLETTER_FROM`, e.g. `AI Radar <radar@yourdomain.com>`.
3. **Site.** Import the repo in [Vercel](https://vercel.com/new). No settings or env vars needed. Optionally add the site URL as a repository variable `SITE_URL` for the "Read on the web" link in emails.
4. **First run.** Actions → *Ingest* → *Run workflow*. After that it runs on its own every 3 hours. Run *Newsletter* by hand once to see an issue.

## Costs

Everything runs on free tiers except Claude. Both jobs use `claude-haiku-5-5`: low effort for the per-item pass, high effort for writing the issue. At roughly 150 new items a day, that comes to around $1 a month. For richer summaries or a better-written newsletter, set `MODELS.triage` or `MODELS.writing` in `lib/claude.ts` to `claude-opus-5-5`. Opus costs about 40x more per token, so roughly $1–2 a day for triage.

## Local development

```bash
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY
npm install
npm run ingest               # fetch + enrich into data/
npm run newsletter -- --dry-run   # writes preview/issue.html, sends nothing
npm run dev
```

`npm run ingest -- --no-ai` fetches without calling Claude. The items are enriched on the next normal run.

## Where things live

| Path | What it is |
| --- | --- |
| [`lib/sources.ts`](lib/sources.ts) | The source list. Add a feed by adding a line. |
| [`lib/fetchers.ts`](lib/fetchers.ts) | RSS, Hacker News (Algolia API), HF Daily Papers, and an Anthropic news-page reader (it has no feed). |
| [`lib/claude.ts`](lib/claude.ts) | Both Claude prompts and schemas: triage and newsletter writing. Tune the voice and the importance rubric here. |
| [`scripts/ingest.ts`](scripts/ingest.ts), [`scripts/newsletter.ts`](scripts/newsletter.ts) | The two jobs. |
| [`lib/stories.ts`](lib/stories.ts) | Grouping and ranking. |
| [`lib/email.ts`](lib/email.ts) | Newsletter HTML and plain-text email. |
| [`app/`](app) | The site: `/` today, `/topic/[category]`, `/issues`, `/issues/[n]`. |
| `data/` | Written by the jobs. Items per month, one file per issue. |
| [`.github/workflows/`](.github/workflows) | The schedules. |

## Not yet

- Mistral and Meta AI have no feeds. They'd need page readers like Anthropic's.
- Reddit blocks unauthenticated requests from GitHub's runners, so r/LocalLLaMA would need API credentials.
- Batch API (half price) for the ingest pass, a public signup form, and an RSS feed of the site itself.
