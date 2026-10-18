"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { Resend } from "resend";
import { isRating, RATINGS } from "@/lib/issue-extras";
import { rateLimiter } from "@/lib/rate-limit";
import { addSubscriber, readToken, sendConfirmation, subscribeConfig } from "@/lib/subscribe";

export type SubscribeState = { ok?: boolean; message: string };

/** Faster than this from page load to submit is a script, not a person. */
const MIN_FILL_MS = 2_000;
const rateLimited = rateLimiter(5, 10 * 60_000);

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

export type FeedbackState = { ok?: boolean; message: string };

const feedbackLimited = rateLimiter(10, 10 * 60_000);

/**
 * A reader's rating of an issue, from the links at its end. It is sent to FEEDBACK_TO by email
 * (there is no database); without that setting it only goes to the server log.
 */
export async function sendFeedback(_prev: FeedbackState, form: FormData): Promise<FeedbackState> {
  const issue = Number(form.get("issue"));
  const rating = String(form.get("rating") ?? "");
  const note = String(form.get("note") ?? "").trim().slice(0, 2000);
  if (!Number.isInteger(issue) || issue < 1 || !isRating(rating)) return { message: "Pick one of the three answers first." };
  if (form.get("website")) return { ok: true, message: "Thanks, that helps." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (feedbackLimited(ip)) return { message: "Too many answers from here. Please try again in a few minutes." };

  const label = RATINGS.find((r) => r.key === rating)!.label;
  const { RESEND_API_KEY, FEEDBACK_TO, NEWSLETTER_FROM } = process.env;
  if (RESEND_API_KEY && FEEDBACK_TO) {
    const { error } = await new Resend(RESEND_API_KEY).emails.send({
      from: NEWSLETTER_FROM || "Context Window <hello@contextwindow.me>",
      to: FEEDBACK_TO,
      subject: `Issue #${issue}: ${label}`,
      text: `A reader rated issue #${issue}: ${label}.${note ? `\n\n${note}` : ""}`,
    });
    if (error) console.error("sendFeedback:", error.message);
  } else {
    console.log("feedback", { issue, rating, note });
  }
  return { ok: true, message: "Thanks, that helps." };
}
