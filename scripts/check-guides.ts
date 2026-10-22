/** Validates every guide in content/guides against the schema in lib/guides.ts. */
import { loadGuides } from "@/lib/guides";

try {
  const guides = loadGuides();
  for (const g of guides) console.log(`ok  ${g.slug}  (${g.steps.length} steps, ${g.sources.length} sources)`);
  console.log(`${guides.length} guides valid`);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
