import Stripe from "stripe";
import { assertSafeStripeEnvironment } from "@/lib/stripe-environment";

let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is missing. Add it to your .env.local and Vercel environment variables."
      );
    }
    assertSafeStripeEnvironment(key);
    stripeInstance = new Stripe(key, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return stripeInstance;
};
