export type BillingPlan = "FREE" | "PRO" | "TEAM";

export type CheckoutPlan = Exclude<BillingPlan, "FREE">;

export interface CreateCheckoutSessionInput {
  plan: CheckoutPlan;
}

export interface CreateCheckoutSessionResult {
  url: string;
}

export interface CreatePaymentElementSubscriptionInput {
  plan: CheckoutPlan;
}

export interface CreatePaymentElementSubscriptionResult {
  clientSecret: string;
  subscriptionId: string;
}

export interface CreateCustomerPortalResult {
  url: string;
}
