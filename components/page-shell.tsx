import type { ReactNode } from "react";
import { Footer, type NavKey, SiteHeader } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";

/** Inner pages: header, a display title, the main column, the newsletter card in the rail, footer. */
export function PageShell({
  active,
  title,
  intro,
  children,
}: {
  active?: NavKey;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader active={active} />
      <div className="container-cw flex flex-wrap gap-16 pb-18 pt-14">
        <main className="flex min-w-0 max-w-[820px] flex-[999_1_560px] flex-col gap-4">
          <h1 className="display m-0 text-[clamp(28px,4vw,42px)] leading-[1.16]">{title}</h1>
          {intro && <div className="text-[19px] leading-[1.6] text-dek">{intro}</div>}
          <div className="mt-4">{children}</div>
        </main>
        <aside aria-label="Newsletter" className="min-w-0 flex-[1_1_320px] self-start lg:sticky lg:top-6">
          <NewsletterBox />
        </aside>
      </div>
      <Footer newsletterHref="#newsletter" />
    </>
  );
}
