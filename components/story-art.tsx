import type { CSSProperties } from "react";
import { Mark } from "@/components/brand";
import { catStyle } from "@/lib/category";
import { CATEGORY_LABELS, type Story } from "@/lib/types";

/** The token field has a fixed number of columns at any width; each cell is 16×18 units, like the logo's tokens. */
const grid = (cols: number) => ({ cell: `(100cqw / ${cols})`, row: `(100cqw * 18 / ${cols * 16})` });

const TOKEN_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 18'%3E%3Crect x='3' y='3' width='10' height='12' rx='2'/%3E%3C/svg%3E\")";

/** FNV-1a, then mulberry32: the same story always gets the same art. */
function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A 7×5 patch of tokens that glows outward from a lit "window", positioned on the field's grid. */
function Cluster({ id, cols }: { id: string; cols: number }) {
  const rand = seeded(id);
  const { cell, row: rowHeight } = grid(cols);
  // Wide art: the right half, clear of the label. Small art: wherever the patch fits.
  const col = cols >= 12 ? 6 + Math.floor(rand() * (cols - 12)) : Math.floor(rand() * Math.max(1, cols - 6));
  const row = Math.floor(rand() * (cols >= 12 ? 4 : 2));
  const len = rand() < 0.35 ? 3 : 2;
  const start = 3 - Math.floor(len / 2);

  const tokens = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      const lit = r === 2 && c >= start && c < start + len;
      const dist = Math.hypot(c - (start + (len - 1) / 2), (r - 2) * 1.2);
      const opacity = lit ? 1 : Math.max(0, 0.55 - dist * 0.14) * (0.6 + rand() * 0.4);
      if (opacity < 0.05) continue;
      tokens.push(<rect key={`${r}-${c}`} x={c * 16 + 3} y={r * 18 + 3} width="10" height="12" rx="2" fill="var(--cat)" fillOpacity={opacity} />);
    }
  }
  return (
    <svg
      viewBox="0 0 112 90"
      className="absolute"
      style={{ left: `calc(${col} * ${cell})`, top: `calc(${row} * ${rowHeight})`, width: `calc(7 * ${cell})` }}
    >
      {tokens}
      <rect x={start * 16} y={2 * 18 - 2} width={len * 16} height="22" rx="4" fill="none" stroke="var(--cw-text)" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Generated art for a story: the category tint, a field of tokens in the category colour, and a
 * lit window like the logo's, placed differently for every story. The fallback when a story has no
 * image of its own, or its image fails to load (see StoryVisual in components/story.tsx).
 * Put it inside a `group` element to get the hover zoom.
 */
export function StoryArt({
  story,
  ratio = "16/9",
  fill = false,
  label = true,
  cols = 16,
  className = "",
}: {
  story: Story;
  ratio?: string;
  /** Cover the nearest positioned ancestor instead of keeping an aspect ratio (the hero). */
  fill?: boolean;
  label?: boolean;
  /** Token columns across; fewer makes bigger tokens for small thumbnails. */
  cols?: number;
  className?: string;
}) {
  const { cell, row } = grid(cols);
  const rand = seeded(story.id);
  const glowX = 50 + rand() * 40;
  const glowY = 15 + rand() * 35;
  const style: CSSProperties = { ...catStyle(story.category), ...(fill ? {} : { aspectRatio: ratio }) };

  return (
    <div
      aria-hidden
      style={style}
      className={`${fill ? "absolute inset-0" : "relative rounded-cw border border-tint-line"} overflow-hidden bg-tint [container-type:inline-size] ${className}`}
    >
      <div className="absolute inset-0 ease-out motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.04]">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, color-mix(in oklab, var(--cat) 30%, transparent), transparent 65%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            background: "var(--cat)",
            maskImage: TOKEN_MASK,
            WebkitMaskImage: TOKEN_MASK,
            maskSize: `calc${cell} calc${row}`,
            WebkitMaskSize: `calc${cell} calc${row}`,
          }}
        />
        <Cluster id={story.id} cols={cols} />
      </div>
      {label && (
        <span className="absolute left-[clamp(12px,4cqw,24px)] top-[clamp(12px,4cqw,24px)] flex items-center gap-2 text-cat">
          <Mark width={28} fill="var(--cat)" />
          <span className="label">{CATEGORY_LABELS[story.category]}</span>
        </span>
      )}
    </div>
  );
}
