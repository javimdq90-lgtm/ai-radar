import type { Metadata } from "next";
import Link from "next/link";
import { CompactHeader } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";
import { fmtDate } from "@/lib/format";
import { getIssues } from "@/lib/site-data";

export const metadata: Metadata = { title: "Newsletter" };

export default async function IssuesPage() {
  const issues = await getIssues();
  return (
    <>
      <CompactHeader />
      <div className="flex flex-wrap gap-14 pb-16 pt-12">
        <main className="min-w-0 max-w-[760px] flex-[999_1_560px]">
          <h1 className="m-0 font-display text-[clamp(38px,6vw,64px)] font-normal leading-[1.02]">Newsletter</h1>
          <p className="mb-0 mt-4 text-[19px] leading-[1.6] text-dek">
            Every Monday, Wednesday and Friday morning: the stories that mattered since the last issue, in five minutes.
          </p>
          {issues.length ? (
            <ul className="mt-8 list-none border-t-2 border-text p-0">
              {issues.map((issue) => (
                <li key={issue.number}>
                  <Link href={`/issues/${issue.number}`} className="group flex flex-col gap-1.5 border-b border-line py-6">
                    <span className="font-mono text-[12px] tracking-[0.04em] text-accent">
                      ISSUE #{issue.number} · {fmtDate(issue.date).toUpperCase()}
                    </span>
                    <span className="font-display text-[30px] leading-[1.1] group-hover:underline">{issue.subject}</span>
                    <span className="text-[15px] text-dek">{issue.preview}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-muted">No issues yet.</p>
          )}
        </main>
        <aside className="min-w-0 flex-[1_1_300px]">
          <NewsletterBox />
        </aside>
      </div>
    </>
  );
}
