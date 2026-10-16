"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { type ConfirmState, confirmSubscription } from "@/app/actions";

const initial: ConfirmState = { status: "idle" };

/**
 * The page the confirmation email links to. It asks for a click instead of confirming on load,
 * because mail scanners open links in emails and would otherwise subscribe people by themselves.
 */
export function ConfirmSubscription() {
  const token = useSearchParams().get("token") ?? "";
  const [state, action, pending] = useActionState(confirmSubscription, initial);

  if (state.status === "done") {
    return (
      <>
        <h1 className="m-0 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.1] tracking-[-0.02em]">You&rsquo;re in.</h1>
        <p className="m-0 text-[19px] leading-[1.6] text-dek">
          {state.email} will get the next issue of Context Window: three emails a week, every one with an unsubscribe
          link.
        </p>
        <Link href="/" className="btn-cta w-fit">
          Back to the front page
        </Link>
      </>
    );
  }

  if (!token || state.status === "invalid") {
    return (
      <>
        <h1 className="m-0 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.1] tracking-[-0.02em]">
          This link doesn&rsquo;t work
        </h1>
        <p className="m-0 text-[19px] leading-[1.6] text-dek">
          It may have expired (links last a week) or been cut short by your email app. Sign up again and we&rsquo;ll
          send a fresh one.
        </p>
        <Link href="/#newsletter" className="btn-cta w-fit">
          Sign up again
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="m-0 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.1] tracking-[-0.02em]">
        Confirm your subscription
      </h1>
      <p className="m-0 text-[19px] leading-[1.6] text-dek">
        One click and you&rsquo;ll get Context Window: the day&rsquo;s AI news, briefed and sourced, three emails a week.
      </p>
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <button type="submit" disabled={pending} className="btn-cta cursor-pointer border-0 disabled:opacity-70">
          {pending ? "Confirming…" : "Yes, subscribe me"}
        </button>
      </form>
      {state.status === "error" && (
        <p className="m-0 text-[15px] text-muted" role="status">
          Something went wrong on our side. Please try again in a few minutes.
        </p>
      )}
    </>
  );
}
