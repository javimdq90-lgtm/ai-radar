"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { addSubscriber, readToken, sendConfirmation, subscribeConfig } from "@/lib/subscribe";

export type SubscribeState = { ok?: boolean; message: string };

/** Faster than this from page load to submit is a script, not a person. */
const MIN_FILL_MS = 2_000;
const LIMIT = 5;
const WINDOW_MS = 10 * 60_000;
/**
 * Sign-up attempts per IP. Best effort: it lives in one server instance's memory, so it slows
 * a burst from one address rather than guaranteeing a global limit.
 */
const attempts = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 10_000) attempts.clear();
  return recent.length > LIMIT;
}

const SENT = (email: string): SubscribeState => ({
  ok: true,
  message: `Almost there: we sent a confirmation link to ${email}. Click it to start getting the newsletter.`,
});

/**
 * Step one of the double opt-in: validates the address and emails a signed confirmation link.
 * Nothing is stored until that link is used (see confirmSubscription). Sign-ups stay closed
 * until RESEND_API_KEY and RESEND_SEGMENT_ID are set on the site.
 */
export async function subscribe(_prev: SubscribeState, form: FormData): Promise<SubscribeState> {
  const email = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { message: "That doesn't look like an email address." };

  // Bots fill the hidden field or submit instantly. Look successful so they don't adapt.
  const startedAt = Number(form.get("t"));
  if (form.get("website") || !startedAt || Date.now() - startedAt < MIN_FILL_MS) return SENT(email.data);

  if (!subscribeConfig()) return { message: "Sign-ups aren't open yet. Past issues are in the archive." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return { message: "Too many sign-ups from here. Please try again in a few minutes." };

  try {
    await sendConfirmation(email.data);
  } catch (err) {
    console.error("subscribe:", err);
    return { message: "Something went wrong sending the confirmation email. Please try again later." };
  }
  return SENT(email.data);
}

export type ConfirmState = { status: "idle" | "done" | "invalid" | "error"; email?: string };

/** Step two: the link from the confirmation email. Adds the address to the newsletter's segment. */
export async function confirmSubscription(_prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const config = subscribeConfig();
  if (!config) return { status: "error" };
  const email = readToken(String(form.get("token") ?? ""), config.key);
  if (!email) return { status: "invalid" };
  try {
    await addSubscriber(email);
  } catch (err) {
    console.error("confirmSubscription:", err);
    return { status: "error" };
  }
  return { status: "done", email };
}
