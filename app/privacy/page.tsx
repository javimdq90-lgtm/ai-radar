import type { Metadata } from "next";
import { CompactHeader } from "@/components/brand";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "The newsletter",
    body: [
      "If you sign up, we keep your email address and nothing else. We use it only to send Context Window, three times a week.",
      "Signing up sends you one email with a confirmation link. Your address is added to the list only when you click it, so nobody can subscribe you without your say-so. Unused links expire after seven days.",
      "Every issue has an unsubscribe link. Using it stops the emails straight away.",
      "Addresses are stored and emails are sent by Resend, our email provider. We don't sell, rent or share the list with anyone else.",
    ],
  },
  {
    heading: "The website",
    body: [
      "The site has no accounts, no advertising and no analytics or tracking cookies. Search runs in your browser over a list of stories; what you type isn't sent to us.",
      "The site is hosted on Vercel, which, like any web host, handles your IP address to serve pages and may keep it briefly in server logs for security and reliability.",
      "Story images are loaded from the publishers' own servers, which therefore see your IP address, as they would if you visited them. Headlines that aren't briefings link straight to the original article, on that publisher's site and under its own privacy policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <CompactHeader />
      <main className="flex max-w-[720px] flex-col gap-10 pb-24 pt-12">
        <h1 className="m-0 font-display text-[clamp(38px,6vw,64px)] font-normal leading-[1.02]">Privacy</h1>
        {SECTIONS.map((section) => (
          <section key={section.heading} className="flex flex-col gap-4">
            <h2 className="m-0 font-display text-[30px] font-normal leading-[1.1]">{section.heading}</h2>
            {section.body.map((p) => (
              <p key={p} className="m-0 text-[18px] leading-[1.7] text-body">
                {p}
              </p>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}
