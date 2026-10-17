import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer, SiteHeader } from "@/components/brand";
import { MembershipNotice, MembershipPanel } from "@/components/membership";
import { FREE_BRIEFINGS, PRICE_LABEL } from "@/lib/meter";

export const metadata: Metadata = {
  title: "Membership",
  description: `Every Context Window briefing in full, and the Context Briefing three times a week, for ${PRICE_LABEL}.`,
  alternates: { canonical: "/membership" },
};

const BENEFITS = [
  {
    title: "Every briefing, in full",
    body: "What happened, why it matters and what to watch, written from all the coverage of each story. Free readers get three a month.",
  },
  {
    title: "The Context Briefing",
    body: "The stories that mattered since the last issue, in your inbox Monday, Wednesday and Friday morning.",
  },
  {
    title: "Independent, no ads",
    body: "No advertising and no tracking. Members pay for the work, so it answers to readers.",
  },
];

const FAQ = [
  {
    q: "Can I cancel?",
    a: "Anytime, from Manage membership on this page. You keep access until the end of the month you've paid for.",
  },
  {
    q: "How do I read on another device?",
    a: "Sign in on that device with the email you paid with. We send a link; there's no password.",
  },
  {
    q: "Who handles payment?",
    a: "Stripe. Your card details go to Stripe and never reach us.",
  },
  {
    q: "What stays free?",
    a: `Headlines, the front page, search and ${FREE_BRIEFINGS} full briefings a month. The opening of every briefing is always free.`,
  },
];

export default function MembershipPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-cw flex flex-col gap-16 pb-24 pt-14">
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-6">
            <p className="kicker m-0 text-signal">Context Window Membership</p>
            <h1 className="display m-0 text-[clamp(32px,5vw,58px)] leading-[1.06]">
              Every briefing.
              <br />
              <span className="text-orange">{PRICE_LABEL}.</span>
            </h1>
            <p className="m-0 max-w-[52ch] text-[clamp(17px,1.6vw,20px)] leading-[1.55] text-dek">
              Context Window is free to browse. Members read every briefing in full: the analysis behind each story,
              written from all of its coverage.
            </p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-6 p-0">
              {BENEFITS.map((b) => (
                <li key={b.title} className="grid grid-cols-[18px_1fr] gap-x-4 gap-y-1">
                  <span className="mt-2 h-2.5 w-2.5 bg-orange" aria-hidden />
                  <span className="text-[18px] font-semibold">{b.title}</span>
                  <span className="col-start-2 text-[16px] leading-[1.6] text-dek">{b.body}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="chamfer-lg flex flex-col gap-6 self-start bg-raised p-8 lg:sticky lg:top-6">
            <Suspense>
              <MembershipNotice />
            </Suspense>
            <MembershipPanel />
          </div>
        </div>

        <section aria-labelledby="faq-title" className="flex max-w-[820px] flex-col gap-2">
          <h2 id="faq-title" className="display m-0 mb-3 text-[18px] tracking-[0.08em]">
            Questions
          </h2>
          {FAQ.map((f) => (
            <div key={f.q} className="flex flex-col gap-1.5 border-t border-rule py-5">
              <h3 className="m-0 text-[17px] font-semibold">{f.q}</h3>
              <p className="m-0 text-[16px] leading-[1.6] text-dek">{f.a}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
