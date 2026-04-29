"use server";

import { createActionError, createActionSuccess } from "@/lib/actions";
import { requireDatabaseUserId } from "@/lib/auth";
import { billingService } from "@/services/billing.service";

export async function getCurrentSubscriptionAction() {
  try {
    const userId = await requireDatabaseUserId();
    const subscription = await billingService.getSubscriptionByUserId(userId);

    return createActionSuccess(subscription);
  } catch {
    return createActionError("FAILED_TO_LOAD_SUBSCRIPTION");
  }
}
