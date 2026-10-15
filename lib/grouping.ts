import type { Item } from "./types";

/** Lower-cased title without punctuation, for spotting the same post syndicated by two feeds. */
const titleKey = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/**
 * Turns Claude's groups into story ids. Groups may overlap or reference unknown ids; both
 * are tolerated. Items with identical titles are merged regardless of what Claude said.
 * Each story's id is its earliest item's id, so ids stay stable as coverage is added.
 */
export function assignStoryIds(items: Item[], groups: string[][]): Map<string, string> {
  const parent = new Map(items.map((i) => [i.id, i.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(id, root);
    return root;
  };
  const union = (a: string, b: string) => {
    if (!parent.has(a) || !parent.has(b)) return;
    parent.set(find(a), find(b));
  };

  for (const group of groups) for (const id of group.slice(1)) union(group[0], id);

  const byTitle = new Map<string, string>();
  for (const item of items) {
    const key = titleKey(item.title);
    if (key.length < 12) continue; // too short to be distinctive
    const seen = byTitle.get(key);
    if (seen) union(seen, item.id);
    else byTitle.set(key, item.id);
  }

  const members = new Map<string, Item[]>();
  for (const item of items) {
    const root = find(item.id);
    members.set(root, [...(members.get(root) ?? []), item]);
  }
  const storyIds = new Map<string, string>();
  for (const group of members.values()) {
    const earliest = group.reduce((a, b) => (b.publishedAt < a.publishedAt ? b : a));
    for (const item of group) storyIds.set(item.id, earliest.id);
  }
  return storyIds;
}
