import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Link-preview cards (Open Graph and X), drawn with next/og in the site's colours and display font. */
export const SHARE_SIZE = { width: 1200, height: 630 };

const C = { bg: "#0F1012", text: "#ECE9E2", muted: "#A3A39C", token: "#3A3D42", accent: "#F2C14E" };

const font = readFile(join(process.cwd(), "assets/DMSerifDisplay-Regular.ttf"));

function Mark({ width, fill }: { width: number; fill: string }) {
  return (
    <svg width={width} height={(width * 52) / 64} viewBox="0 0 64 52" fill="none">
      <rect x="2" y="21" width="8" height="10" rx="2" fill={C.token} />
      <rect x="14" y="21" width="8" height="10" rx="2" fill={C.token} />
      <rect x="28" y="21" width="8" height="10" rx="2" fill={fill} />
      <rect x="40" y="21" width="8" height="10" rx="2" fill={fill} />
      <rect x="54" y="21" width="8" height="10" rx="2" fill={C.token} />
      <rect x="25" y="12" width="26" height="28" rx="4" stroke={C.text} strokeWidth="2" />
    </svg>
  );
}

/**
 * Without `headline`: the site card (mark, wordmark, tagline). With it: a story card, the kicker
 * and headline in the category colour, the wordmark along the bottom.
 */
export async function shareCard({
  headline,
  kicker,
  color = C.accent,
  tagline,
}: {
  headline?: string;
  kicker?: string;
  color?: string;
  tagline?: string;
}) {
  const fonts = [{ name: "DM Serif Display", data: await font, style: "normal" as const, weight: 400 as const }];
  const frame = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    background: `radial-gradient(circle at 92% 8%, ${color}2e 0%, ${C.bg} 38%)`,
    color: C.text,
    fontFamily: "DM Serif Display",
    padding: 72,
  };

  if (!headline) {
    return new ImageResponse(
      (
        <div style={{ ...frame, justifyContent: "center", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <Mark width={150} fill={C.accent} />
            <div style={{ fontSize: 120, lineHeight: 1, letterSpacing: -2 }}>Context Window</div>
          </div>
          <div style={{ fontSize: 44, color: C.muted }}>{tagline}</div>
        </div>
      ),
      { ...SHARE_SIZE, fonts },
    );
  }

  const size = headline.length > 90 ? 64 : headline.length > 60 ? 74 : 86;
  return new ImageResponse(
    (
      <div style={{ ...frame, justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 30, letterSpacing: 3, textTransform: "uppercase", color }}>{kicker}</div>
          <div style={{ fontSize: size, lineHeight: 1.05, maxWidth: 1000 }}>{headline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Mark width={64} fill={color} />
          <div style={{ fontSize: 40 }}>Context Window</div>
        </div>
      </div>
    ),
    { ...SHARE_SIZE, fonts },
  );
}
