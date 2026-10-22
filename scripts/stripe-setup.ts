/**
 * One-time Stripe setup: creates the membership product with its monthly price and prints the
 * price id for STRIPE_PRICE_ID. Run with a test key first, then again with the live key:
 *
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY first.");
  process.exit(1);
}
const stripe = new Stripe(key);

async function main(stripe: Stripe, live: boolean) {
  const product = await stripe.products.create({
    name: "Context Window Membership",
    description: "Every briefing in full, and the Context Briefing three times a week.",
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: 200,
    recurring: { interval: "month" },
  });
  console.log(`${live ? "Live" : "Test"} mode. Set STRIPE_PRICE_ID=${price.id}`);
}

main(stripe, key.startsWith("sk_live")).catch((err) => {
  console.error(err);
  process.exit(1);
});
