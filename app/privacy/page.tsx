import type { Metadata } from "next";
import { Footer, SiteHeader } from "@/components/brand";

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
    heading: "Membership",
    body: [
      "Members pay through Stripe, which handles card details and keeps your email, payment method and subscription under its own privacy policy. Card details never reach us.",
      "To keep you signed in, your browser stores two cookies: one naming your Stripe customer record, signed so it can't be forged, and one saying when to check your membership with Stripe again. Signing out removes both.",
      "Sign-in links are emailed by Resend. Joining also adds your address to the newsletter, which you can unsubscribe from at any time without cancelling.",
    ],
  },
  {
    heading: "The website",
    body: [
      "The site has no advertising and no analytics or tracking cookies. Search runs in your browser over a list of stories; what you type isn't sent to us.",
      "To count your free briefings, your browser keeps a list of the briefings you've opened this month in its own storage. It never leaves your device, and clearing your browser's site data resets it.",
      "The site is hosted on Vercel, which, like any web host, handles your IP address to serve pages and may keep it briefly in server logs for security and reliability.",
      "Story images are loaded from the publishers' own servers, which therefore see your IP address, as they would if you visited them. Headlines that aren't briefings link straight to the original article, on that publisher's site and under its own privacy policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-cw flex flex-col gap-10 pb-24 pt-14">
        <h1 className="display m-0 text-[clamp(28px,4vw,42px)] leading-[1.16]">Privacy</h1>
        {SECTIONS.map((section) => (
          <section key={section.heading} className="flex max-w-[720px] flex-col gap-4">
            <h2 className="display m-0 text-[18px] tracking-[0.08em]">{section.heading}</h2>
            {section.body.map((p) => (
              <p key={p} className="m-0 text-[18px] leading-[1.7] text-body">
                {p}
              </p>
            ))}
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
