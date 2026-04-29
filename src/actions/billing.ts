"use server";

import { createErrorResult, createSuccessResult } from "@/lib/actions";
import { billingService } from "@/services/billing.service";
import { userService } from "@/services/user.service";

export async function getCurrentSubscriptionAction() {
  try {
    const user = await userService.getCurrentUser();
    const userId = user.id;
    const subscription = await billingService.getSubscriptionByUserId(userId);

    return createSuccessResult(subscription);
  } catch {
    return createErrorResult("Failed to load current subscription.");
  }
}
