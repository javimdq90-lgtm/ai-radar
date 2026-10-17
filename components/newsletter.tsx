"use client";

import { useActionState, useEffect, useRef } from "react";
import { subscribe, type SubscribeState } from "@/app/actions";

const initial: SubscribeState = { message: "" };

/** The dark palette, for the band when it sits on a bone page. */
const DARK =
  "[--dek:#c8cace] [--fg:var(--cw-bone)] [--muted:var(--cw-concrete)] [--raised:var(--cw-slate)] [--rule-strong:#3a3d42] [--signal:var(--cw-orange)] [--surface:var(--cw-black)]";

/**
 * "THE CONTEXT BRIEFING." sign-up, the #newsletter target of every SUBSCRIBE button.
 * `card`: a bone card with the large chamfer (front page, section pages).
 * `band`: a full-width black band (briefing pages, which are bone).
 */
export function NewsletterBox({ variant = "card" }: { variant?: "card" | "band" }) {
  const [state, action, pending] = useActionState(subscribe, initial);
  const band = variant === "band";

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
    <form action={action} className="relative flex flex-col gap-2">
      <label htmlFor={`newsletter-email-${variant}`} className="text-[13px] font-medium text-dek">
        Email address
      </label>
      <div className={`flex gap-2 ${band ? "flex-wrap" : "flex-col"}`}>
        <input
          id={`newsletter-email-${variant}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className={`min-h-12 px-3.5 text-fg placeholder:text-muted ${
            band ? "flex-[1_1_220px] border border-rule-strong bg-raised" : "border border-black bg-white"
          }`}
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
          className={`caps min-h-12 cursor-pointer border-0 px-6 disabled:opacity-70 ${
            band ? "bg-orange text-black" : "bg-black text-bone"
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

  if (band) {
    return (
      <section id="newsletter" aria-labelledby="newsletter-title" className={`scroll-mt-6 bg-surface text-fg ${DARK}`}>
        <div className="container-cw flex flex-wrap items-center gap-8 py-14">
          <div className="flex flex-[1_1_420px] flex-col gap-2.5">
            <p className="kicker m-0 text-signal">Three times a week</p>
            <h2 id="newsletter-title" className="display m-0 text-[clamp(26px,3.4vw,34px)] leading-[1.12]">
              The Context Briefing.
            </h2>
            <p className="m-0 text-dek">The most important AI news, analysis and ideas, briefed and sourced.</p>
          </div>
          <div className="flex flex-[1_1_420px] flex-col gap-3">
            {form}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="newsletter" aria-labelledby="newsletter-title" className="bone chamfer-lg flex scroll-mt-6 flex-col gap-4 p-8">
      <p className="kicker m-0 text-signal">Three times a week</p>
      <h2 id="newsletter-title" className="display m-0 text-[28px] leading-[1.12]">
        The Context Briefing.
      </h2>
      <p className="m-0 text-[16px] text-dek">The most important AI news, analysis and ideas. A wider context.</p>
      {form}
    </section>
  );
}
