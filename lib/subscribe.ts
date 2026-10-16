import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { SITE_URL } from "./site";

/**
 * Double opt-in. Signing up only sends a confirmation link; the address joins the Resend
 * segment when that link is used. Links are signed, so nobody can confirm an address they
 * can't read mail for, and they expire after a week.
 */

const LINK_DAYS = 7;
const DEFAULT_FROM = "Context Window <hello@contextwindow.me>";

export function subscribeConfig() {
  const { RESEND_API_KEY, RESEND_SEGMENT_ID, NEWSLETTER_FROM, SUBSCRIBE_SECRET } = process.env;
  if (!RESEND_API_KEY || !RESEND_SEGMENT_ID) return null;
  return {
    resend: new Resend(RESEND_API_KEY),
    segmentId: RESEND_SEGMENT_ID,
    from: NEWSLETTER_FROM || DEFAULT_FROM,
    // No separate secret to manage: derive the signing key from the API key unless one is set.
    key: SUBSCRIBE_SECRET || `subscribe-confirm:${RESEND_API_KEY}`,
  };
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");

export function makeToken(email: string, key: string, now = Date.now()) {
  const payload = b64(`${email}|${now + LINK_DAYS * 86_400_000}`);
  return `${payload}.${sign(payload, key)}`;
}

/** The email in a valid, unexpired token, or null. */
export function readToken(token: string, key: string, now = Date.now()): string | null {
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const [email, expires] = Buffer.from(payload, "base64url").toString().split("|");
  return email && Number(expires) > now ? email : null;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendConfirmation(email: string) {
  const config = subscribeConfig();
  if (!config) throw new Error("Sign-ups are not configured");
  const url = `${SITE_URL}/subscribe/confirm?token=${encodeURIComponent(makeToken(email, config.key))}`;
  const sans = "Geist,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const serif = "'DM Serif Display',Georgia,'Times New Roman',serif";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Confirm your subscription</title></head>
<body style="margin:0;padding:0;background:#08090A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08090A"><tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0F1012;border:1px solid #26282C;border-radius:8px">
    <tr><td style="padding:32px">
      <div style="font:400 30px/1.1 ${serif};color:#ECE9E2;margin:0 0 16px">Confirm your subscription</div>
      <div style="font:16px/1.6 ${sans};color:#C9C7C0;margin:0 0 24px">Someone, hopefully you, asked to get Context Window at ${esc(email)}: the day's AI news, briefed and sourced, three emails a week.</div>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#F2C14E"><a href="${esc(url)}" style="display:inline-block;padding:13px 22px;font:600 15px/1 ${sans};color:#121212;text-decoration:none">Yes, subscribe me</a></td></tr></table>
      <div style="font:13px/1.6 ${sans};color:#8E8E87;margin:24px 0 0">The link works for ${LINK_DAYS} days. If you didn't sign up, ignore this email and you won't hear from us again.</div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
  const text = `Confirm your Context Window subscription for ${email}:\n\n${url}\n\nThe link works for ${LINK_DAYS} days. If you didn't sign up, ignore this email and you won't hear from us again.`;

  const { error } = await config.resend.emails.send({
    from: config.from,
    to: email,
    subject: "Confirm your Context Window subscription",
    html,
    text,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/** Adds the address to the segment; someone signing up again is re-subscribed and re-added. */
export async function addSubscriber(email: string) {
  const config = subscribeConfig();
  if (!config) throw new Error("Sign-ups are not configured");
  const { resend, segmentId } = config;
  const created = await resend.contacts.create({ email, segments: [{ id: segmentId }] });
  if (!created.error) return;
  // Most likely the contact already exists (an earlier sign-up, or someone who unsubscribed).
  const updated = await resend.contacts.update({ email, unsubscribed: false });
  if (updated.error) throw new Error(`Resend: ${created.error.message}; ${updated.error.message}`);
  const added = await resend.contacts.segments.add({ email, segmentId });
  if (added.error && !/already/i.test(added.error.message)) throw new Error(`Resend: ${added.error.message}`);
}
