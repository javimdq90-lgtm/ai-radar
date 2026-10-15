/** Times are shown in the reader's zone, not the server's. */
export const TIME_ZONE = "Europe/Madrid";

const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

/**
 * "14:05" for today, "Wed 14:05" within the week, "8 Oct" before that. `ref` is when the
 * page was generated: pages are prerendered, so "now" at render time is the build time.
 */
export function fmtWhen(iso: string, ref: string) {
  const d = new Date(iso);
  const r = new Date(ref);
  const time = d.toLocaleTimeString("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
  if (dayKey(d) === dayKey(r)) return time;
  if (r.getTime() - d.getTime() < 6 * 86_400_000) {
    return `${d.toLocaleDateString("en-GB", { timeZone: TIME_ZONE, weekday: "short" })} ${time}`;
  }
  return d.toLocaleDateString("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "short" });
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "long", year: "numeric" });

export const fmtLongDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });

export const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
