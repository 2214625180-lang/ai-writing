export type BillingPlan = "FREE" | "PRO" | "TEAM";

export interface CreateCheckoutSessionInput {
  plan: Exclude<BillingPlan, "FREE">;
  successUrl?: string;
  cancelUrl?: string;
}
