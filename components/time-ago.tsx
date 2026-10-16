"use client";

import { useEffect, useState } from "react";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function relative(iso: string, now: number) {
  const diff = now - new Date(iso).getTime();
  if (diff < 0) return null;
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < 24 * HOUR) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  return null;
}

/**
 * Pages are prerendered, so the server writes an absolute time ("14:05", "Wed 14:05") and the
 * browser swaps in "2 hours ago" for anything from the last day, refreshing every minute.
 */
export function TimeAgo({ iso, fallback }: { iso: string; fallback: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setLabel(relative(iso, Date.now()));
    tick();
    const timer = setInterval(tick, MINUTE);
    return () => clearInterval(timer);
  }, [iso]);
  return (
    <time dateTime={iso} title={label ? fallback : undefined}>
      {label ?? fallback}
    </time>
  );
}
