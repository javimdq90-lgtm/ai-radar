import type { Metadata } from "next";
import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { getIssues } from "@/lib/site-data";

export const metadata: Metadata = { title: "Newsletter" };

export default async function IssuesPage() {
  const issues = await getIssues();
  return (
    <>
      <h1 className="pt-6 font-serif text-3xl font-bold">Newsletter</h1>
      <p className="mt-2 text-muted">Every Monday, Wednesday and Friday, written by Claude from the week&apos;s top stories.</p>
      {issues.length ? (
        <ul className="mt-6 divide-y divide-rule">
          {issues.map((issue) => (
            <li key={issue.number} className="py-4">
              <Link href={`/issues/${issue.number}`} className="group block">
                <span className="text-xs text-muted">
                  #{issue.number} · {fmtDate(issue.date)}
                </span>
                <span className="mt-1 block font-serif text-xl font-bold group-hover:text-accent">{issue.subject}</span>
                <span className="mt-1 block text-sm text-muted">{issue.preview}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-muted">No issues yet.</p>
      )}
    </>
  );
}
