/** The public address. Canonical URLs, the sitemap and share images are built from it. */
export const SITE_URL = "https://contextwindow.me";

/** Shared Open Graph fields. A page that sets its own openGraph replaces the layout's, so it spreads these in. */
export const OG_BASE = { siteName: "Context Window", locale: "en_GB" } as const;

/**
 * Who runs Context Window. Briefings are written by Claude and credited "Curated by" him, not
 * "By" or "Edited by": he chooses the sources and standards but doesn't review each one before it
 * publishes (see app/about).
 */
export const AUTHOR = { name: "Javier Díaz", initials: "JD" } as const;

/** Corrections, editorial questions and privacy requests. */
export const CONTACT_EMAIL = "hello@contextwindow.me";
