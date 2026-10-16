import { CATEGORY_HEX } from "./category";
import { CATEGORY_LABELS, type Category, type Issue, type IssueStory } from "./types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** "THU 15 OCT 2026" */
const fmtDateline = (iso: string) =>
  new Date(iso)
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    .replace(",", "")
    .toUpperCase();

/** Context Window tokens as literal values: mail clients don't support CSS variables. */
const C = {
  deep: "#08090A",
  bg: "#0F1012",
  surface: "#17191C",
  border: "#26282C",
  borderStrong: "#3A3D42",
  rowRule: "#1E2023",
  text: "#ECE9E2",
  body: "#DAD7CF",
  dek: "#C9C7C0",
  muted: "#A3A39C",
  faint: "#8E8E87",
  accent: "#F2C14E",
  onAccent: "#121212",
};
const SERIF = "'DM Serif Display',Georgia,'Times New Roman',serif";
const SANS = "Geist,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'Geist Mono',Menlo,Consolas,monospace";

export type EmailStoryInfo = { category: Category; briefed: boolean };
export type EmailOptions = {
  siteUrl?: string;
  /** Category and briefing status per storyId, for kickers and "Read the briefing" links. */
  stories?: Record<string, EmailStoryInfo>;
  /** Set when sending to subscribers: the footer then carries the unsubscribe link and postal address bulk email needs. */
  subscribers?: { unsubscribeUrl: string; postalAddress: string };
};

/** Resend fills this in per recipient when the email goes out as a broadcast. */
export const RESEND_UNSUBSCRIBE_URL = "{{{RESEND_UNSUBSCRIBE_URL}}}";

const siteHost = (siteUrl?: string) => {
  try {
    return siteUrl ? new URL(siteUrl).host : undefined;
  } catch {
    return undefined;
  }
};

const row = (content: string, style = "") => `<tr><td style="padding:28px 32px;border-bottom:1px solid ${C.border};${style}">${content}</td></tr>`;

/** "01 · TOP STORY" */
const label = (n: number, text: string) =>
  `<div style="font:500 12px/1.4 ${MONO};letter-spacing:.1em;text-transform:uppercase;color:${C.accent};margin:0 0 14px">${String(n).padStart(2, "0")} · ${esc(text)}</div>`;

const dot = (color: string) => `<span style="color:${color};font-size:10px;line-height:1">&#9679;</span>`;

function kicker(info?: EmailStoryInfo) {
  if (!info) return "";
  const color = CATEGORY_HEX[info.category];
  return `<div style="font:600 12px/1.4 ${SANS};letter-spacing:.08em;text-transform:uppercase;color:${color};margin:0 0 10px">${dot(color)}&nbsp;&nbsp;${esc(CATEGORY_LABELS[info.category])}</div>`;
}

/** The logo mark as nested tables, since SVG doesn't render in Gmail or Outlook. */
const MARK = (() => {
  const token = (fill: string) =>
    `<td style="padding:0 2px"><div style="width:8px;height:10px;border-radius:2px;background:${fill};font-size:0;line-height:0">&nbsp;</div></td>`;
  const windowed = `<td style="padding:0 2px"><table role="presentation" cellpadding="0" cellspacing="0" style="border:2px solid ${C.text};border-radius:4px"><tr><td style="padding:7px 1px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${token(C.accent)}${token(C.accent)}</tr></table></td></tr></table></td>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${token(C.borderStrong)}${token(C.borderStrong)}${windowed}${token(C.borderStrong)}</tr></table>`;
})();

function sources(issue: Issue, storyId: string) {
  const links = (issue.links[storyId] ?? []).slice(0, 3);
  if (!links.length) return "";
  return `<div style="font:13px/1.5 ${SANS};color:${C.muted};margin:12px 0 0">${links
    .map((l) => `<a href="${esc(l.url)}" style="color:${C.text};text-decoration:underline">${esc(l.source)}</a>`)
    .join(" · ")}</div>`;
}

function story(issue: Issue, s: IssueStory, opts: EmailOptions, top: boolean) {
  const info = opts.stories?.[s.storyId];
  const site = opts.siteUrl?.replace(/\/$/, "");
  const button =
    top && info?.briefed && site
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 0"><tr><td style="border-radius:999px;background:${C.accent}"><a href="${esc(`${site}/story/${s.storyId}`)}" style="display:inline-block;padding:12px 18px;font:600 15px/1 ${SANS};color:${C.onAccent};text-decoration:none">Read the briefing &rarr;</a></td></tr></table>`
      : "";
  return `<div style="margin:0 0 22px">
    ${kicker(info)}
    <div style="font:400 ${top ? 36 : 28}px/1.1 ${SERIF};color:${C.text};margin:0 0 10px">${esc(s.headline)}</div>
    <div style="font:${top ? 16 : 15}px/1.6 ${SANS};color:${C.dek}">${esc(s.body)}</div>
    ${sources(issue, s.storyId)}
    ${button}
  </div>`;
}

