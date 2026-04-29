"use server";

import { createActionError, createActionSuccess } from "@/lib/actions";
import { templateService } from "@/services/template.service";

export async function getActiveTemplatesAction() {
  try {
    const templates = await templateService.listActiveTemplates();

    return createActionSuccess(templates);
  } catch {
    return createActionError("FAILED_TO_LOAD_TEMPLATES");
  }
}
