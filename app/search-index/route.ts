import { getSearchIndex } from "@/lib/site-data";

/** Static JSON of every story for the search box; rebuilt with the rest of the site. */
export async function GET() {
  return Response.json(await getSearchIndex());
}
