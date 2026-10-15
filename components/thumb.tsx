"use client";

import { useState } from "react";

/**
 * A hotlinked news image. Third-party images break (hotlink protection, deleted files), so a
 * failed one removes itself rather than leaving a broken-image box in the layout.
 */
export function Thumb({ src, ratio = "3/2", className = "" }: { src: string; ratio?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className={`overflow-hidden bg-rule ${className}`} style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote images from any news site; next/image would need every host allow-listed */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
