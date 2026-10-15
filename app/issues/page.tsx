import type { Metadata } from "next";
import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { getIssues } from "@/lib/site-data";

export const metadata: Metadata = { title: "Newsletter" };

export default async function IssuesPage() {
  const issues = await getIssues();
  return (
    <div className="mx-auto max-w-3xl pt-8">
      <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">Newsletter</h1>
      <p className="dek mt-3 text-xl">
        Every Monday, Wednesday and Friday morning: the stories that mattered since the last issue, in five minutes.
      </p>
      {issues.length ? (
        <ul className="mt-8 divide-y divide-rule border-t-[3px] border-ink">
          {issues.map((issue) => (
            <li key={issue.number} className="py-6">
              <Link href={`/issues/${issue.number}`} className="group block">
                <span className="kicker text-accent">
                  #{issue.number} · {fmtDate(issue.date)}
                </span>
                <span className="headline mt-1.5 block text-[1.6rem] leading-tight group-hover:underline">
                  {issue.subject}
                </span>
                <span className="dek mt-1.5 block">{issue.preview}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-muted">No issues yet.</p>
      )}
    </div>
  );
}
