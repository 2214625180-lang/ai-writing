import type { SubscriptionPlanCode } from "@/lib/plans";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface BillingSubscriptionRecord {
  id: string;
  userId: string;
  planCode: SubscriptionPlanCode;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
