"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/actions";

const initial: SubscribeState = { message: "" };

type LatestIssue = { number: number; subject: string } | null | undefined;

/**
 * "Load today's context" sign-up. `box` is the sidebar card on inner pages; `band` is the
 * full-width yellow block on the front page. Either one is the #newsletter target of "Get the email".
 */
export function NewsletterBox({ latestIssue, variant = "box" }: { latestIssue?: LatestIssue; variant?: "box" | "band" }) {
  const [state, action, pending] = useActionState(subscribe, initial);
  const band = variant === "band";

  const form = state.ok ? (
    <p className="m-0 text-[15px]" role="status">
      {state.message}
    </p>
  ) : (
    <form action={action} className={`flex flex-col gap-3.5 ${band ? "sm:flex-row sm:flex-wrap sm:items-end" : ""}`}>
      <label htmlFor={`newsletter-email-${variant}`} className={band ? "sr-only" : "text-[13px] text-muted"}>
        Email address
      </label>
      <input
        id={`newsletter-email-${variant}`}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@company.com"
        className={
          band
            ? "min-h-12 flex-1 rounded-cw border-0 bg-[#fff8e6] px-4 text-[16px] text-on-accent placeholder:text-[#6b5a2a] sm:min-w-[240px]"
            : "min-h-11 rounded-cw border border-line-strong bg-bg px-3.5 text-text placeholder:text-faint"
        }
      />
      <button
        type="submit"
        disabled={pending}
        className={
          band
            ? "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-cw border-0 bg-on-accent px-6 font-semibold text-accent disabled:opacity-70"
            : "btn-accent cursor-pointer rounded-cw border-0 disabled:opacity-70"
        }
      >
        {pending ? "Subscribing…" : "Subscribe"}
      </button>
      {state.message && (
        <p className={`m-0 text-[13px] ${band ? "basis-full" : "text-muted"}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );

  const issueLink = latestIssue && (
    <Link href={`/issues/${latestIssue.number}`} className={`text-[13px] ${band ? "hover:text-on-accent" : "text-muted"}`}>
      Latest issue, #{latestIssue.number}: <span className="link">{latestIssue.subject}</span>
    </Link>
  );

  if (band) {
    return (
      <section
        id="newsletter"
        aria-labelledby="newsletter-title"
        className="grid scroll-mt-24 items-center gap-x-12 gap-y-6 rounded-cw-lg bg-accent p-[clamp(24px,5vw,56px)] text-on-accent md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] [&_:focus-visible]:outline-on-accent"
      >
        <div className="flex flex-col gap-3">
          <p className="m-0 font-mono text-[12px] font-medium uppercase tracking-[0.1em]">The newsletter</p>
          <h2 id="newsletter-title" className="m-0 font-display text-[clamp(36px,5vw,60px)] font-normal leading-[1]">
            Load today&rsquo;s context
          </h2>
          <p className="m-0 text-[17px]">AI news, briefed and sourced. Three emails a week.</p>
        </div>
        <div className="flex flex-col gap-3">
          {form}
          {issueLink}
        </div>
      </section>
    );
  }

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-title"
      className="flex scroll-mt-24 flex-col gap-3.5 rounded-cw-lg border border-line bg-surface p-6"
    >
      <h2 id="newsletter-title" className="m-0 font-display text-[30px] font-normal leading-[1.05]">
        Load today&rsquo;s context
      </h2>
      <p className="m-0 text-[15px] text-dek">AI news, briefed and sourced. Three emails a week.</p>
      {form}
      {issueLink}
    </section>
  );
}
