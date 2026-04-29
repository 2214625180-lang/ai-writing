import Stripe from "stripe";

function getStripeSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return secretKey;
}

export const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: "2024-06-20"
});
