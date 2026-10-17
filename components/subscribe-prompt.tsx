"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
 * Opens a membership offer in the middle of the screen once a reader has opened FREE_BRIEFINGS
 * briefings this month, or has read deep into a page (on the front page: reached Latest),
 * whichever comes first. Never for members, never on a locked briefing (its own card is showing)
 * or the membership page, and at most once a day.
 */
export function SubscribePrompt() {
  const pathname = usePathname();
  const [shown, setShown] = useState<{ read: number; left: number } | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/membership")) return;
    const meter = () => {
      const m = window.cwMeter?.(null, false);
      return m && !m.member && !m.recheck ? m : null;
    };
    const locked = () => document.documentElement.dataset.paywall === "locked" && !!document.querySelector(".paywalled");
    const show = () => {
      const m = meter();
      // Checked now rather than on load, so it follows whatever was dismissed in the meantime.
      if (m && !locked() && !dismissedRecently()) setShown({ read: m.read, left: m.left });
    };

    let timer = 0;
    // Out of free briefings: offer it a few seconds into the page. Re-checked when a read is counted.
    const checkMeter = () => {
      if (!timer && (meter()?.read ?? 0) >= FREE_BRIEFINGS) timer = window.setTimeout(show, DELAY_MS);
    };
    // Otherwise: when the reader reaches the page's marked spot (the front page's Latest), or, on
    // pages without one, most of the way down a long page.
    const marker = document.querySelector("[data-prompt-at]");
    const observer = marker
      ? new IntersectionObserver((entries) => {
          if (entries.some((e) => e.isIntersecting || e.boundingClientRect.top < 0)) {
            observer?.disconnect();
            show();
          }
        })
      : null;
    if (marker) observer?.observe(marker);
    const onScroll = () => {
      const { scrollHeight } = document.documentElement;
      if (scrollHeight > 2 * window.innerHeight && window.scrollY + window.innerHeight >= DEPTH * scrollHeight) {
        window.removeEventListener("scroll", onScroll);
        show();
      }
    };
    checkMeter();
    window.addEventListener(METER_EVENT, checkMeter);
    if (!marker) window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer?.disconnect();
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

  return <PromptDialog heading={heading} returnTo={pathname} onClose={dismiss} />;
}

const PERKS = ["Every briefing, in full", "The Context Briefing, three times a week", "No ads. Cancel anytime"];

/**
 * A modal <dialog>: centred, everything behind it dimmed (::backdrop), focus kept inside, and
 * Escape or a click on the dimmed page closes it.
 */
function PromptDialog({ heading, returnTo, onClose }: { heading: string; returnTo: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      // Focus the dialog itself, so no button starts out looking selected; Tab reaches them.
      dialog.focus();
    }
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="prompt-title"
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the dialog element itself, not its content, is a click on the dimmed backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="cw-pop m-auto outline-none w-[min(560px,calc(100vw-32px))] max-w-none border-0 bg-transparent p-0 text-bone"
    >
      <div className="chamfer-lg relative flex flex-col gap-5 border-t-4 border-orange bg-[var(--cw-slate)] shadow-[inset_0_0_0_1px_#3a3835] px-7 pb-8 pt-9 sm:px-10 sm:pb-10">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent text-concrete hover:text-bone"
        >
          <svg width="16" height="16" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M1 1 L13 13 M13 1 L1 13" />
          </svg>
        </button>
        <p className="kicker m-0 text-orange">Context Window Membership</p>
        <h2 id="prompt-title" className="m-0 pr-8 text-[clamp(24px,3.2vw,30px)] font-semibold leading-[1.18] tracking-[-0.01em]">
          {heading}
        </h2>
        <p className="m-0 text-[17px] leading-[1.55] text-[#d6d2c8]">
          Members read the full analysis of every story, for <span className="font-semibold text-bone">{PRICE_LABEL}</span>.
        </p>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px]">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-3">
              <span className="h-2 w-2 shrink-0 bg-orange" aria-hidden />
              {perk}
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-col gap-4">
          <SubscribeButton returnTo={returnTo} />
          <Link
            href="/membership"
            onClick={onClose}
            className="self-center text-[14px] text-[#d6d2c8] underline underline-offset-4 hover:text-orange"
          >
            What&rsquo;s included
          </Link>
        </div>
      </div>
    </dialog>
  );
}
