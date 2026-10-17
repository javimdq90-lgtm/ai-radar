"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearAccess,
  currentCustomer,
  grantAccess,
  mailer,
  memberByEmail,
  safePath,
  siteOrigin,
  stripeConfig,
} from "@/lib/membership";
import { rateLimiter } from "@/lib/rate-limit";
import { makeToken } from "@/lib/subscribe";

export type MembershipState = { ok?: boolean; message: string };

const CLOSED: MembershipState = { message: "Memberships open soon. Until then, briefings are free to read." };
const SIGN_IN_MINUTES = 30;
const rateLimited = rateLimiter(5, 10 * 60_000);

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Sends the reader to Stripe Checkout for the monthly plan; they come back to /membership/complete. */
export async function startCheckout(_prev: MembershipState, form: FormData): Promise<MembershipState> {
  const config = stripeConfig();
  if (!config) return CLOSED;
  if (rateLimited(await clientIp())) return { message: "Too many attempts from here. Please try again in a few minutes." };
  const origin = await siteOrigin();
  let url: string | null;
  try {
    const session = await config.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: config.priceId, quantity: 1 }],
      success_url: `${origin}/membership/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${safePath(form.get("returnTo"))}`,
      allow_promotion_codes: true,
    });
    url = session.url;
  } catch (err) {
    console.error("startCheckout:", err);
    url = null;
  }
  if (!url) return { message: "Checkout isn't available right now. Please try again shortly." };
  redirect(url);
}

/**
 * Emails a sign-in link when the address has a live subscription. The reply is the same either
 * way, so the form can't be used to find out who subscribes.
 */
export async function sendSignInLink(_prev: MembershipState, form: FormData): Promise<MembershipState> {
  const email = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { message: "That doesn't look like an email address." };
  const config = stripeConfig();
  const mail = mailer();
  if (!config || !mail) return CLOSED;
  if (rateLimited(await clientIp())) return { message: "Too many attempts from here. Please try again in a few minutes." };

  const sent: MembershipState = {
    ok: true,
    message: `If ${email.data} has a membership, a sign-in link is on its way. It works for ${SIGN_IN_MINUTES} minutes.`,
  };
  try {
    if (!(await memberByEmail(config.stripe, email.data))) return sent;
    const url = `${await siteOrigin()}/membership/verify?token=${encodeURIComponent(
      makeToken(email.data, config.key, Date.now(), SIGN_IN_MINUTES * 60_000),
    )}`;
    const { error } = await mail.resend.emails.send({
      from: mail.from,
      to: email.data,
      subject: "Sign in to Context Window",
      html: signInEmail(url),
      text: `Sign in to Context Window:\n\n${url}\n\nThe link works for ${SIGN_IN_MINUTES} minutes. If you didn't ask for it, ignore this email.`,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
  } catch (err) {
    console.error("sendSignInLink:", err);
    return { message: "Something went wrong sending the link. Please try again later." };
  }
  return sent;
}

/** Stripe's own page for changing the card, getting receipts or cancelling. */
export async function openBillingPortal() {
  const config = stripeConfig();
  const customer = await currentCustomer();
  if (!config || !customer) redirect("/membership");
  const session = await config.stripe.billingPortal.sessions.create({
    customer,
    return_url: `${await siteOrigin()}/membership`,
  });
  redirect(session.url);
}

export async function signOut() {
  await clearAccess();
  redirect("/membership");
}

/** Called by the page when the access cookie is due for a re-check. */
export async function refreshAccess(): Promise<{ member: boolean }> {
  const customer = await currentCustomer();
  if (!customer) {
    await clearAccess();
    return { member: false };
  }
  try {
    return { member: await grantAccess(customer) };
  } catch (err) {
    // Stripe unreachable: keep the reader in rather than lock out someone who pays.
    console.error("refreshAccess:", err);
    return { member: true };
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function signInEmail(url: string) {
  const sans = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sign in to Context Window</title></head>
<body style="margin:0;padding:0;background:#0A0A0A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A"><tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#16181C;border-top:4px solid #FF4D00">
    <tr><td style="padding:32px">
      <div style="font:700 12px/1 ${sans};letter-spacing:.14em;text-transform:uppercase;color:#FF4D00;margin:0 0 14px">Context Window</div>
      <div style="font:600 26px/1.2 ${sans};color:#F2F2F0;margin:0 0 14px">Sign in to your membership</div>
      <div style="font:16px/1.6 ${sans};color:#C8CACE;margin:0 0 24px">Use this button to read every briefing on this device.</div>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#FF4D00"><a href="${esc(url)}" style="display:inline-block;padding:14px 24px;font:700 14px/1 ${sans};letter-spacing:.08em;text-transform:uppercase;color:#0A0A0A;text-decoration:none">Sign in</a></td></tr></table>
      <div style="font:13px/1.6 ${sans};color:#8E9196;margin:24px 0 0">The link works for ${SIGN_IN_MINUTES} minutes. If you didn't ask for it, ignore this email.</div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
