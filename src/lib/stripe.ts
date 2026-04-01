import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is missing in the environment variables.");
    }
    
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia", // Versão exata exigida pelo SDK
      typescript: true,
    });
  }
  return stripeInstance;
};

