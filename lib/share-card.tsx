import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

/**
 * Link-preview cards (Open Graph and X), drawn with next/og in the neo look: black ground, a
 * photo faded in from the right, the logo, Michroma for the caps display lines and
 * Inter for the headline.
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

/**
 * The logo (public/brand/logo.svg: orange window, white CONTEXT / WINDOW lettering) cropped to its
 * artwork, as a data URL next/og can draw. `size` is its height.
 */
const LOGO_SRC = `data:image/svg+xml;base64,${Buffer.from(
  readFileSync(join(process.cwd(), "public", "brand", "logo.svg"), "utf8").replace(
    'width="1400" height="360" viewBox="0 0 1400 360"',
    'width="1278" height="284" viewBox="47 43 1278 284"',
  ),
).toString("base64")}`;
const LOGO_RATIO = 1278 / 284;

function Logo({ size }: { size: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img>
  return <img src={LOGO_SRC} width={Math.round(size * LOGO_RATIO)} height={size} alt="" />;
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
  position: "relative" as const,
  background: C.black,
  color: C.bone,
  fontFamily: SANS,
};

/**
 * The photo full-bleed behind the card, faded to black on the left so the text sits on solid
 * ground and the picture shows on the right, as on the site's hero.
 */
function Backdrop({ src }: { src: ArrayBuffer }) {
  const cover = { position: "absolute" as const, top: 0, left: 0, width: 1200, height: 630 };
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img> */}
      <img
        // @ts-expect-error next/og takes image bytes for src at runtime; the DOM types only allow strings
        src={src}
        alt=""
        width={1200}
        height={630}
        style={{ ...cover, objectFit: "cover" }}
      />
      <div
        style={{
          ...cover,
          background: `linear-gradient(90deg, ${C.black} 0%, ${C.black} 46%, rgba(10,10,10,0.88) 58%, rgba(10,10,10,0.35) 80%, rgba(10,10,10,0.12) 100%)`,
        }}
      />
    </>
  );
}

/**
 * Without `headline`: the site card (logo, tagline, subline). With it: a story card, a caps
 * kicker (BRIEFING in orange, then the topic in its colour) over an Inter headline. `image`
 * (JPEG, PNG or GIF bytes, see lib/share-image.ts) goes behind either, faded in from the right.
 */
export async function shareCard({
  headline,
  topic,
  briefing = false,
  color = C.orange,
  tagline,
  subline,
  image,
}: {
  headline?: string;
  topic?: string;
  briefing?: boolean;
  color?: string;
  tagline?: string;
  subline?: string;
  image?: ArrayBuffer | null;
}) {
  const options = { ...SHARE_SIZE, fonts: await fonts() };
  const textWidth = image ? 640 : 1040;

  if (!headline) {
    return new ImageResponse(
      (
        <div style={frame}>
          {image && <Backdrop src={image} />}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 40, padding: "0 72px" }}>
            <Logo size={120} />
            {tagline && (
              <div style={{ fontSize: image ? 54 : 64, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: textWidth }}>{tagline}</div>
            )}
            {subline && (
              <div style={{ fontSize: 28, lineHeight: 1.4, color: C.concrete, maxWidth: image ? 600 : 820 }}>{subline}</div>
            )}
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

  const size = image
    ? headline.length > 90 ? 44 : headline.length > 60 ? 50 : 60
    : headline.length > 100 ? 56 : headline.length > 70 ? 64 : 74;
  return new ImageResponse(
    (
      <div style={frame}>
        {image && <Backdrop src={image} />}
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
                maxWidth: textWidth,
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
