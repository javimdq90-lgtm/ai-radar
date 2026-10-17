import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { Resend } from "resend";
import Stripe from "stripe";
import { ACCESS_COOKIE } from "./meter";
import { SITE_URL } from "./site";

/**
 * Paid membership with no database: Stripe is the record of who pays. A reader becomes a member
 * by finishing Stripe Checkout or by signing in with an emailed link; either way we look up their
 * Stripe customer, check for a live subscription and set two cookies:
 * - MEMBER_COOKIE (HttpOnly, signed): which Stripe customer this browser belongs to.
 * - ACCESS_COOKIE (readable): when access must next be re-checked. The page's meter reads it.
 * Access is re-checked with Stripe every ACCESS_DAYS, so a cancelled subscription stops working
 * within that time of its paid period ending.
 */

const MEMBER_COOKIE = "cw_member";
const ACCESS_DAYS = 3;
const COOKIE_MAX_AGE = 400 * 86_400; // the most browsers keep a cookie
const LIVE = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);
const DEFAULT_FROM = "Context Window <hello@contextwindow.me>";

export function stripeConfig() {
  const { STRIPE_SECRET_KEY, STRIPE_PRICE_ID, MEMBER_SECRET } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) return null;
  return {
    stripe: new Stripe(STRIPE_SECRET_KEY),
    priceId: STRIPE_PRICE_ID,
    // No separate secret to manage: derive the signing key from the API key unless one is set.
    key: MEMBER_SECRET || `member:${STRIPE_SECRET_KEY}`,
  };
}

/** Memberships are on: the meter, paywall and prompt only appear once Stripe is set up. */
export const membershipOpen = () => !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);

/** For the sign-in email; only needs a key that can send. */
export function mailer() {
  const { RESEND_API_KEY, NEWSLETTER_FROM } = process.env;
  return RESEND_API_KEY ? { resend: new Resend(RESEND_API_KEY), from: NEWSLETTER_FROM || DEFAULT_FROM } : null;
}

/**
 * Where links in emails and Stripe redirects point. The request's own origin when it is the site
 * or, in development, localhost; anything else falls back to the site, so a forged Origin header
 * can't send a sign-in link somewhere else.
 */
export async function siteOrigin() {
  const origin = (await headers()).get("origin");
  if (origin === SITE_URL) return origin;
  if (origin && process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) return origin;
  return SITE_URL;
}

/** A same-site path to come back to, or the front page. */
export function safePath(path: unknown) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");

function readMemberCookie(value: string | undefined, key: string): string | null {
  const [customer, mac] = (value ?? "").split(".");
  if (!customer || !mac) return null;
  const expected = Buffer.from(sign(customer, key));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given) ? customer : null;
}

async function liveSubscription(stripe: Stripe, customer: string) {
  const { data } = await stripe.subscriptions.list({ customer, status: "all", limit: 20 });
  return data.find((s) => LIVE.has(s.status)) ?? null;
}

/** The Stripe customer with a live subscription for this email, if any. */
export async function memberByEmail(stripe: Stripe, email: string) {
  const { data } = await stripe.customers.list({ email, limit: 10 });
  for (const customer of data) {
    if (await liveSubscription(stripe, customer.id)) return customer.id;
  }
  return null;
}

/** Checks the customer with Stripe and sets or clears the cookies. True when they have access. */
export async function grantAccess(customer: string) {
  const config = stripeConfig();
  if (!config) return false;
  const jar = await cookies();
  if (!(await liveSubscription(config.stripe, customer))) {
    jar.delete(MEMBER_COOKIE);
    jar.delete(ACCESS_COOKIE);
    return false;
  }
  const secure = process.env.NODE_ENV === "production";
  const base = { path: "/", sameSite: "lax" as const, secure, maxAge: COOKIE_MAX_AGE };
  jar.set(MEMBER_COOKIE, `${customer}.${sign(customer, config.key)}`, { ...base, httpOnly: true });
  jar.set(ACCESS_COOKIE, String(Date.now() + ACCESS_DAYS * 86_400_000), base);
  return true;
}

/** The Stripe customer this browser is signed in as, from the signed cookie. */
export async function currentCustomer() {
  const config = stripeConfig();
  if (!config) return null;
  return readMemberCookie((await cookies()).get(MEMBER_COOKIE)?.value, config.key);
}

export async function clearAccess() {
  const jar = await cookies();
  jar.delete(MEMBER_COOKIE);
  jar.delete(ACCESS_COOKIE);
}
