"use server";

import { Resend } from "resend";
import { z } from "zod";

export type SubscribeState = { ok?: boolean; message: string };

/**
 * Adds the address to the Resend segment the newsletter job broadcasts to. Sign-ups stay
 * closed until RESEND_API_KEY and RESEND_SEGMENT_ID are set on the site.
 */
export async function subscribe(_prev: SubscribeState, form: FormData): Promise<SubscribeState> {
  const email = z.email().safeParse(String(form.get("email") ?? "").trim());
  if (!email.success) return { message: "That doesn't look like an email address." };

  const { RESEND_API_KEY, RESEND_SEGMENT_ID } = process.env;
  if (!RESEND_API_KEY || !RESEND_SEGMENT_ID) {
    return { message: "Sign-ups aren't open yet. Past issues are in the archive." };
  }

  const { error } = await new Resend(RESEND_API_KEY).contacts.create({
    email: email.data,
    segments: [{ id: RESEND_SEGMENT_ID }],
  });
  if (error) {
    console.error("Resend contacts.create:", error.message);
    return { message: "Something went wrong. Please try again later." };
  }
  return { ok: true, message: "You're in. The next issue will reach your inbox." };
}
