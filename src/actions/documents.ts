"use server";

import { createErrorResult, createSuccessResult } from "@/lib/actions";
import { documentService } from "@/services/document.service";
import { userService } from "@/services/user.service";

export async function getRecentDocumentsAction() {
  try {
    const user = await userService.getCurrentUser();
    const userId = user.id;
    const documents = await documentService.listRecentByUser(userId);

    return createSuccessResult(documents);
  } catch {
    return createErrorResult("Failed to load recent documents.");
  }
}
