import type { Metadata } from "next";
import { Suspense } from "react";
import { CompactHeader } from "@/components/brand";
import { ConfirmSubscription } from "@/components/confirm-subscription";

export const metadata: Metadata = { title: "Confirm your subscription", robots: { index: false } };

/** Static shell; the token is read in the browser, so the page itself stays prerendered. */
export default function ConfirmPage() {
  return (
    <>
      <CompactHeader />
      <main className="flex max-w-[640px] flex-col gap-6 pb-24 pt-16">
        <Suspense fallback={<p className="m-0 text-muted">Loading…</p>}>
          <ConfirmSubscription />
        </Suspense>
      </main>
    </>
  );
}
