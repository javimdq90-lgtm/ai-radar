"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useSyncExternalStore } from "react";
import {
  type MembershipState,
  openBillingPortal,
  sendSignInLink,
  signOut,
  startCheckout,
} from "@/app/membership/actions";
import { ACCESS_COOKIE, PRICE_LABEL } from "@/lib/meter";

const initial: MembershipState = { message: "" };

/** "member", "recheck" (access cookie due for a Stripe check), "none", or "unknown" while rendering on the server. */
export type Access = "member" | "recheck" | "none" | "unknown";

function readAccess(): Access {
  const m = document.cookie.match(new RegExp(`(?:^|; )${ACCESS_COOKIE}=(\\d+)`));
  if (!m) return "none";
  return Number(m[1]) > Date.now() ? "member" : "recheck";
}

const noSubscribe = () => () => {};

/** This browser's membership, from the readable access cookie. "unknown" on the server and during hydration. */
export function useAccess(): Access {
  return useSyncExternalStore(noSubscribe, readAccess, () => "unknown");
}

/** Goes straight to Stripe Checkout. `returnTo` is where a cancelled checkout comes back to. */
export function SubscribeButton({
  returnTo,
  label = `Subscribe · ${PRICE_LABEL}`,
  className = "bg-orange text-black hover:bg-bone",
}: {
  returnTo: string;
  label?: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState(startCheckout, initial);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        disabled={pending}
        className={`caps inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 border-0 px-6 [clip-path:var(--cw-chamfer-sm)] disabled:opacity-70 ${className}`}
      >
        {pending ? "Opening checkout…" : `${label} →`}
      </button>
      {state.message && (
        <p className="m-0 text-[13px] text-muted" role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(sendSignInLink, initial);
  if (state.ok) {
    return (
      <p className="m-0 text-[15px]" role="status">
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="member-email" className="text-[13px] font-medium text-dek">
        Email address
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="member-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className="min-h-12 flex-[1_1_220px] border border-rule-strong bg-transparent px-3.5 text-fg placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={pending}
          className="caps min-h-12 cursor-pointer border border-fg bg-transparent px-6 text-fg hover:border-orange hover:text-orange disabled:opacity-70"
        >
          {pending ? "Sending…" : "Email me a link"}
        </button>
      </div>
      {state.message && (
        <p className="m-0 text-[13px] text-muted" role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}

const STATUS: Record<string, string> = {
  welcome: "Welcome in. Every briefing is open on this device, and the Context Briefing will start arriving in your inbox.",
  "signed-in": "You're signed in. Every briefing is open on this device.",
  expired: "That sign-in link has expired or isn't valid. Ask for a new one below.",
  "no-membership": "We couldn't find a live membership for that email. If you think that's wrong, try the address you paid with.",
  incomplete: "Checkout wasn't completed, so you haven't been charged.",
};

/** The message for ?status=… after checkout or a sign-in link. Needs a Suspense boundary. */
export function MembershipNotice() {
  const message = STATUS[useSearchParams().get("status") ?? ""];
  if (!message) return null;
  return (
    <p className="m-0 border-l-4 border-orange bg-raised px-5 py-4 text-[16px]" role="status">
      {message}
    </p>
  );
}

/** Join or sign in; for members, manage the subscription or sign out. */
export function MembershipPanel() {
  const access = useAccess();
  if (access === "unknown") return <div className="min-h-[220px]" aria-hidden />;

  if (access === "member") {
    return (
      <div className="flex flex-col gap-5">
        <p className="m-0 text-[20px] font-semibold">You&rsquo;re a member. Thank you.</p>
        <p className="m-0 text-dek">Every briefing is open on this device. Change your card, get receipts or cancel on Stripe&rsquo;s billing page.</p>
        <div className="flex flex-wrap gap-3">
          <form action={openBillingPortal}>
            <button type="submit" className="caps min-h-12 cursor-pointer border-0 bg-orange px-6 text-black [clip-path:var(--cw-chamfer-sm)] hover:bg-bone">
              Manage membership →
            </button>
          </form>
          <form action={signOut}>
            <button type="submit" className="caps min-h-12 cursor-pointer border border-rule-strong bg-transparent px-6 text-fg hover:border-fg">
              Sign out
            </button>
          </form>
        </div>
        <Link href="/briefings" className="link self-start text-[15px]">
          Read the latest briefings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <SubscribeButton returnTo="/membership" />
        <p className="m-0 text-[13px] text-muted">Secure checkout by Stripe. Cancel anytime.</p>
      </div>
      <div id="sign-in" className="flex scroll-mt-6 flex-col gap-3 border-t border-rule pt-8">
        <h2 className="display m-0 text-[14px] tracking-[0.1em]">Already a member?</h2>
        <p className="m-0 text-dek">Sign in on this device with the email you paid with. We&rsquo;ll send you a link.</p>
        <SignInForm />
      </div>
    </div>
  );
}
