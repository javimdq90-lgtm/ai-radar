import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { grantAccess, safePath, stripeConfig } from "@/lib/membership";

/**
 * Stripe Checkout's success URL. Confirms the session with Stripe and signs this browser in, then
 * shows the welcome, with a way back to the briefing they were reading. Joining the newsletter is
 * fulfilment, so the webhook does it.
 */
export async function GET(request: NextRequest) {
  const config = stripeConfig();
  const id = request.nextUrl.searchParams.get("session_id");
  if (!config || !id) redirect("/membership");

  let customer: string | null = null;
  try {
    const session = await config.stripe.checkout.sessions.retrieve(id);
    if (session.status === "complete" && typeof session.customer === "string") {
      customer = session.customer;
    }
  } catch (err) {
    console.error("membership/complete:", err);
  }
  if (!customer || !(await grantAccess(customer))) redirect("/membership?status=incomplete");
  const next = safePath(request.nextUrl.searchParams.get("next"));
  redirect(`/membership?status=welcome${next.startsWith("/story/") ? `&next=${encodeURIComponent(next)}` : ""}`);
}
