/**
 * Attempts per key (an IP) inside a sliding window. Best effort: it lives in one server
 * instance's memory, so it slows a burst from one address rather than guaranteeing a global limit.
 */
export function rateLimiter(limit: number, windowMs: number) {
  const attempts = new Map<string, number[]>();
  return (key: string) => {
    const now = Date.now();
    const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    attempts.set(key, recent);
    if (attempts.size > 10_000) attempts.clear();
    return recent.length > limit;
  };
}
