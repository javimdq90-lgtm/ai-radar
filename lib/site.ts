/** The public address. Canonical URLs, the sitemap and share images are built from it. */
export const SITE_URL = "https://contextwindow.me";

/** Shared Open Graph fields. A page that sets its own openGraph replaces the layout's, so it spreads these in. */
export const OG_BASE = { siteName: "Context Window", locale: "en_GB" } as const;

/** Bylined on briefings: the editor. Each briefing still notes that Claude wrote it from the sources. */
export const AUTHOR = { name: "Javier Díaz", initials: "JD" } as const;
