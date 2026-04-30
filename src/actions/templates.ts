"use server";

import { z } from "zod";

import { createErrorResult, createSuccessResult } from "@/lib/actions";
import { AuthError } from "@/lib/auth";
import {
  canUsePremiumTemplate,
  generationService
} from "@/services/generation.service";
import {
  buildPromptFromTemplateValues,
  templateService,
  TemplateNotFoundError,
  TemplateValidationError
} from "@/services/template.service";
import { UsageLimitExceededError } from "@/services/usage.service";
import { userService } from "@/services/user.service";
import type {
  CreateGenerationFromTemplateInput,
  CreateGenerationFromTemplateResult
} from "@/types/template";

const createGenerationFromTemplateSchema = z.object({
  templateId: z.string().trim().min(1),
  values: z.record(z.string().trim().max(10_000))
});

export async function createGenerationFromTemplateAction(
  input: CreateGenerationFromTemplateInput
) {
  try {
    const parsedInput = createGenerationFromTemplateSchema.parse(input);
    const user = await userService.getCurrentUser();
    const template = await templateService.getTemplateById(parsedInput.templateId);

    if (template.isPremium && !canUsePremiumTemplate(user.plan)) {
      return createErrorResult(
        "Premium template requires a paid plan.",
        "PREMIUM_REQUIRED"
      );
    }

    const inputSnapshot = buildPromptFromTemplateValues(
      template.prompt,
      parsedInput.values,
      template.fields
    );
    const generation = await generationService.createPendingTemplateGeneration({
      userId: user.id,
      plan: user.plan,
      templateId: template.id,
      input: inputSnapshot
    });

    return createSuccessResult<CreateGenerationFromTemplateResult>({
      generationId: generation.id
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof z.ZodError) {
      return createErrorResult("Invalid template generation input.", "VALIDATION_ERROR");
    }

    if (error instanceof TemplateNotFoundError) {
      return createErrorResult("Template not found.", "NOT_FOUND");
    }

    if (error instanceof TemplateValidationError) {
      return createErrorResult(error.message, "VALIDATION_ERROR");
    }

    if (error instanceof UsageLimitExceededError) {
      return createErrorResult("Usage limit exceeded.", "USAGE_LIMIT_EXCEEDED");
    }

    throw error;
  }
}

export async function getActiveTemplatesAction() {
  try {
    const templates = await templateService.listActiveTemplates();

    return createSuccessResult(templates);
  } catch {
    return createErrorResult("Failed to load active templates.");
  }
}
