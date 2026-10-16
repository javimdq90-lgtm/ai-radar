import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Geist, Geist_Mono } from "next/font/google";
import { Footer, SITE_NAME, TAGLINE } from "@/components/brand";
import { OG_BASE, SITE_URL } from "@/lib/site";
import "./globals.css";

const serif = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: TAGLINE,
  openGraph: { ...OG_BASE, type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0F1012",
  colorScheme: "dark",
};

/** Each page renders its own header: the full masthead on the front page, the compact one elsewhere. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">
        {/* The sticky nav's background bleeds to the window edges; clip (unlike hidden) keeps sticky working. */}
        <div className="overflow-x-clip">
          <div className="container-cw">
            {children}
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
