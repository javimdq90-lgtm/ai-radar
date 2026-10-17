import type { Metadata } from "next";
import Link from "next/link";
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
        <ul className="m-0 list-none border-t-2 border-fg p-0">
          {issues.map((issue) => (
            <li key={issue.number}>
              <Link href={`/issues/${issue.number}`} className="group flex flex-col gap-2 border-b border-rule py-6 hover:text-fg">
                <span className="kicker text-signal">
                  Issue #{issue.number} · {fmtDate(issue.date)}
                </span>
                <span className="text-[24px] font-semibold leading-[1.2] group-hover:text-signal">{issue.subject}</span>
                <span className="text-[15px] text-dek">{issue.preview}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-muted">No issues yet.</p>
      )}
    </PageShell>
  );
}
