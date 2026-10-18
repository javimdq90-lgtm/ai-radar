import type { Metadata } from "next";
import { IssueList } from "@/components/issue-list";
import { PageShell } from "@/components/page-shell";
import { fmtDate } from "@/lib/format";
import { getIssues } from "@/lib/site-data";

export const metadata: Metadata = { title: "Newsletter" };

export default async function IssuesPage() {
  const issues = await getIssues();
  return (
    <PageShell
      title="The Context Briefing"
      intro="Every Monday, Wednesday and Friday morning: the stories that mattered since the last issue, in five minutes."
    >
      {issues.length ? (
        <IssueList
          issues={issues.map((issue) => ({
            number: issue.number,
            dateLabel: fmtDate(issue.date),
            subject: issue.subject,
            preview: issue.preview,
            headlines: issue.sections.flatMap((sec) => sec.stories.map((st) => st.headline)),
          }))}
        />
      ) : (
        <p className="py-10 text-muted">No issues yet.</p>
      )}
    </PageShell>
  );
}
