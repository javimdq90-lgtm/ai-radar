import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer, SiteHeader } from "@/components/brand";
import { FeedbackForm } from "@/components/feedback-form";

export const metadata: Metadata = { title: "Feedback", robots: { index: false } };

export default function FeedbackPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-cw relative flex max-w-[720px] flex-col gap-8 pb-24 pt-14">
        <p className="kicker m-0 text-signal">The Context Briefing</p>
        <Suspense>
          <FeedbackForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
