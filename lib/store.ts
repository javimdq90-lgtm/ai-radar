import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Issue, Item } from "./types";

/**
 * The repo is the database: items live in one JSON file per month (by fetch date),
 * issues in one JSON file each. GitHub Actions commits changes; each push redeploys the site.
 */
const DATA_DIR = path.join(process.cwd(), "data");
const ITEMS_DIR = path.join(DATA_DIR, "items");
const ISSUES_DIR = path.join(DATA_DIR, "issues");

const TRACKING_PARAMS = /^(utm_\w+|ref|ref_src|fbclid|gclid|mc_cid|mc_eid|source|via)$/i;

export function canonicalUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
    }
    u.protocol = "https:";
    return u.toString().replace(/\/(\?|$)/, "$1");
  } catch {
    return raw.trim();
  }
}

export const itemId = (url: string) => createHash("sha1").update(canonicalUrl(url)).digest("hex").slice(0, 12);

const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 1)}\n`);
}

/** Items fetched in the last `months` calendar months (current month included), newest first. */
export async function loadItems(months = 2): Promise<Item[]> {
  const now = new Date();
  const keys = Array.from({ length: months }, (_, i) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)).toISOString().slice(0, 7),
  );
  const lists = await Promise.all(keys.map((k) => readJson<Item[]>(path.join(ITEMS_DIR, `${k}.json`), [])));
  return lists.flat().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Writes items back into their month files. Only months present in `items` are touched. */
export async function saveItems(items: Item[]) {
  const byMonth = new Map<string, Item[]>();
  for (const item of items) {
    const key = monthKey(item.fetchedAt);
    byMonth.set(key, [...(byMonth.get(key) ?? []), item]);
  }
  for (const [key, list] of byMonth) {
    list.sort((a, b) => a.fetchedAt.localeCompare(b.fetchedAt) || a.id.localeCompare(b.id));
    await writeJson(path.join(ITEMS_DIR, `${key}.json`), list);
  }
}

export async function loadIssues(): Promise<Issue[]> {
  let files: string[];
  try {
    files = await readdir(ISSUES_DIR);
  } catch {
    return [];
  }
  const issues = await Promise.all(
    files.filter((f) => f.endsWith(".json")).map((f) => readJson<Issue | null>(path.join(ISSUES_DIR, f), null)),
  );
  return issues.filter((i): i is Issue => i !== null).sort((a, b) => b.number - a.number);
}

export async function saveIssue(issue: Issue) {
  await writeJson(path.join(ISSUES_DIR, `${String(issue.number).padStart(3, "0")}.json`), issue);
}
