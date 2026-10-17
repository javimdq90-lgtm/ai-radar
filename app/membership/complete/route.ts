import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { grantAccess, stripeConfig } from "@/lib/membership";
import { addSubscriber, subscribeConfig } from "@/lib/subscribe";

/**
 * Stripe Checkout's success URL. Confirms the session with Stripe, signs this browser in and adds
 * the address to the newsletter (membership includes it), then shows the welcome.
 */
export async function GET(request: NextRequest) {
  const config = stripeConfig();
  const id = request.nextUrl.searchParams.get("session_id");
  if (!config || !id) redirect("/membership");

  let customer: string | null = null;
  let email: string | null = null;
  try {
    const session = await config.stripe.checkout.sessions.retrieve(id);
    if (session.status === "complete" && typeof session.customer === "string") {
      customer = session.customer;
      email = session.customer_details?.email?.toLowerCase() ?? null;
    }
  } catch (err) {
    console.error("membership/complete:", err);
  }
  if (!customer || !(await grantAccess(customer))) redirect("/membership?status=incomplete");

  if (email && subscribeConfig()) {
    await addSubscriber(email).catch((err) => console.error("membership/complete newsletter:", err));
  }
  redirect("/membership?status=welcome");
}
