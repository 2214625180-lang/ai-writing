"use server";

import { createActionError, createActionSuccess } from "@/lib/actions";
import { requireDatabaseUserId } from "@/lib/auth";
import { documentService } from "@/services/document.service";

export async function getRecentDocumentsAction() {
  try {
    const userId = await requireDatabaseUserId();
    const documents = await documentService.listRecentByUser(userId);

    return createActionSuccess(documents);
  } catch {
    return createActionError("FAILED_TO_LOAD_DOCUMENTS");
  }
}
