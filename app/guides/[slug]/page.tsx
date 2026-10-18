import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, SiteHeader } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";
import { fmtDate } from "@/lib/format";
import { type Guide, loadGuides } from "@/lib/guides";
import { renderMarkdown } from "@/lib/markdown";
import { AUTHOR, OG_BASE, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return loadGuides().map((g) => ({ slug: g.slug }));
}

const findGuide = (slug: string) => loadGuides().find((g) => g.slug === slug) ?? null;

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const guide = findGuide((await params).slug);
  if (!guide) return { title: "Not found" };
  return {
    title: guide.title,
    description: guide.dek,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { ...OG_BASE, type: "article", title: guide.title, description: guide.dek },
  };
}

/** Section title in the display face, as on briefings. */
function Heading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="display m-0 mt-4 scroll-mt-6 text-[18px] tracking-[0.08em]">
      {children}
    </h2>
  );
}

/** "Anthropic's documentation", or just "official documentation" for a guide drawing on several makers. */
const docsOf = (guide: Guide) => (guide.vendor === "Several" ? "official documentation" : `${guide.vendor}’s documentation`);

/**
 * A guide, read like a briefing: bone page, what you need, numbered steps, tips, questions and
 * the official pages it was written from. Free to read; it doesn't count toward the meter.
 */
