"use client";

import { useActionState, useEffect, useRef } from "react";
import { subscribe, type SubscribeState } from "@/app/actions";

const initial: SubscribeState = { message: "" };

/** The dark palette, for the band and side card when they sit on a bone page. */
const DARK =
  "[--dek:#d6d2c8] [--fg:var(--cw-bone)] [--muted:var(--cw-concrete)] [--raised:var(--cw-slate)] [--rule-strong:#45423d] [--signal:var(--cw-orange)] [--surface:var(--cw-black)]";

/** The promise, said the same way everywhere. */
export const NEWSLETTER_PROMISE = "The AI stories that matter, briefed and sourced. Monday, Wednesday and Friday. Free.";

type Variant = "card" | "band" | "tile" | "hero" | "side";

/**
 * "THE CONTEXT BRIEFING." sign-up. `card`, `band` and `tile` carry id="newsletter", the target of
 * every SUBSCRIBE link, so a page shows only one of them.
 * `card`: a bone card with the large chamfer (section pages).
 * `band`: a full-width dark band (briefing and issue pages, which are bone).
 * `tile`: two story cards wide, one tall, for the front page's More stories grid.
 * `hero`: just the promise and the form, over the front-page photo.
 * `side`: a compact dark card for the rail beside a briefing.
 */
export function NewsletterBox({ variant = "card" }: { variant?: Variant }) {
  const [state, action, pending] = useActionState(subscribe, initial);
  // Dark surroundings get a dark field and an orange button; bone ones a white field and a black button.
  const dark = variant === "band" || variant === "hero" || variant === "side";
  const compact = variant === "tile" || variant === "hero" || variant === "side";
  const inline = variant !== "card" && variant !== "side";

  // React clears form fields after each submission, so the load time is written back every time `state` changes.
  const startedAt = useRef<HTMLInputElement>(null);
  const loadedAt = useRef(0);
  useEffect(() => {
    if (!loadedAt.current) loadedAt.current = Date.now();
    if (startedAt.current) startedAt.current.value = String(loadedAt.current);
  }, [state]);

  const form = state.ok ? (
    <p className="m-0 text-[16px] font-medium" role="status">
      {state.message}
    </p>
  ) : (
    <form action={action} className="relative flex flex-col gap-2" aria-label="Subscribe to The Context Briefing">
      <label htmlFor={`newsletter-email-${variant}`} className={compact ? "sr-only" : "text-[13px] font-medium text-dek"}>
        Email address
      </label>
      <div className={`flex gap-2 ${inline ? "flex-wrap" : "flex-col"}`}>
        <input
          id={`newsletter-email-${variant}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className={`${compact ? "min-h-11" : "min-h-12"} px-3.5 text-fg placeholder:text-muted ${
            dark ? "border border-rule-strong bg-raised" : "border border-black bg-white"
          } ${inline ? "flex-[1_1_200px]" : ""}`}
        />
        {/* Spam traps: a field people never see, and the time the form loaded. */}
        <input ref={startedAt} type="hidden" name="t" defaultValue="" />
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={`newsletter-website-${variant}`}>Leave this empty</label>
          <input id={`newsletter-website-${variant}`} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className={`caps ${compact ? "min-h-11" : "min-h-12"} cursor-pointer border-0 px-6 disabled:opacity-70 ${
            dark ? "bg-orange text-black hover:bg-bone" : "bg-black text-bone"
          }`}
        >
          {pending ? "Subscribing…" : "Subscribe →"}
        </button>
      </div>
      {state.message && (
        <p className="m-0 text-[13px] text-muted" role="status">
          {state.message}
        </p>
      )}
    </form>
  );

  const titleId = `newsletter-title-${variant}`;

  if (variant === "hero") {
    return (
      <div className={`flex max-w-[480px] flex-col gap-3 ${DARK}`}>
        <p className="m-0 text-[15px] leading-[1.5] text-dek">{NEWSLETTER_PROMISE}</p>
        {form}
      </div>
    );
  }

  if (variant === "side") {
    return (
      <section aria-labelledby={titleId} className={`chamfer-md flex flex-col gap-3 bg-surface p-6 text-fg ${DARK}`}>
        <p className="kicker m-0 text-signal">Three times a week</p>
        <h2 id={titleId} className="display m-0 text-[20px] leading-[1.15]">
          The Context Briefing.
        </h2>
        <p className="m-0 text-[14px] leading-[1.5] text-dek">{NEWSLETTER_PROMISE}</p>
        {form}
      </section>
    );
  }

  if (variant === "band") {
    return (
      <section id="newsletter" aria-labelledby={titleId} className={`scroll-mt-6 bg-surface text-fg ${DARK}`}>
        <div className="container-cw flex flex-wrap items-center gap-8 py-14">
          <div className="flex flex-[1_1_420px] flex-col gap-2.5">
            <p className="kicker m-0 text-signal">Three times a week</p>
            <h2 id={titleId} className="display m-0 text-[clamp(26px,3.4vw,34px)] leading-[1.12]">
              The Context Briefing.
            </h2>
            <p className="m-0 text-dek">The most important AI news, analysis and ideas, briefed and sourced.</p>
          </div>
          <div className="flex flex-[1_1_420px] flex-col gap-3">{form}</div>
        </div>
      </section>
    );
  }

  if (variant === "tile") {
    return (
      <section
        id="newsletter"
        aria-labelledby={titleId}
        className="bone chamfer-lg flex h-full scroll-mt-6 flex-col justify-center gap-4 p-7 sm:col-span-2 lg:p-9"
      >
        <p className="kicker m-0 text-signal">Three times a week</p>
        <h2 id={titleId} className="display m-0 text-[clamp(22px,2.4vw,30px)] leading-[1.12]">
          The Context Briefing.
        </h2>
        <p className="m-0 max-w-[44ch] text-[16px] leading-[1.5] text-dek">
          The most important AI news, analysis and ideas. A wider context, in your inbox.
        </p>
        {form}
      </section>
    );
  }

  return (
    <section id="newsletter" aria-labelledby={titleId} className="bone chamfer-lg flex scroll-mt-6 flex-col gap-4 p-8">
      <p className="kicker m-0 text-signal">Three times a week</p>
      <h2 id={titleId} className="display m-0 text-[28px] leading-[1.12]">
        The Context Briefing.
      </h2>
      <p className="m-0 text-[16px] text-dek">The most important AI news, analysis and ideas. A wider context.</p>
      {form}
    </section>
  );
}
