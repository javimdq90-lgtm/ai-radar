/** Times are shown in the reader's zone, not the server's. */
export const TIME_ZONE = "Europe/Madrid";

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "long", year: "numeric" });

export const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
