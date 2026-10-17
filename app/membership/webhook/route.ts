import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripeConfig } from "@/lib/membership";
import { addSubscriber, subscribeConfig } from "@/lib/subscribe";

/**
 * Stripe webhook (Developers → Webhooks, events checkout.session.completed and
 * checkout.session.async_payment_succeeded; its signing secret is STRIPE_WEBHOOK_SECRET).
 *
 * Fulfilment happens here rather than on the success page, which a reader can close before it
 * loads: a new member joins the newsletter. Access itself needs no handler, because it is read
 * from Stripe (lib/membership.ts), so renewals, failed payments and cancellations take effect at
 * the next check without us storing anything.
 */
export async function POST(request: NextRequest) {
  const config = stripeConfig();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!config || !secret) return new Response("Webhook not configured", { status: 503 });

  let event: Stripe.Event;
  try {
    event = await config.stripe.webhooks.constructEventAsync(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      secret,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    const email = session.customer_details?.email?.toLowerCase();
    if (session.mode === "subscription" && paid && email && subscribeConfig()) {
      try {
        await addSubscriber(email);
      } catch (err) {
        console.error("membership/webhook newsletter:", err);
        // A 500 makes Stripe retry the event later.
        return new Response("Newsletter sign-up failed", { status: 500 });
      }
    }
  }
  return Response.json({ received: true });
}
