import type { Issue } from "./types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const C = { ink: "#161616", muted: "#5d5c58", rule: "#dedad1", accent: "#b5121b", bg: "#f3f1ec" };

function links(issue: Issue, storyId: string) {
  return (issue.links[storyId] ?? [])
    .slice(0, 3)
    .map((l) => `<a href="${esc(l.url)}" style="color:${C.accent};text-decoration:none">${esc(l.source)}</a>`)
    .join(" · ");
}

/** Plain table-based HTML with inline styles: the only thing every mail client renders the same. */
export function renderIssueHtml(issue: Issue, siteUrl?: string): string {
  const sections = issue.sections
    .map(
      (section) => `
      <tr><td style="padding:28px 0 4px;font:600 12px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">${esc(section.heading)}</td></tr>
      ${section.stories
        .map(
          (s) => `
      <tr><td style="padding:12px 0 18px;border-bottom:1px solid ${C.rule}">
        <div style="font:700 19px/1.3 Georgia,'Times New Roman',serif;color:${C.ink};margin:0 0 6px">${esc(s.headline)}</div>
        <div style="font:16px/1.55 Georgia,'Times New Roman',serif;color:${C.ink}">${esc(s.body)}</div>
        <div style="font:13px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;margin-top:8px">${links(issue, s.storyId)}</div>
      </td></tr>`,
        )
        .join("")}`,
    )
    .join("");

  const quickHits = issue.quickHits.length
    ? `
      <tr><td style="padding:28px 0 8px;font:600 12px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">Quick hits</td></tr>
      <tr><td><ul style="margin:0;padding:0 0 0 18px;font:15px/1.5 Georgia,'Times New Roman',serif;color:${C.ink}">
        ${issue.quickHits
          .map((q) => {
            const href = issue.links[q.storyId]?.[0]?.url;
            const text = href
              ? `<a href="${esc(href)}" style="color:${C.ink};text-decoration:underline;text-decoration-color:${C.rule}">${esc(q.text)}</a>`
              : esc(q.text);
            return `<li style="margin:0 0 8px">${text}</li>`;
          })
          .join("")}
      </ul></td></tr>`
    : "";

  const archive = siteUrl
    ? `<a href="${esc(`${siteUrl.replace(/\/$/, "")}/issues/${issue.number}`)}" style="color:${C.muted}">Read on the web</a>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(issue.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<span style="display:none;max-height:0;overflow:hidden">${esc(issue.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;padding:32px 28px">
    <tr><td style="font:700 14px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${C.ink}">AI Radar <span style="color:${C.muted};font-weight:400">#${issue.number}</span></td></tr>
    <tr><td style="padding:6px 0 20px;font:13px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${C.muted};border-bottom:2px solid ${C.ink}">${fmtDate(issue.date)}</td></tr>
    <tr><td style="padding:20px 0 0;font:17px/1.55 Georgia,'Times New Roman',serif;color:${C.ink}">${esc(issue.intro)}</td></tr>
    ${sections}
    ${quickHits}
    <tr><td style="padding:32px 0 0;font:12px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${C.muted}">Written by Claude from the stories AI Radar collected. ${archive}</td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

export function renderIssueText(issue: Issue): string {
  const lines = [`AI RADAR #${issue.number} · ${fmtDate(issue.date)}`, "", issue.intro, ""];
  for (const section of issue.sections) {
    lines.push(section.heading.toUpperCase(), "");
    for (const s of section.stories) {
      lines.push(s.headline, s.body, ...(issue.links[s.storyId] ?? []).slice(0, 3).map((l) => `  ${l.source}: ${l.url}`), "");
    }
  }
  if (issue.quickHits.length) {
    lines.push("QUICK HITS", "");
    for (const q of issue.quickHits) lines.push(`- ${q.text} ${issue.links[q.storyId]?.[0]?.url ?? ""}`.trim());
  }
  return lines.join("\n");
}
