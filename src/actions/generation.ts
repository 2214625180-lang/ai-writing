"use server";

import { createActionError, createActionSuccess } from "@/lib/actions";
import { requireDatabaseUserId } from "@/lib/auth";
import { generationService } from "@/services/generation.service";

export async function getRecentGenerationsAction() {
  try {
    const userId = await requireDatabaseUserId();
    const generations = await generationService.listRecentByUser(userId);

    return createActionSuccess(generations);
  } catch {
    return createActionError("FAILED_TO_LOAD_GENERATIONS");
  }
}
