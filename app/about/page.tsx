import type { Metadata } from "next";
import { Footer, SiteHeader, TAGLINE } from "@/components/brand";
import { BRAND } from "@/lib/brand-images";
import { FREE_BRIEFINGS, PRICE_LABEL } from "@/lib/meter";
import { AUTHOR, CONTACT_EMAIL } from "@/lib/site";
import { SOURCES } from "@/lib/sources";

export const metadata: Metadata = {
  title: "About & standards",
  description: "What Context Window is, how its briefings are made with Claude, and how to report an error.",
  alternates: { canonical: "/about" },
};

const STEPS = [
  {
    title: "Collect",
    body: `Every 12 hours we gather new stories from ${SOURCES.length} sources: AI labs, technology publications, research feeds and the communities where news breaks first.`,
  },
  {
    title: "Sort",
    body: "Claude reads each item, sets aside what isn't about AI, rates how much it matters and groups coverage of the same news into one story, so you see it once.",
  },
  {
    title: "Brief",
    body: "For the biggest stories, Claude writes a briefing from all of the coverage at once: what happened, why it matters and what to watch, with a numbered link to every source.",
  },
  {
    title: "Check",
    body: "Code checks the output before it publishes. A quote only appears if it is word for word in the coverage, and links come from our own records, never from the model.",
  },
];

const STANDARDS = [
  "Facts come from the coverage and nowhere else. If a detail isn't in the sources, it isn't in the briefing.",
  "Company claims are attributed to the company, not stated as fact.",
  "Every briefing links to all the reporting it was written from, so you can check it.",
  "Briefings publish automatically as stories develop. They aren't reviewed by a person before they go live, which is why the sources are always one click away.",
  "Sponsored placements in the newsletter are always labelled “Sponsored” and never influence what we cover.",
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-cw flex flex-col gap-16 pb-24 pt-14">
        <header className="flex max-w-[820px] flex-col gap-5">
          <p className="kicker m-0 text-signal">About &amp; standards</p>
          <h1 className="display m-0 text-[clamp(30px,4.6vw,52px)] leading-[1.08]">{TAGLINE}</h1>
          <p className="m-0 text-[clamp(18px,1.8vw,21px)] leading-[1.55] text-dek">
            Context Window explains the AI news that matters. Instead of one outlet&rsquo;s take, each briefing is written
            from all the coverage of a story at once, with every source linked.
          </p>
        </header>

        <section aria-labelledby="how" className="flex flex-col gap-6">
          <h2 id="how" className="display m-0 text-[18px] tracking-[0.08em]">
            How a briefing is made
          </h2>
          <ol className="m-0 grid list-none gap-px p-0 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, n) => (
              <li key={step.title} className="flex flex-col gap-3 bg-raised p-6">
                <span className="display text-[13px] text-signal">{String(n + 1).padStart(2, "0")}</span>
                <span className="text-[19px] font-semibold">{step.title}</span>
                <span className="text-[15px] leading-[1.6] text-dek">{step.body}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-12 lg:grid-cols-2">
          <section aria-labelledby="standards" className="flex flex-col gap-4">
            <h2 id="standards" className="display m-0 text-[18px] tracking-[0.08em]">
              Our standards
            </h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {STANDARDS.map((s) => (
                <li key={s} className="grid grid-cols-[18px_1fr] gap-x-3 text-[17px] leading-[1.6]">
                  <span className="mt-2.5 h-2 w-2 bg-orange" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-12">
            <section aria-labelledby="who" className="flex flex-col gap-4">
              <h2 id="who" className="display m-0 text-[18px] tracking-[0.08em]">
                Who runs it
              </h2>
              <div className="flex items-center gap-4">
                {BRAND.author && (
                  // eslint-disable-next-line @next/next/no-img-element -- one small local photo
                  <img src={BRAND.author} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
                )}
                <p className="m-0 text-[17px] leading-[1.6]">
                  <strong>{AUTHOR.name}</strong> curates Context Window: he chooses the sources, sets the standards and
                  the instructions Claude writes to, and corrects what readers report.
                </p>
              </div>
            </section>

            <section aria-labelledby="corrections" className="flex flex-col gap-4">
              <h2 id="corrections" className="display m-0 text-[18px] tracking-[0.08em]">
                Corrections
              </h2>
              <p className="m-0 text-[17px] leading-[1.6]">
                Spotted an error? Email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="link">
                  {CONTACT_EMAIL}
                </a>{" "}
                with the page, the passage and a source. We fix mistakes as soon as we can.
              </p>
            </section>

            <section aria-labelledby="money" className="flex flex-col gap-4">
              <h2 id="money" className="display m-0 text-[18px] tracking-[0.08em]">
                How it&rsquo;s paid for
              </h2>
              <p className="m-0 text-[17px] leading-[1.6]">
                The newsletter is free. Readers get {FREE_BRIEFINGS} full briefings a month; members read every one for{" "}
                {PRICE_LABEL}. Newsletter sponsors, when there are any, are labelled.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