export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const guide = findGuide((await params).slug);
  if (!guide) notFound();
  const others = loadGuides()
    .filter((g) => g.slug !== guide.slug)
    .slice(0, 4);

  const contents = [
    { href: "#before", label: "Before you start" },
    ...guide.steps.map((s, i) => ({ href: `#step-${i + 1}`, label: `${i + 1}. ${s.title}` })),
    ...(guide.tips.length ? [{ href: "#tips", label: "Tips" }] : []),
    ...(guide.faq.length ? [{ href: "#faq", label: "Questions" }] : []),
    { href: "#sources", label: `Sources (${guide.sources.length})` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title,
    description: guide.dek,
    url: `${SITE_URL}/guides/${guide.slug}`,
    dateModified: guide.updated,
    totalTime: `PT${guide.minutes}M`,
    author: { "@type": "Organization", name: "Context Window", url: `${SITE_URL}/about` },
    step: guide.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="bone">
        <SiteHeader active="guides" />

        <div className="container-cw flex flex-wrap gap-16 pb-18 pt-16">
          <article className="flex min-w-0 max-w-[820px] flex-[999_1_560px] flex-col gap-7">
            <p className="kicker m-0 flex flex-wrap gap-x-3">
              <Link href="/guides" className="text-signal hover:text-fg">
                Guide
              </Link>
              <span className="text-muted">{guide.product}</span>
              <span className="text-muted">{guide.level}</span>
            </p>
            <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-semibold leading-[1.08] tracking-[-0.02em] text-balance">
              {guide.title}
            </h1>
            <p className="m-0 max-w-[62ch] text-[clamp(18px,1.8vw,21px)] leading-[1.5] text-dek">{guide.dek}</p>
            <p className="m-0 text-[13px] text-muted">
              Curated by{" "}
              <Link href="/about" className="font-medium text-fg hover:text-signal">
                {AUTHOR.name}
              </Link>{" "}
              · Written with Claude from {docsOf(guide)} · Checked {fmtDate(guide.updated)} · {guide.minutes} min
            </p>

            {guide.intro.map((p) => (
              <p key={p} className="m-0 text-[18px] leading-[1.75] text-body">
                {p}
              </p>
            ))}

            <section aria-labelledby="before" className="chamfer-md flex flex-col gap-4 bg-black px-8 py-7 text-bone">
              <h2 id="before" className="display m-0 scroll-mt-10 text-[14px] tracking-[0.1em] text-orange">
                Before you start
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[17px] leading-[1.5]">
                {guide.youNeed.map((item) => (
                  <li key={item} className="grid grid-cols-[18px_1fr] gap-2">
                    <span className="mt-2.5 h-2 w-2 bg-orange" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <ol className="m-0 flex list-none flex-col gap-10 p-0">
              {guide.steps.map((step, i) => (
                <li key={step.title} id={`step-${i + 1}`} className="flex scroll-mt-6 flex-col gap-4 border-t border-rule pt-7">
                  <h2 className="m-0 flex items-baseline gap-4 text-[clamp(21px,2.2vw,26px)] font-semibold leading-[1.25]">
                    <span className="display text-[15px] text-signal">{String(i + 1).padStart(2, "0")}</span>
                    {step.title}
                  </h2>
                  <div className="md text-[18px] leading-[1.7] text-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(step.body) }} />
                </li>
              ))}
            </ol>

            {guide.tips.length > 0 && (
              <section aria-labelledby="tips" className="flex flex-col gap-4">
                <Heading id="tips">Tips</Heading>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {guide.tips.map((tip) => (
                    <li key={tip} className="border-l-[3px] border-orange pl-4 text-[17px] leading-[1.6] text-body">
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {guide.faq.length > 0 && (
              <section aria-labelledby="faq" className="flex flex-col gap-2">
                <Heading id="faq">Questions</Heading>
                {guide.faq.map((f) => (
                  <details key={f.q} className="group border-b border-rule py-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[18px] font-semibold">
                      {f.q}
                      <span className="text-signal transition-transform group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </summary>
                    <div className="md mt-3 text-[17px] leading-[1.65] text-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(f.a) }} />
                  </details>
                ))}
              </section>
            )}

            <section id="sources" aria-labelledby="sources-title" className="scroll-mt-6 border-t border-fg pt-5">
              <h2 id="sources-title" className="display m-0 mb-2 text-[14px] tracking-[0.1em]">
                Sources
              </h2>
              <ol className="m-0 list-none p-0">
                {guide.sources.map((s, n) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid grid-cols-[40px_1fr] items-baseline gap-x-3 gap-y-1 border-b border-rule py-3.5 sm:grid-cols-[40px_1fr_auto]"
                    >
                      <span className="display text-[12px] text-signal">{String(n + 1).padStart(2, "0")}</span>
                      <span className="font-medium">{s.title}</span>
                      <span className="col-start-2 text-[13px] text-muted sm:col-start-auto">{s.publisher}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <p className="m-0 text-[13px] text-muted">
              Written by Claude from the official pages above and checked against them on {fmtDate(guide.updated)}. Products
              change; if a step no longer matches what you see, the sources have the current version.{" "}
              <Link href="/about" className="link">
                How we work
              </Link>
            </p>
          </article>

          <aside aria-label="In this guide and more guides" className="flex min-w-0 flex-[1_1_300px] flex-col gap-10">
            <nav aria-labelledby="guide-contents" className="flex flex-col gap-3">
              <h2 id="guide-contents" className="display m-0 border-b border-fg pb-3 text-[14px] tracking-[0.1em]">
                In this guide
              </h2>
              <ol className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
                {contents.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="hover:text-signal">
                      <span className="text-signal">▸</span> {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <NewsletterBox variant="side" />
            {others.length > 0 && (
              <nav aria-labelledby="more-guides" className="flex flex-col">
                <h2 id="more-guides" className="display m-0 mb-1 border-b border-fg pb-3 text-[14px] tracking-[0.1em]">
                  More guides
                </h2>
                <ul className="m-0 list-none p-0">
                  {others.map((g) => (
                    <li key={g.slug}>
                      <Link href={`/guides/${g.slug}`} className="group flex flex-col gap-1 border-b border-rule py-4 hover:text-fg">
                        <span className="kicker text-signal">{g.product}</span>
                        <span className="text-[16px] font-semibold leading-[1.3] group-hover:text-signal">{g.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
        </div>

        <NewsletterBox variant="band" />
      </div>
      <Footer newsletterHref="#newsletter" />
    </>
  );
}