function footer(opts: EmailOptions, webUrl: string) {
  const link = (href: string, text: string) => `<a href="${esc(href)}" style="color:${C.faint}">${text}</a>`;
  const lines = ["Written by Claude from the stories Context Window collected."];
  const sub = opts.subscribers;
  if (sub) {
    const host = siteHost(opts.siteUrl);
    lines.push(`You’re getting this because you subscribed${host ? ` at ${esc(host)}` : ""}.`);
    // The unsubscribe placeholder must stay unescaped so Resend can replace it.
    const unsubscribe = `<a href="${sub.unsubscribeUrl}" style="color:${C.faint}">Unsubscribe</a>`;
    lines.push([unsubscribe, webUrl && link(webUrl, "Read on the web")].filter(Boolean).join(" · "));
    lines.push(esc(sub.postalAddress));
  } else if (webUrl) {
    lines.push(link(webUrl, "Read on the web"));
  }
  return lines.join("<br>");
}

/**
 * Table-based HTML with inline styles, the only thing every mail client renders the same.
 * Web fonts load where supported (Apple Mail); elsewhere the stacks fall back to Georgia and Helvetica.
 */
export function renderIssueHtml(issue: Issue, opts: EmailOptions = {}): string {
  const site = opts.siteUrl?.replace(/\/$/, "");
  const webUrl = site ? `${site}/issues/${issue.number}` : "";
  let n = 0;

  const sections = issue.sections
    .map((section, i) =>
      row(
        label(++n, section.heading) +
          section.stories.map((s, j) => story(issue, s, opts, i === 0 && j === 0)).join(""),
        "padding-bottom:6px",
      ),
    )
    .join("");

  const quickHits = issue.quickHits
    .map((q) => {
      const link = issue.links[q.storyId]?.[0];
      const info = opts.stories?.[q.storyId];
      const text = link
        ? `<a href="${esc(link.url)}" style="color:${C.text};text-decoration:none">${esc(q.text)}</a>`
        : esc(q.text);
      const source = link ? `<div style="font:400 13px/1.5 ${SANS};color:${C.muted};margin-top:2px">${esc(link.source)}</div>` : "";
      return `<tr>
        <td width="14" valign="top" style="padding:12px 10px 12px 0;border-bottom:1px solid ${C.rowRule}">${dot(info ? CATEGORY_HEX[info.category] : C.muted)}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${C.rowRule};font:500 16px/1.35 ${SANS};color:${C.text}">${text}${source}</td>
      </tr>`;
    })
    .join("");
  const inBrief = quickHits
    ? row(`${label(++n, "In brief")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${quickHits}</table>`)
    : "";

  const forward = webUrl
    ? `<tr><td align="center" style="padding:28px 32px">
        <div style="font:400 24px/1.3 ${SERIF};color:${C.text};margin:0 0 14px">Know someone who needs the context?</div>
        <a href="mailto:?subject=${encodeURIComponent(issue.subject)}&amp;body=${encodeURIComponent(webUrl)}" style="display:inline-block;padding:12px 18px;border:1px solid ${C.borderStrong};border-radius:999px;font:500 15px/1 ${SANS};color:${C.text};text-decoration:none">Forward this issue</a>
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@500&amp;display=swap" rel="stylesheet">
<title>${esc(issue.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.deep}">
<span style="display:none;max-height:0;overflow:hidden">${esc(issue.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.deep}"><tr><td align="center" style="padding:20px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
    <tr><td align="center" style="padding:0 0 12px;font:12px/1.5 ${SANS};color:${C.faint}">${esc(issue.preview)}${webUrl ? ` · <a href="${esc(webUrl)}" style="color:${C.faint}">View in browser</a>` : ""}</td></tr>
    <tr><td style="background:${C.bg};border:1px solid ${C.border};border-radius:8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:28px 32px 22px;border-bottom:1px solid ${C.border}">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td valign="middle" style="padding-right:12px">${MARK}</td>
            <td valign="middle" style="font:400 36px/1 ${SERIF};color:${C.text}">Context Window</td>
          </tr></table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px"><tr>
            <td style="font:12px/1.4 ${MONO};letter-spacing:.04em;color:${C.muted}">${fmtDateline(issue.date)}</td>
            <td align="right" style="font:12px/1.4 ${MONO};letter-spacing:.04em;color:${C.muted}">ISSUE #${issue.number}</td>
          </tr></table>
        </td></tr>
        ${row(`<div style="font:400 22px/1.4 ${SERIF};color:${C.body}">${esc(issue.intro)}</div>`)}
        ${sections}
        ${inBrief}
        ${forward}
      </table>
    </td></tr>
    <tr><td align="center" style="padding:20px 0 0;font:12px/1.7 ${SANS};color:${C.faint}">${footer(opts, webUrl)}</td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

export function renderIssueText(issue: Issue, opts: EmailOptions = {}): string {
  const lines = [`CONTEXT WINDOW #${issue.number} · ${fmtDate(issue.date)}`, "", issue.intro, ""];
  for (const section of issue.sections) {
    lines.push(section.heading.toUpperCase(), "");
    for (const s of section.stories) {
      lines.push(s.headline, s.body, ...(issue.links[s.storyId] ?? []).slice(0, 3).map((l) => `  ${l.source}: ${l.url}`), "");
    }
  }
  if (issue.quickHits.length) {
    lines.push("IN BRIEF", "");
    for (const q of issue.quickHits) lines.push(`- ${q.text} ${issue.links[q.storyId]?.[0]?.url ?? ""}`.trim());
  }
  if (opts.subscribers) {
    const host = siteHost(opts.siteUrl);
    lines.push(
      "",
      "--",
      `You're getting this because you subscribed${host ? ` at ${host}` : ""}.`,
      `Unsubscribe: ${opts.subscribers.unsubscribeUrl}`,
      opts.subscribers.postalAddress,
    );
  }
  return lines.join("\n");
}
