"use client";

import Link from "next/link";
import { type ReactNode, useLayoutEffect } from "react";
import { refreshAccess } from "@/app/membership/actions";
import { SubscribeButton } from "@/components/membership";
import { FREE_BRIEFINGS, METER_EVENT, PRICE_LABEL } from "@/lib/meter";

/**
 * The metered part of a briefing. Its text is always in the page (search engines read it); when
 * the reader is over the meter, html[data-paywall=locked] fades it out after a few lines and shows
 * the card instead (see .paywalled in globals.css). The <head> script sets that attribute before
 * the first paint; this records the read and covers navigations within the site.
 */
export function Paywall({ storyId, children }: { storyId: string; children: ReactNode }) {
  useLayoutEffect(() => {
    const state = window.cwMeter?.(storyId, true);
    // The prompt may have hydrated first and read the meter before this read was counted.
    window.dispatchEvent(new Event(METER_EVENT));
    if (state?.recheck) {
      // Access is due a check with Stripe: stay open meanwhile, then apply the answer.
      refreshAccess()
        .then(() => window.cwMeter?.(storyId, true))
        .catch(() => {});
    }
    return () => document.documentElement.removeAttribute("data-paywall");
  }, [storyId]);

  return (
    <>
      <div className="paywalled flex flex-col gap-7">{children}</div>
      <PaywallCard storyId={storyId} />
    </>
  );
}

function PaywallCard({ storyId }: { storyId: string }) {
  return (
    <section aria-labelledby="paywall-title" className="paywall-card chamfer-md flex-col gap-4 bg-black px-8 py-8 text-bone">
      <p className="kicker m-0 text-orange">Context Window Membership</p>
      <h2 id="paywall-title" className="m-0 text-[clamp(22px,2.6vw,28px)] font-semibold leading-[1.2]">
        You&rsquo;ve read your {FREE_BRIEFINGS} free briefings this month.
      </h2>
      <p className="m-0 max-w-[56ch] text-[17px] leading-[1.6] text-[#d6d2c8]">
        Keep reading the full analysis of every story, with the Context Briefing in your inbox three times a week, for{" "}
        {PRICE_LABEL}. Cancel anytime.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
        <SubscribeButton returnTo={`/story/${storyId}`} />
        <Link href="/membership#sign-in" className="text-[15px] text-[#d6d2c8] underline underline-offset-4 hover:text-orange">
          Already a member? Sign in
        </Link>
      </div>
      <p className="m-0 text-[13px] text-concrete">Free briefings reset on the 1st of each month.</p>
    </section>
  );
}
