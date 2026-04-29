"use server";

import { createErrorResult, createSuccessResult } from "@/lib/actions";
import { templateService } from "@/services/template.service";

export async function getActiveTemplatesAction() {
  try {
    const templates = await templateService.listActiveTemplates();

    return createSuccessResult(templates);
  } catch {
    return createErrorResult("Failed to load active templates.");
  }
}
