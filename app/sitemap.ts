import type { MetadataRoute } from "next";
import { loadGuides } from "@/lib/guides";
import { getIssues, getStories } from "@/lib/site-data";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES } from "@/lib/types";

/** The front page, sections, briefing pages, guides and newsletter issues. Link-outs live on other sites. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stories, issues] = await Promise.all([getStories(), getIssues()]);
  const newest = stories.reduce((max, s) => (s.firstSeen > max ? s.firstSeen : max), "");
  return [
    { url: SITE_URL, lastModified: newest || undefined, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/briefings`, lastModified: newest || undefined, changeFrequency: "hourly", priority: 0.8 },
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/topic/${c}`, changeFrequency: "hourly" as const, priority: 0.6 })),
    ...stories
      .filter((s) => s.brief)
      .map((s) => ({ url: `${SITE_URL}/story/${s.id}`, lastModified: s.brief!.writtenAt, priority: 0.8 })),
    { url: `${SITE_URL}/issues`, lastModified: issues[0]?.date, priority: 0.5 },
    { url: `${SITE_URL}/guides`, priority: 0.7 },
    ...loadGuides().map((g) => ({ url: `${SITE_URL}/guides/${g.slug}`, lastModified: g.updated, priority: 0.7 })),
    { url: `${SITE_URL}/about`, priority: 0.3 },
    { url: `${SITE_URL}/privacy`, priority: 0.2 },
    ...issues.map((i) => ({ url: `${SITE_URL}/issues/${i.number}`, lastModified: i.date, priority: 0.5 })),
  ];
}
