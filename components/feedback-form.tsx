"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { type FeedbackState, sendFeedback } from "@/app/actions";
import { isRating, RATINGS } from "@/lib/issue-extras";

const initial: FeedbackState = { message: "" };

/**
 * The rating from the end of an issue (?issue=12&rating=great), confirmed with a button: mail
 * scanners open every link in an email, so a vote can't count just from following one.
 */
export function FeedbackForm() {
  const params = useSearchParams();
  const issue = Number(params.get("issue"));
  const chosen = params.get("rating");
  const [state, action, pending] = useActionState(sendFeedback, initial);

  if (!Number.isInteger(issue) || issue < 1) {
    return (
      <p className="m-0 text-[18px] text-dek">
        Rate an issue from the links at its end. <Link href="/issues" className="link">All issues</Link>
      </p>
    );
  }

  if (state.ok) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <p className="m-0 text-[22px] font-semibold">{state.message}</p>
        <Link href={`/issues/${issue}`} className="caps self-start text-[12px] text-signal hover:text-fg">
          Back to issue #{issue} →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="issue" value={issue} />
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-3 p-0 text-[22px] font-semibold">How was issue #{issue}?</legend>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => (
            <label
              key={r.key}
              className="inline-flex min-h-11 cursor-pointer items-center border border-rule-strong px-5 text-[15px] font-semibold has-[:checked]:border-signal has-[:checked]:text-signal"
            >
              <input type="radio" name="rating" value={r.key} defaultChecked={isRating(chosen) && chosen === r.key} className="sr-only" />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <label htmlFor="feedback-note" className="text-[14px] font-medium text-dek">
          Anything we should do differently? (optional)
        </label>
        <textarea
          id="feedback-note"
          name="note"
          rows={4}
          maxLength={2000}
          className="border border-rule-strong bg-raised p-3.5 text-[16px] text-fg"
        />
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="feedback-website">Leave this empty</label>
        <input id="feedback-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="caps min-h-12 cursor-pointer self-start border-0 bg-cta px-6 text-on-cta disabled:opacity-70"
      >
        {pending ? "Sending…" : "Send"}
      </button>
      {state.message && (
        <p className="m-0 text-[14px] text-muted" role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
