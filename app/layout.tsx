import type { Metadata, Viewport } from "next";
import { Inter, Michroma } from "next/font/google";
import { SITE_NAME, TAGLINE } from "@/components/brand";
import { SubscribePrompt } from "@/components/subscribe-prompt";
import { membershipOpen } from "@/lib/membership";
import { METER_SCRIPT } from "@/lib/meter";
import { OG_BASE, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Display face: Michroma (OFL). The design's Nebula needs a commercial licence before it can
 * ship; once bought, add it back with next/font/local as --font-nebula ahead of Michroma in
 * --font-display (app/globals.css).
 */
const michroma = Michroma({ weight: "400", subsets: ["latin"], variable: "--font-michroma", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: TAGLINE,
  openGraph: { ...OG_BASE, type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

/** Pages compose their own full-width bands (utility bar, header, sections, footer); see components/brand. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${michroma.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Sets html[data-paywall] before the first paint, so a locked briefing never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: METER_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        {membershipOpen() && <SubscribePrompt />}
      </body>
    </html>
  );
}
