"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SubscribeButton } from "@/components/membership";
import { FREE_BRIEFINGS, METER_EVENT, PRICE_LABEL } from "@/lib/meter";

const DISMISS_KEY = "cw-prompt";
const QUIET_MS = 24 * 3_600_000;
const DELAY_MS = 4_000;
/** How far down a long page counts as a deep read. */
const DEPTH = 0.7;

function dismissedRecently() {
  try {
    return Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < QUIET_MS;
  } catch {
    return false;
  }
}

/**
 * Slides up a membership offer once a reader has opened FREE_BRIEFINGS briefings this month, or
 * has read deep into a long page, whichever comes first. Never for members, never on a locked
 * briefing (its own card is showing) or the membership page, and at most once a day.
 */
export function SubscribePrompt() {
  const pathname = usePathname();
  const [shown, setShown] = useState<{ read: number; left: number } | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/membership") || dismissedRecently()) return;
    const meter = () => {
      const m = window.cwMeter?.(null, false);
      return m && !m.member && !m.recheck ? m : null;
    };
    const locked = () => document.documentElement.dataset.paywall === "locked" && !!document.querySelector(".paywalled");
    const show = () => {
      const m = meter();
      if (m && !locked()) setShown({ read: m.read, left: m.left });
    };

    let timer = 0;
    // Out of free briefings: offer it a few seconds into the page. Re-checked when a read is counted.
    const checkMeter = () => {
      if (!timer && (meter()?.read ?? 0) >= FREE_BRIEFINGS) timer = window.setTimeout(show, DELAY_MS);
    };
    // Otherwise: once the reader is most of the way down a long page.
    const onScroll = () => {
      const { scrollHeight } = document.documentElement;
      if (scrollHeight > 2 * window.innerHeight && window.scrollY + window.innerHeight >= DEPTH * scrollHeight) {
        window.removeEventListener("scroll", onScroll);
        show();
      }
    };
    checkMeter();
    window.addEventListener(METER_EVENT, checkMeter);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(METER_EVENT, checkMeter);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  if (!shown || pathname.startsWith("/membership")) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setShown(null);
  };
  const heading =
    shown.left === 0
      ? "That was your last free briefing this month."
      : shown.read > 0
        ? `${shown.left} free ${shown.left === 1 ? "briefing" : "briefings"} left this month.`
        : "Read every briefing, in full.";

  return (
    <aside
      aria-labelledby="prompt-title"
      className="cw-rise fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-orange bg-black text-bone shadow-[0_-12px_40px_rgba(0,0,0,0.45)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:border-t-0 sm:[clip-path:var(--cw-chamfer-md)]"
    >
      <div className="relative flex flex-col gap-3 p-6 sm:border-l-[3px] sm:border-orange sm:p-7">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center border-0 bg-transparent text-concrete hover:text-bone"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M1 1 L13 13 M13 1 L1 13" />
          </svg>
        </button>
        <p className="kicker m-0 text-orange">Context Window Membership</p>
        <h2 id="prompt-title" className="m-0 pr-8 text-[21px] font-semibold leading-[1.25]">
          {heading}
        </h2>
        <p className="m-0 text-[15px] leading-[1.55] text-[#c8cace]">
          Unlimited briefings and the Context Briefing three times a week, for {PRICE_LABEL}. Cancel anytime.
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
          <SubscribeButton returnTo={pathname} />
          <Link href="/membership" onClick={dismiss} className="text-[14px] text-[#c8cace] underline underline-offset-4 hover:text-orange">
            What&rsquo;s included
          </Link>
        </div>
      </div>
    </aside>
  );
}
