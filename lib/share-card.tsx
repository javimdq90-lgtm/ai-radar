import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

/**
 * Link-preview cards (Open Graph and X), drawn with next/og in the neo look: black ground,
 * orange window logo, Michroma for the caps display lines and Inter for the headline.
 */
export const SHARE_SIZE = { width: 1200, height: 630 };

/** Tokens from app/globals.css as literal hex: next/og has no CSS variables. */
const C = {
  orange: "#ff4d00",
  black: "#0a0a0a",
  bone: "#f5f5f3",
  concrete: "#a3a6ab",
  rule: "#2a2d33",
  ghost: "#24272d",
};
const DISPLAY = "Michroma";
const SANS = "Inter";

const asset = (file: string) => readFile(join(process.cwd(), "assets", file));
const fontFiles = Promise.all([
  asset("Michroma-Regular.ttf"),
  asset("Inter-Regular.ttf"),
  asset("Inter-Medium.ttf"),
  asset("Inter-SemiBold.ttf"),
]);

async function fonts() {
  const [michroma, inter400, inter500, inter600] = await fontFiles;
  return [
    { name: DISPLAY, data: michroma, style: "normal" as const, weight: 400 as const },
    { name: SANS, data: inter400, style: "normal" as const, weight: 400 as const },
    { name: SANS, data: inter500, style: "normal" as const, weight: 500 as const },
    { name: SANS, data: inter600, style: "normal" as const, weight: 600 as const },
  ];
}

/** The window from components/brand.tsx: open chamfer top-left, chamfered bottom-right. */
function Symbol({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M32 12 H88 V68 L68 88 H12 V36" stroke={C.orange} strokeWidth="13" />
      <path d="M26 12 L12 26" stroke={C.orange} strokeWidth="5" />
    </svg>
  );
}

/** Stacked CONTEXT / WINDOW in the display face, beside the window. */
function Logo({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.32 }}>
      <Symbol size={size} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontFamily: DISPLAY,
          fontSize: size * 0.36,
          lineHeight: 1.05,
          letterSpacing: "0.05em",
        }}
      >
        <span>CONTEXT</span>
        <span>WINDOW</span>
      </div>
    </div>
  );
}

/** The site footer's orange band, along the bottom. */
function Band({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 84,
        padding: "0 72px",
        background: C.orange,
        color: C.black,
        fontFamily: DISPLAY,
        fontSize: 20,
        letterSpacing: "0.12em",
      }}
    >
      {children}
    </div>
  );
}

const frame = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  background: C.black,
  color: C.bone,
  fontFamily: SANS,
};

/**
 * Without `headline`: the site card (logo, tagline, subline). With it: a story card, a caps
 * kicker (BRIEFING in orange, then the topic in its colour) over an Inter headline.
 */
export async function shareCard({
  headline,
  topic,
  briefing = false,
  color = C.orange,
  tagline,
  subline,
}: {
  headline?: string;
  topic?: string;
  briefing?: boolean;
  color?: string;
  tagline?: string;
  subline?: string;
}) {
  const options = { ...SHARE_SIZE, fonts: await fonts() };

  if (!headline) {
    return new ImageResponse(
      (
        <div style={frame}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 40, padding: "0 72px" }}>
            <Logo size={120} />
            {tagline && (
              <div style={{ fontSize: 64, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.03em" }}>{tagline}</div>
            )}
            {subline && <div style={{ fontSize: 28, lineHeight: 1.4, color: C.concrete, maxWidth: 820 }}>{subline}</div>}
          </div>
          <Band>
            <span>THE CONTEXT BRIEFING</span>
            <span>CONTEXTWINDOW.ME</span>
          </Band>
        </div>
      ),
      options,
    );
  }

  const size = headline.length > 100 ? 56 : headline.length > 70 ? 64 : 74;
  return new ImageResponse(
    (
      <div style={frame}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", padding: "64px 72px 56px" }}>
          <Logo size={64} />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, fontFamily: DISPLAY, fontSize: 22, letterSpacing: "0.14em" }}>
              {briefing && <span style={{ color: C.orange }}>BRIEFING</span>}
              {topic && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, color }}>
                  <div style={{ width: 12, height: 12, background: color }} />
                  <span>{topic.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: size,
                fontWeight: 600,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                maxWidth: 1040,
              }}
            >
              {headline}
            </div>
          </div>
        </div>
        <Band>
          <span>AI NEWS. A WIDER CONTEXT.</span>
          <span>CONTEXTWINDOW.ME</span>
        </Band>
      </div>
    ),
    options,
  );
}
