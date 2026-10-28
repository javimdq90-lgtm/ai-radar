"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/** Query parameters that could identify someone; dropped from every URL before it is counted. */
const PRIVATE_PARAMS = ["token", "session_id", "email"];

function redact(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  for (const key of PRIVATE_PARAMS) url.searchParams.delete(key);
  return { ...event, url: url.toString() };
}

/**
 * Vercel Web Analytics: anonymous, cookieless visit counts (pages, referrers, countries,
 * devices). See the privacy page. Only sends data on Vercel deployments.
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={redact} />;
}
