"use server";
import { z } from "zod";
import { createErrorResult, createSuccessResult } from "@/lib/actions";
import { AuthError } from "@/lib/auth";
import { buildWritingPrompt } from "@/lib/prompts";
import {
  canUsePremiumTemplate,
  GenerationForbiddenError,
  GenerationNotFoundError,
  GenerationPremiumRequiredError,
  generationService
} from "@/services/generation.service";
import { UsageLimitExceededError } from "@/services/usage.service";
import { userService } from "@/services/user.service";
import type {
  DeleteGenerationResult,
  CreateGenerationInput,
  CreateGenerationResult,
  RerunGenerationResult
} from "@/types/generation";

const createGenerationSchema = z.object({
  input: z.string().trim().min(1).max(10_000),
  templateId: z.string().trim().min(1).optional(),
  type: z.string().trim().optional(),
  tone: z.string().trim().optional(),
  language: z.string().trim().optional(),
  audience: z.string().trim().optional(),
  requirements: z.string().trim().optional(),
  model: z.string().trim().min(1).optional()
});

const generationIdSchema = z.string().trim().min(1);

function buildGenerationInputSnapshot(input: z.infer<typeof createGenerationSchema>): string {
  const optionalSections = [
    input.type ? `写作类型：${input.type}` : null,
    input.tone ? `语气：${input.tone}` : null,
    input.language ? `输出语言：${input.language}` : null,
    input.audience ? `目标读者：${input.audience}` : null,
    input.requirements ? `额外要求：${input.requirements}` : null
  ].filter(Boolean);

  if (optionalSections.length === 0) {
    return input.input;
  }

  return [`写作需求：${input.input}`, ...optionalSections].join("\n");
}

export async function createGenerationAction(
  input: CreateGenerationInput
) {
  try {
    const parsedInput = createGenerationSchema.parse(input);
    const user = await userService.getCurrentUser();
    let inputSnapshot = buildGenerationInputSnapshot(parsedInput);

    if (parsedInput.templateId) {
      const template = await generationService.getTemplateAccessSnapshot(
        parsedInput.templateId
      );

      if (!template || !template.isActive) {
        return createErrorResult("Template not found.", "NOT_FOUND");
      }

      if (template.isPremium && !canUsePremiumTemplate(user.plan)) {
        return createErrorResult(
          "Premium template requires a paid plan.",
          "PREMIUM_REQUIRED"
        );
      }

      inputSnapshot = buildWritingPrompt({
        input: inputSnapshot,
        templatePrompt: template.prompt
      });
    }

    const generation = await generationService.createPendingGeneration({
      userId: user.id,
      plan: user.plan,
      templateId: parsedInput.templateId,
      input: inputSnapshot,
      model: parsedInput.model
    });

    return createSuccessResult<CreateGenerationResult>({
      generationId: generation.id
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof z.ZodError) {
      return createErrorResult("Invalid generation input.", "VALIDATION_ERROR");
    }

    if (error instanceof UsageLimitExceededError) {
      return createErrorResult("Usage limit exceeded.", "USAGE_LIMIT_EXCEEDED");
    }

    throw error;
  }
}

export async function getRecentGenerationsAction() {
  try {
    const user = await userService.getCurrentUser();
    const generations = await generationService.listRecentByUser(user.id);

    return createSuccessResult(generations);
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    return createErrorResult("Failed to load recent generations.");
  }
}

export async function deleteGenerationAction(generationId: string) {
  try {
    const parsedGenerationId = generationIdSchema.parse(generationId);
    const user = await userService.getCurrentUser();

    const generation = await generationService.getGenerationOwnerSnapshot(
      parsedGenerationId
    );

    if (!generation) {
      return createErrorResult("Generation not found.", "NOT_FOUND");
    }

    if (generation.userId !== user.id) {
      return createErrorResult("Forbidden.", "FORBIDDEN");
    }

    await generationService.deleteGeneration(generation.id);

    return createSuccessResult<DeleteGenerationResult>({
      deleted: true
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof z.ZodError) {
      return createErrorResult("Invalid generation id.", "VALIDATION_ERROR");
    }

    throw error;
  }
}

export async function rerunGenerationAction(generationId: string) {
  try {
    const parsedGenerationId = generationIdSchema.parse(generationId);
    const user = await userService.getCurrentUser();
    const sourceGeneration = await generationService.getRerunnableGeneration({
      generationId: parsedGenerationId,
      userId: user.id,
      userPlan: user.plan
    });

    const generation = await generationService.createPendingGeneration({
      userId: user.id,
      plan: user.plan,
      templateId: sourceGeneration.templateId ?? undefined,
      input: sourceGeneration.input,
      model: sourceGeneration.model
    });

    return createSuccessResult<RerunGenerationResult>({
      generationId: generation.id
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof z.ZodError) {
      return createErrorResult("Invalid generation id.", "VALIDATION_ERROR");
    }

    if (error instanceof GenerationNotFoundError) {
      return createErrorResult("Generation not found.", "NOT_FOUND");
    }

    if (error instanceof GenerationForbiddenError) {
      return createErrorResult("Forbidden.", "FORBIDDEN");
    }

    if (error instanceof GenerationPremiumRequiredError) {
      return createErrorResult(
        "Premium template requires a paid plan.",
        "PREMIUM_REQUIRED"
      );
    }

    if (error instanceof UsageLimitExceededError) {
      return createErrorResult("Usage limit exceeded.", "USAGE_LIMIT_EXCEEDED");
    }

    throw error;
  }
}
