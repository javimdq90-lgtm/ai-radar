"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * The article's own image, hotlinked from the publisher, in its own colours. Third-party images
 * break (hotlink protection, deleted files), so a failed one swaps itself for `fallback`, a brand
 * image or scene. Put it inside a `group` element for the hover zoom.
 */
export function StoryImage({
  src,
  fallback,
  ratio = "16/9",
  fill = false,
  priority = false,
}: {
  src?: string;
  fallback: ReactNode;
  /** A CSS aspect ratio to crop to, or "auto" to show the whole image at its own shape. */
  ratio?: string;
  /** Cover the nearest positioned ancestor instead of keeping an aspect ratio (the hero). */
  fill?: boolean;
  /** Load straight away: the hero, which is on screen at first paint. */
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // An image can fail before React attaches onError; catch that case after hydration.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (!src || failed) return fallback;
  return (
    <div
      style={fill || ratio === "auto" ? undefined : { aspectRatio: ratio }}
      className={fill ? "absolute inset-0 overflow-hidden" : "relative overflow-hidden bg-raised"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote images from any news site; next/image would need every host allow-listed */}
      <img
        ref={img}
        src={src}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${ratio === "auto" && !fill ? "block h-auto" : "h-full object-cover"} w-full ease-out motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]`}
      />
    </div>
  );
}
