import { SUBSCRIPTION_PLANS, type SubscriptionPlanCode } from "@/lib/plans";

export function getUsageLimitSnapshot(planCode: SubscriptionPlanCode) {
  const plan = SUBSCRIPTION_PLANS[planCode];

  return {
    planCode,
    monthlyTokenLimit: plan.monthlyTokenLimit,
    monthlyGenerationLimit: plan.monthlyGenerationLimit
  };
}
