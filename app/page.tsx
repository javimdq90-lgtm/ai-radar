import type { Metadata } from "next";
import Link from "next/link";
import { Footer, SectionTitle, SiteHeader, SUBLINE } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";
import { Scene } from "@/components/scene";
import { HeroCard, LatestRow, StoryCard, TopStory } from "@/components/story";
import { OG_BASE } from "@/lib/site";
import { BRAND } from "@/lib/brand-images";
import { getFrontPage } from "@/lib/site-data";
import type { Story } from "@/lib/types";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { ...OG_BASE, type: "website", url: "/" } };

function Arrow({ width = 36 }: { width?: number }) {
  return (
    <svg width={width} height={14} viewBox="0 0 36 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M0 7 H34 M28 1 L34 7 L28 13" />
    </svg>
  );
}

/**
 * One full-bleed visual with the header on top, the statement over its dark left side, and the
 * three leading stories as glass cards along the bottom edge.
 */
function Hero({ stories, now }: { stories: Story[]; now: string }) {
  return (
    <section aria-label="Intro" className="relative isolate overflow-hidden border-b border-rule">
      <div className="absolute inset-0 -z-10 bg-black">
        {/* public/brand/hero.* (and hero-mobile.* for phones) when present, else the closest scene. */}
        {BRAND.hero ? (
          // The photo fills the right two-thirds and fades into black on its left edge, under the statement.
          <div className="absolute inset-y-0 right-0 w-full md:w-[70%]">
            <picture>
              {BRAND.heroMobile && <source media="(max-width: 767px)" srcSet={BRAND.heroMobile} />}
              <img
                src={BRAND.hero}
                alt=""
                fetchPriority="high"
                className="h-full w-full object-cover object-[62%_center] saturate-[0.7] md:object-[left_center]"
              />
            </picture>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--cw-black)_0%,rgb(28_27_25/0)_38%)] max-md:bg-[rgb(28_27_25/0.55)]" />
          </div>
        ) : (
          <Scene name="curve" />
        )}
        {/* Darken the text side and the card strip so both read over any image. */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--cw-black)_0%,rgb(28_27_25/0.7)_30%,rgb(28_27_25/0)_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--cw-black)_0%,rgb(28_27_25/0)_40%)]" />
        {/* A soft band along the top so the header reads over bright sky and concrete. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgb(28_27_25/0.75)_0%,rgb(28_27_25/0)_100%)]" />
      </div>

      <SiteHeader overlay />

      <div className="container-cw flex min-h-[clamp(560px,82vh,860px)] flex-col justify-between gap-12 pb-6">
        <div className="flex max-w-[640px] flex-col gap-7 pt-[clamp(40px,9vh,110px)]">
          <h1 className="m-0 text-[clamp(44px,7vw,92px)] font-medium leading-[0.98] tracking-[-0.04em] text-bone">
            AI news.
            <br />A wider
            <br />
            context.
          </h1>
          <p className="m-0 max-w-[30ch] text-[clamp(16px,1.6vw,21px)] leading-[1.5] text-bone">{SUBLINE}</p>
        </div>

        {stories.length > 0 && (
          <div className="grid gap-px md:grid-cols-3">
            {stories.map((s) => (
              <HeroCard key={s.id} story={s} now={now} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default async function Home() {
  const { lead, top, wire, generatedAt: now } = await getFrontPage();
  // The top story is the highest-ranked briefing (our own summary); the next three go in the
  // hero cards and the rest in the grid.
  const ranked = lead ? [lead, ...top] : [];
  const topStory = ranked.find((s) => s.brief) ?? ranked[0];
  const others = ranked.filter((s) => s !== topStory);
  const heroStories = others.slice(0, 3);
  // Whole rows only: the grid is four wide on desktop and two on tablets, and the sign-up tile
  // fills two cells, so it shows six stories (or two).
  const rest = others.slice(3, 9);
  const gridStories = rest.length >= 6 ? rest : rest.slice(0, 2);

  return (
    <div className="max-md:pb-24">
      <Hero stories={heroStories} now={now} />

      {!lead ? (
        <p className="container-cw py-24 text-center text-muted">
          No stories yet. They appear after the first ingest run (<code>npm run ingest</code>).
        </p>
      ) : (
        <main className="container-cw">
          <section id="top-story" aria-labelledby="top-story-h" className="flex scroll-mt-6 flex-col gap-8 border-b border-rule py-16">
            <SectionTitle id="top-story-h">Top story</SectionTitle>
            <TopStory story={topStory} now={now} />
          </section>

          {gridStories.length > 0 && (
            <section id="top-stories" aria-labelledby="top-h" className="flex scroll-mt-6 flex-col gap-7 border-b border-rule py-14">
              <SectionTitle id="top-h">More stories</SectionTitle>
              {/* Hairline grid: each card draws a 1px ring that meets its neighbour's in the 1px gap. The
                  two-wide sign-up tile ends the first row on desktop and has a row of its own on tablets. */}
              <div className="grid gap-px p-px sm:grid-cols-2 lg:grid-cols-4">
                {gridStories.slice(0, 2).map((s) => (
                  <StoryCard key={s.id} story={s} now={now} />
                ))}
                <NewsletterBox variant="tile" />
                {gridStories.slice(2).map((s) => (
                  <StoryCard key={s.id} story={s} now={now} />
                ))}
              </div>
            </section>
          )}

          {/* data-prompt-at: the membership offer opens when a reader gets here (components/subscribe-prompt). */}
          <section id="latest" aria-labelledby="latest-h" data-prompt-at className="flex flex-col gap-5 pb-18 pt-14">
            <SectionTitle id="latest-h">Latest</SectionTitle>
            <ol className="m-0 list-none border-t-2 border-fg p-0 lg:grid lg:grid-cols-2 lg:gap-x-12">
              {wire.map((s) => (
                <LatestRow key={s.id} story={s} now={now} />
              ))}
            </ol>
          </section>
        </main>
      )}

      <Footer newsletterHref="#newsletter" />

      {/* Phones: the sign-up stays one tap away. */}
      <Link
        href="#newsletter"
        className="btn-cta fixed inset-x-4 bottom-4 z-40 min-h-[52px] justify-between px-5 [clip-path:var(--cw-chamfer-md)] md:hidden"
      >
        Get the briefing <Arrow width={28} />
      </Link>
    </div>
  );
}
