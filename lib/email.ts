import { CATEGORY_HEX_ON_BONE } from "./category";
import { feedbackPath, nextIssueDay, RATINGS, SIGN_OFF } from "./issue-extras";
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

/** Context Window tokens (app/globals.css, bone surface) as literal values: mail clients don't support CSS variables. */
const C = {
  orange: "#D97757",
  orangeDeep: "#A8522F", // small orange text on bone and white; plain orange is only 3:1
  black: "#1C1B19",
  bone: "#F4F1EA",
  card: "#FFFDF8",
  rule: "#E1DCD1",
  text: "#1C1B19",
  dek: "#3D3A35",
  muted: "#6B675F",
  concrete: "#A8A398",
};
/** Michroma is the display face, caps only; wide sans fallbacks where web fonts don't load. */
const DISPLAY = "Michroma,'Arial Black','Helvetica Neue',Arial,sans-serif";
const SANS = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

export type EmailStoryInfo = {
  category: Category;
  briefed: boolean;
  /** Absolute URL of a JPEG, PNG or GIF to show above the story (see emailImageFor). */
  image?: string;
};
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

const row = (content: string, style = "") =>
  `<tr><td style="padding:32px 36px;border-bottom:1px solid ${C.rule};${style}">${content}</td></tr>`;

/** Caps section kicker in the display face under a short orange rule: "01 / TOP STORY". */
const label = (n: number, text: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr><td style="border-top:3px solid ${C.orange};padding:12px 0 0;font:400 12px/1.4 ${DISPLAY};letter-spacing:.14em;text-transform:uppercase;color:${C.text}"><span style="color:${C.orangeDeep}">${String(n).padStart(2, "0")}</span>&nbsp;&nbsp;/&nbsp;&nbsp;${esc(text)}</td></tr></table>`;

/** A small square in the topic colour, as on the site's kickers. */
const square = (color: string) => `<span style="color:${color};font-size:9px;line-height:1">&#9632;</span>`;

/** "BRIEFING  ■ MODELS", or just the topic for plain news, as on the site. */
function kicker(info?: EmailStoryInfo) {
  if (!info) return "";
  const color = CATEGORY_HEX_ON_BONE[info.category];
  const briefing = info.briefed ? `<span style="color:${C.orangeDeep}">Briefing</span>&nbsp;&nbsp;&nbsp;` : "";
  return `<div style="font:700 11px/1.4 ${SANS};letter-spacing:.16em;text-transform:uppercase;color:${color};margin:0 0 12px">${briefing}${square(color)}&nbsp;${esc(CATEGORY_LABELS[info.category])}</div>`;
}

function sources(issue: Issue, storyId: string) {
  const links = (issue.links[storyId] ?? []).slice(0, 3);
  if (!links.length) return "";
  return `<div style="font:13px/1.5 ${SANS};color:${C.muted};margin:12px 0 0">${links
    .map((l) => `<a href="${esc(l.url)}" style="color:${C.text};text-decoration:underline">${esc(l.source)}</a>`)
    .join(" · ")}</div>`;
}

/** Sharp-cornered black caps button: the site's primary button on bone. */
const button = (href: string, text: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0"><tr><td style="background:${C.black}"><a href="${esc(href)}" style="display:inline-block;padding:15px 22px;font:700 12px/1 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:${C.bone};text-decoration:none">${text}</a></td></tr></table>`;

/** Full-width story image, linked to the briefing or the source. Height follows the image's own shape. */
function picture(src: string, href?: string) {
  const img = `<img src="${esc(src)}" width="528" alt="" style="display:block;width:100%;max-width:528px;height:auto;border:0;background:${C.bone}">`;
  return `<div style="margin:0 0 18px">${href ? `<a href="${esc(href)}" style="display:block">${img}</a>` : img}</div>`;
}

function story(issue: Issue, s: IssueStory, opts: EmailOptions, top: boolean) {
  const info = opts.stories?.[s.storyId];
  const site = opts.siteUrl?.replace(/\/$/, "");
  const briefing = info?.briefed && site ? `${site}/story/${s.storyId}` : undefined;
  const cta = top && briefing ? button(briefing, "Read the briefing &rarr;") : "";
  return `<div style="margin:0 0 30px">
    ${info?.image ? picture(info.image, briefing ?? issue.links[s.storyId]?.[0]?.url) : ""}
    ${kicker(info)}
    <div style="font:600 ${top ? 32 : 24}px/1.12 ${SANS};letter-spacing:-.02em;color:${C.text};margin:0 0 10px">${esc(s.headline)}</div>
    <div style="font:${top ? 17 : 16}px/1.6 ${SANS};color:${C.dek}">${esc(s.body)}</div>
    ${s.why ? `<div style="font:${top ? 17 : 16}px/1.6 ${SANS};color:${C.text};margin:12px 0 0;padding:0 0 0 14px;border-left:3px solid ${C.orange}"><strong style="font-weight:700">Why it matters:</strong> ${esc(s.why)}</div>` : ""}
    ${sources(issue, s.storyId)}
    ${cta}
  </div>`;
}

function footer(opts: EmailOptions, webUrl: string) {
  const link = (href: string, text: string) => `<a href="${esc(href)}" style="color:${C.muted};text-decoration:underline">${text}</a>`;
  const lines = ["Written by Claude from the stories Context Window collected."];
  const sub = opts.subscribers;
  if (sub) {
    const host = siteHost(opts.siteUrl);
    lines.push(`You’re getting this because you subscribed${host ? ` at ${esc(host)}` : ""}.`);
    // The unsubscribe placeholder must stay unescaped so Resend can replace it.
    const unsubscribe = `<a href="${sub.unsubscribeUrl}" style="color:${C.muted};text-decoration:underline">Unsubscribe</a>`;
    lines.push([unsubscribe, webUrl && link(webUrl, "Read on the web")].filter(Boolean).join(" · "));
    lines.push(esc(sub.postalAddress));
  } else if (webUrl) {
    lines.push(link(webUrl, "Read on the web"));
  }
  return lines.join("<br>");
}

/**
 * Table-based HTML with inline styles, the only thing every mail client renders the same: an
 * orange masthead band, the issue on a white card over bone, a black sign-off bar. Web fonts
 * load where supported (Apple Mail); elsewhere the stacks fall back to Arial and Helvetica.
 */
export function renderIssueHtml(issue: Issue, opts: EmailOptions = {}): string {
  const site = opts.siteUrl?.replace(/\/$/, "");
  const webUrl = site ? `${site}/issues/${issue.number}` : "";
  let n = 0;

  const sponsor = issue.sponsor
    ? row(
        `<div style="font:700 11px/1.4 ${SANS};letter-spacing:.16em;text-transform:uppercase;color:${C.muted};margin:0 0 10px">Sponsored &middot; Together with ${esc(issue.sponsor.name)}</div>
        <div style="font:600 22px/1.25 ${SANS};letter-spacing:-.01em;color:${C.text};margin:0 0 10px">${esc(issue.sponsor.headline)}</div>
        <div style="font:16px/1.6 ${SANS};color:${C.dek}">${esc(issue.sponsor.body)}</div>
        ${button(issue.sponsor.url, `${esc(issue.sponsor.cta ?? `Visit ${issue.sponsor.name}`)} &rarr;`)}`,
        `background:${C.bone}`,
      )
    : "";

  const sections = issue.sections
    .map(
      (section, i) =>
        row(
          label(++n, section.heading) +
            section.stories.map((s, j) => story(issue, s, opts, i === 0 && j === 0)).join(""),
          "padding-bottom:8px",
        ) + (i === 0 ? sponsor : ""),
    )
    .join("");

  // "In this issue": every section headline, so the reader knows what's coming.
  const contents = issue.sections.flatMap((sec) => sec.stories.map((s) => s.headline));
  const toc = contents.length
    ? row(
        `<div style="font:700 11px/1.4 ${SANS};letter-spacing:.16em;text-transform:uppercase;color:${C.orangeDeep};margin:0 0 10px">In this issue</div>
        ${contents.map((h) => `<div style="font:500 15px/1.45 ${SANS};color:${C.text};padding:5px 0">&#9656;&nbsp; ${esc(h)}</div>`).join("")}${
          issue.quickHits.length ? `<div style="font:500 15px/1.45 ${SANS};color:${C.muted};padding:5px 0">&#9656;&nbsp; Plus ${issue.quickHits.length} more in brief</div>` : ""
        }`,
      )
    : "";

  const rate = site
    ? row(
        `<div style="font:600 20px/1.3 ${SANS};color:${C.text};margin:0 0 14px">How was this issue?</div>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>${RATINGS.map(
          (r) =>
            `<td style="padding:0 8px 8px 0"><a href="${esc(site + feedbackPath(issue.number, r.key))}" style="display:inline-block;padding:12px 18px;border:1px solid ${C.black};font:600 14px/1 ${SANS};color:${C.text};text-decoration:none">${r.label}</a></td>`,
        ).join("")}</tr></table>`,
      )
    : "";

  const signOff = row(
    `<div style="font:16px/1.6 ${SANS};color:${C.dek}">That's it for #${issue.number}. The next issue lands ${nextIssueDay(issue.date)} morning.</div>
    <div style="font:600 16px/1.6 ${SANS};color:${C.text};margin:6px 0 0">${esc(SIGN_OFF)}</div>`,
  );

  const quickHits = issue.quickHits
    .map((q) => {
      const link = issue.links[q.storyId]?.[0];
      const info = opts.stories?.[q.storyId];
      const text = link
        ? `<a href="${esc(link.url)}" style="color:${C.text};text-decoration:none">${esc(q.text)}</a>`
        : esc(q.text);
      const source = link ? `<div style="font:400 13px/1.5 ${SANS};color:${C.muted};margin-top:3px">${esc(link.source)}</div>` : "";
      return `<tr>
        <td width="16" valign="top" style="padding:15px 10px 14px 0;border-bottom:1px solid ${C.rule}">${square(info ? CATEGORY_HEX_ON_BONE[info.category] : C.muted)}</td>
        <td style="padding:13px 0;border-bottom:1px solid ${C.rule};font:500 16px/1.4 ${SANS};color:${C.text}">${text}${source}</td>
      </tr>`;
    })
    .join("");
  const inBrief = quickHits
    ? row(`${label(++n, "In brief")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${quickHits}</table>`)
    : "";

  const forward = webUrl
    ? `<tr><td style="padding:32px 36px">
        <div style="font:600 22px/1.25 ${SANS};letter-spacing:-.01em;color:${C.text};margin:0 0 18px">Know someone who needs the context?</div>
        <a href="mailto:?subject=${encodeURIComponent(issue.subject)}&amp;body=${encodeURIComponent(webUrl)}" style="display:inline-block;padding:14px 20px;border:1px solid ${C.black};font:700 12px/1 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:${C.text};text-decoration:none">Forward this issue</a>
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Michroma&amp;display=swap" rel="stylesheet">
<title>${esc(issue.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bone}">
<span style="display:none;max-height:0;overflow:hidden">${esc(issue.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bone}"><tr><td align="center" style="padding:20px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
    <tr><td align="center" style="padding:0 0 14px;font:12px/1.5 ${SANS};color:${C.muted}">${esc(issue.preview)}${webUrl ? ` · <a href="${esc(webUrl)}" style="color:${C.muted};text-decoration:underline">View in browser</a>` : ""}</td></tr>
    <tr><td style="background:${C.orange};padding:26px 36px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle" style="font:400 18px/1.15 ${DISPLAY};letter-spacing:.06em;text-transform:uppercase;color:${C.black}">Context<br>Window</td>
        <td valign="middle" align="right" style="font:400 10px/1.8 ${DISPLAY};letter-spacing:.14em;text-transform:uppercase;color:${C.black}">Issue #${issue.number}<br>${fmtDateline(issue.date)}</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:${C.card};border:1px solid ${C.rule};border-top:0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row(`<div style="font:500 20px/1.45 ${SANS};letter-spacing:-.01em;color:${C.text}">${esc(issue.intro)}</div>`)}
        ${toc}
        ${sections}
        ${inBrief}
        ${rate}
        ${signOff}
        ${forward}
      </table>
    </td></tr>
    <tr><td style="background:${C.black};padding:22px 36px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle" style="font:400 11px/1.2 ${DISPLAY};letter-spacing:.12em;text-transform:uppercase;color:${C.bone}">Context <span style="color:${C.orange}">Window</span></td>
        <td valign="middle" align="right" style="font:400 10px/1.2 ${DISPLAY};letter-spacing:.12em;text-transform:uppercase;color:${C.concrete}">${esc(siteHost(opts.siteUrl) ?? "contextwindow.me")}</td>
      </tr></table>
    </td></tr>
    <tr><td align="center" style="padding:20px 0 0;font:12px/1.7 ${SANS};color:${C.muted}">${footer(opts, webUrl)}</td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

export function renderIssueText(issue: Issue, opts: EmailOptions = {}): string {
  const lines = [`CONTEXT WINDOW #${issue.number} · ${fmtDate(issue.date)}`, "", issue.intro, ""];
  const contents = issue.sections.flatMap((sec) => sec.stories.map((s) => s.headline));
  if (contents.length) lines.push("IN THIS ISSUE", ...contents.map((h) => `- ${h}`), "");
  issue.sections.forEach((section, i) => {
    lines.push(section.heading.toUpperCase(), "");
    for (const s of section.stories) {
      lines.push(
        s.headline,
        s.body,
        ...(s.why ? [`Why it matters: ${s.why}`] : []),
        ...(issue.links[s.storyId] ?? []).slice(0, 3).map((l) => `  ${l.source}: ${l.url}`),
        "",
      );
    }
    if (i === 0 && issue.sponsor) {
      const sp = issue.sponsor;
      lines.push(`SPONSORED · TOGETHER WITH ${sp.name.toUpperCase()}`, sp.headline, sp.body, sp.url, "");
    }
  });
  if (issue.quickHits.length) {
    lines.push("IN BRIEF", "");
    for (const q of issue.quickHits) lines.push(`- ${q.text} ${issue.links[q.storyId]?.[0]?.url ?? ""}`.trim());
  }
  const site = opts.siteUrl?.replace(/\/$/, "");
  if (site) {
    lines.push("", "How was this issue?", ...RATINGS.map((r) => `  ${r.label}: ${site}${feedbackPath(issue.number, r.key)}`));
  }
  lines.push("", `That's it for #${issue.number}. The next issue lands ${nextIssueDay(issue.date)} morning.`, SIGN_OFF);
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
