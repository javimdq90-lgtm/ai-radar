# Context Window

*Everything in AI worth keeping in context.* An AI news site and newsletter at [contextwindow.me](https://contextwindow.me) (the repo is still called ai-radar). Twice a day it collects the latest AI news from labs, papers, Hacker News, the press and a few good writers. Claude summarises, scores and groups it, and a small site shows what matters. On Monday, Wednesday and Friday mornings Claude writes a short newsletter from the top stories and emails it to you.

Next.js 16 · React 19 · Tailwind v4 · Claude API · Resend · GitHub Actions. No database: the repo is the database.

## How it works

```
GitHub Actions, 05:17 + 17:17 UTC      GitHub Actions, Mon/Wed/Fri 06:07 UTC
────────────────────────               ─────────────────────────────────────
npm run ingest                         npm run newsletter
  fetch 16 sources                       top stories since the last issue
  drop links already seen                Claude writes the issue
  Claude triage: summary, why it         email via Resend
    matters, category, importance 1-5    save data/issues/NNN.json
  find images (feed or og:image)         commit + push
  Claude desk: group coverage of the
    same story (last 72h, one pass)
  Claude briefings for big stories,
    from the articles' own text
  save data/items/YYYY-MM.json,
    data/briefs.json
  commit + push ───────────────► Vercel redeploys the site on every push
```

- **Ranking:** each importance point (1–5, from Claude) doubles a story's weight, each extra source adds 30% (up to 2.5x), and the total halves every 12 hours. A major launch leads for about a day.
- **Grouping:** after triage, Claude sees every story from the last 72 hours at once and merges coverage of the same event, including follow-ups and companion announcements. Items with identical titles are merged in code as well.
- **Briefings:** stories rated 4–5, or covered by 3+ sources in the last 48 hours, get their own page: a headline, standfirst, key points, background and what to watch, written from up to five of the actual articles. They're rewritten on the next run when new coverage arrives.
- **Safety nets:** links in the newsletter come from the stored data, never from the model. Items that couldn't be enriched are retried on the next run. A failed send doesn't archive the issue, so the next run retries it.

## Setup

1. **Claude API key.** Create one at [console.anthropic.com](https://console.anthropic.com). In this repo, add it as a secret named `ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions).
2. **Email (optional).** Create a [Resend](https://resend.com) account and API key, then add the secrets `RESEND_API_KEY` and `NEWSLETTER_TO` (your email). The default sender `onboarding@resend.dev` only delivers to the email on your Resend account, which is fine for "just me". To send from your own domain, verify it in Resend and add a repository *variable* `NEWSLETTER_FROM`, e.g. `Context Window <radar@yourdomain.com>`.
3. **Site.** Import the repo in [Vercel](https://vercel.com/new). No settings or env vars needed. Optionally add the site URL as a repository variable `SITE_URL` for the "Read on the web" link in emails.
4. **Subscribers (optional).** To let readers sign up and email each issue to all of them:
   - In Resend, verify your domain and create a segment. Set the repository variable `NEWSLETTER_FROM` to a sender on that domain (broadcasts can't use `onboarding@resend.dev`).
   - On the Vercel project, add the env vars `RESEND_API_KEY` (a **full access** key: a sending-only key can't add contacts) and `RESEND_SEGMENT_ID`, then redeploy. Until then the site's form says sign-ups aren't open.
   - Sign-ups are double opt-in: the form emails a signed link (valid 7 days, from `NEWSLETTER_FROM` if set on Vercel, else `hello@contextwindow.me`), and the address joins the segment only when the reader clicks *Yes, subscribe me* on `/subscribe/confirm`. The form has a honeypot field, a too-fast-to-be-human check and a per-IP limit. Links are signed with a key derived from the API key; set `SUBSCRIBE_SECRET` on Vercel to use your own (changing either invalidates unconfirmed links).
   - In this repo, add the variables `RESEND_SEGMENT_ID` and `NEWSLETTER_ADDRESS` (a postal address for the footer, which bulk-email law requires). The newsletter job then sends each issue to the segment as a Resend broadcast, with a per-reader unsubscribe link, instead of to `NEWSLETTER_TO`. Subscribe your own address on the site to keep getting it.
   - Check it first with `npm run newsletter -- --dry-run` and `RESEND_SEGMENT_ID` set locally: `preview/issue.html` shows the subscriber footer.
5. **Membership (optional).** Readers get 3 full briefings a month, then pay $2 a month through Stripe (`lib/meter.ts`, `lib/membership.ts`). Until both Stripe env vars are set, there's no meter, paywall or prompt, and the membership page says memberships open soon.
   - Create a [Stripe](https://stripe.com) account. With its test secret key, run `STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts` to create the product and $2 monthly price, and note the price id it prints.
   - In Stripe, add a webhook endpoint (Developers → Webhooks) for `https://contextwindow.me/membership/webhook` with the events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. It adds new members to the newsletter; access itself is read from Stripe, so it needs no events.
   - On Vercel, add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` and the webhook's signing secret as `STRIPE_WEBHOOK_SECRET` (plus `RESEND_API_KEY`, which sends sign-in links), marked *Sensitive*, then redeploy. For live mode, use a restricted key (`rk_live_…`) instead of the secret key, with write access to Checkout Sessions and Customer portal and read access to Customers and Subscriptions. Check a test checkout with card `4242 4242 4242 4242`, then repeat the setup script and the env vars with the live key.
   - In Stripe, turn on the customer portal (Settings → Billing → Customer portal) so members can cancel and change cards, and the failed-payment emails (Settings → Billing → Subscriptions and emails) so members hear about a declined card.
   - Sales tax: the $2 is charged with no tax added. If you'll charge readers where you're registered for sales tax or VAT, set up Stripe Tax and its registrations before turning on `automatic_tax`.
   - There's no database: Stripe is the record of who pays, and a signed cookie remembers the reader. Access is re-checked with Stripe every 3 days. The meter is a soft paywall: counted in the browser, with full text in the page for search engines. Cookies are signed with a key derived from the Stripe key; set `MEMBER_SECRET` to use your own (changing either signs everyone out).
6. **Newsletter extras (optional).**
   - Ratings: each issue ends with "How was this issue?". Readers confirm on `/feedback`, and the answer is emailed to `FEEDBACK_TO` (set it on Vercel, with `RESEND_API_KEY`); without it, answers only reach the server log.
   - Sponsors: put a `data/sponsor.json` in the repo, `{ "name", "url", "headline", "body", "cta"?, "from"?, "until"? }` (dates as YYYY-MM-DD), and the next issue in that window carries it after its first section, labelled "Sponsored". It's frozen into that issue; delete the file when the booking ends.
7. **First run.** Actions → *Ingest* → *Run workflow*. After that it runs on its own every 12 hours. Run *Newsletter* by hand once to see an issue.

## Costs

Everything runs on free tiers except Claude. Every step uses `claude-sonnet-5-5` (set in `MODELS` in `lib/claude.ts`): triage at low effort, grouping and briefings at medium, the newsletter at high. At roughly 150 new items a day, expect about $10–15 a month, most of it triage. Running twice a day instead of more often barely changes triage (it is per item) but cuts grouping runs. `claude-haiku-5-5` is about 20x cheaper per token but groups stories noticeably worse.

## Local development

```bash
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY
npm install
npm run ingest               # fetch + enrich into data/
npm run newsletter -- --dry-run   # writes preview/issue.html, sends nothing
npm run dev
```

`npm run ingest -- --no-ai` fetches without calling Claude. The items are enriched on the next normal run.

**After changing a prompt** in `lib/claude.ts`, re-run the last four days through it: Actions → *Ingest* → *Run workflow*, tick **redo**. Locally: `npm run ingest -- --redo`.

**After changing only the briefing prompt** (briefings now include a full article: what happened, why it matters, what to watch and a pull quote that is checked to appear word for word in the coverage), rewrite the current briefings without re-triaging: Actions → *Ingest* → *Run workflow*, tick **rebrief**. Locally: `npm run ingest -- --rebrief`.

## Where things live

| Path | What it is |
| --- | --- |
| [`lib/sources.ts`](lib/sources.ts) | The source list. Add a feed by adding a line. |
| [`lib/fetchers.ts`](lib/fetchers.ts) | RSS, Hacker News (Algolia API), HF Daily Papers, and an Anthropic news-page reader (it has no feed). |
| [`lib/claude.ts`](lib/claude.ts) | Both Claude prompts and schemas: triage and newsletter writing. Tune the voice and the importance rubric here. |
| [`scripts/ingest.ts`](scripts/ingest.ts), [`scripts/newsletter.ts`](scripts/newsletter.ts) | The two jobs. |
| [`lib/stories.ts`](lib/stories.ts) | Grouping and ranking. |
| [`lib/email.ts`](lib/email.ts) | Newsletter HTML (table-based, in the site's dark design) and plain-text email. |
| [`app/globals.css`](app/globals.css), [`lib/category.ts`](lib/category.ts) | Design tokens: colours, category colours and tints. Fonts are set in `app/layout.tsx`. |
| [`app/`](app) | The site: `/` today, `/topic/[category]`, `/issues`, `/issues/[n]`. |
| `data/` | Written by the jobs. Items per month, one file per issue. |
| [`.github/workflows/`](.github/workflows) | The schedules. |

## Not yet

- Mistral and Meta AI have no feeds. They'd need page readers like Anthropic's.
- Reddit blocks unauthenticated requests from GitHub's runners, so r/LocalLLaMA would need API credentials.
- Batch API (half price) for the ingest pass, a preferences page for subscribers, and an RSS feed of the site itself.
- Real images for every story. Stories show the publisher's image, hotlinked from the feed or `og:image`; about half have none and get generated art instead (category tint and a token pattern).
