import "server-only";

import { GenerationStatus, type Plan, type Template } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { usageService } from "@/services/usage.service";
import { userService } from "@/services/user.service";
import type {
  GenerationHistoryResult,
  GetGenerationHistoryParams
} from "@/types/generation";

const DEFAULT_GENERATION_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

export interface CreatePendingGenerationParams {
  userId: string;
  plan: Plan;
  input: string;
  templateId?: string;
  model?: string;
}

export interface CreatePendingTemplateGenerationParams {
  userId: string;
  plan: Plan;
  templateId: string;
  input: string;
}

export type GenerationTemplateAccessSnapshot = Pick<
  Template,
  "id" | "isActive" | "isPremium" | "prompt"
>;

export class GenerationNotFoundError extends Error {
  constructor() {
    super("Generation not found.");
    this.name = "GenerationNotFoundError";
  }
}

export class GenerationForbiddenError extends Error {
  constructor() {
    super("Forbidden.");
    this.name = "GenerationForbiddenError";
  }
}

export class GenerationPremiumRequiredError extends Error {
  constructor() {
    super("Premium template requires a paid plan.");
    this.name = "GenerationPremiumRequiredError";
  }
}

export interface RerunnableGeneration {
  id: string;
  userId: string;
  templateId: string | null;
  input: string;
  model: string;
}

export function canUsePremiumTemplate(plan: Plan): boolean {
  return plan === "PRO" || plan === "TEAM";
}

function normalizePagination(params: GetGenerationHistoryParams) {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize ?? 20)));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize
  };
}

function createPendingGenerationWithUsageReservation(
  params: CreatePendingGenerationParams
) {
  return prisma.$transaction(async (tx) => {
    const generation = await tx.generation.create({
      data: {
        userId: params.userId,
        templateId: params.templateId,
        input: params.input,
        model: params.model ?? DEFAULT_GENERATION_MODEL,
        status: GenerationStatus.PENDING
      },
      select: {
        id: true
      }
    });

    await usageService.reserveGenerationUsage({
      tx,
      userId: params.userId,
      generationId: generation.id,
      plan: params.plan
    });

    return generation;
  });
}

export const generationService = {
  async listRecentByUser(userId: string, limit = 5) {
    return prisma.generation.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
  },

  async getGenerationHistory(
    userId: string,
    params: GetGenerationHistoryParams = {}
  ): Promise<GenerationHistoryResult> {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.generation.findMany({
        where: {
          userId
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: pageSize,
        select: {
          id: true,
          input: true,
          output: true,
          model: true,
          status: true,
          totalTokens: true,
          createdAt: true
        }
      }),
      prisma.generation.count({
        where: {
          userId
        }
      })
    ]);

    return {
      items,
      total,
      page,
      pageSize
    };
  },

  async getGenerationOwnerSnapshot(generationId: string) {
    return prisma.generation.findUnique({
      where: {
        id: generationId
      },
      select: {
        id: true,
        userId: true
      }
    });
  },

  async getGenerationForRerun(generationId: string) {
    return prisma.generation.findUnique({
      where: {
        id: generationId
      },
      select: {
        id: true,
        userId: true,
        templateId: true,
        input: true,
        model: true,
        template: {
          select: {
            id: true,
            isActive: true,
            isPremium: true
          }
        }
      }
    });
  },

  async getRerunnableGeneration(params: {
    generationId: string;
    userId: string;
    userPlan: Plan;
  }): Promise<RerunnableGeneration> {
    const generation = await this.getGenerationForRerun(params.generationId);

    if (!generation) {
      throw new GenerationNotFoundError();
    }

    if (generation.userId !== params.userId) {
      throw new GenerationForbiddenError();
    }

    if (generation.templateId) {
      if (!generation.template?.isActive) {
        throw new GenerationNotFoundError();
      }

      if (
        generation.template.isPremium &&
        !canUsePremiumTemplate(params.userPlan)
      ) {
        throw new GenerationPremiumRequiredError();
      }
    }

    return generation;
  },

  async getTemplateAccessSnapshot(
    templateId: string
  ): Promise<GenerationTemplateAccessSnapshot | null> {
    return prisma.template.findUnique({
      where: {
        id: templateId
      },
      select: {
        id: true,
        isActive: true,
        isPremium: true,
        prompt: true
      }
    });
  },

  async getGenerationForStream(generationId: string) {
    return prisma.generation.findUnique({
      where: {
        id: generationId
      },
      include: {
        template: {
          select: {
            id: true,
            prompt: true,
            isActive: true
          }
        }
      }
    });
  },

  async createPendingGeneration(params: CreatePendingGenerationParams) {
    return createPendingGenerationWithUsageReservation(params);
  },

  async createPendingTemplateGeneration(
    params: CreatePendingTemplateGenerationParams
  ) {
    return createPendingGenerationWithUsageReservation({
      userId: params.userId,
      plan: params.plan,
      templateId: params.templateId,
      input: params.input
    });
  },

  async markGenerationStreaming(generationId: string) {
    return prisma.generation.update({
      where: {
        id: generationId
      },
      data: {
        status: GenerationStatus.STREAMING,
        errorMessage: null
      }
    });
  },

  async markGenerationCompleted(params: {
    generationId: string;
    output: string;
    promptTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  }) {
    return prisma.generation.update({
      where: {
        id: params.generationId
      },
      data: {
        output: params.output,
        promptTokens: params.promptTokens,
        outputTokens: params.outputTokens,
        totalTokens: params.totalTokens,
        status: GenerationStatus.COMPLETED,
        errorMessage: null
      }
    });
  },

  async markGenerationFailed(params: {
    generationId: string;
    errorMessage: string;
  }) {
    return prisma.generation.update({
      where: {
        id: params.generationId
      },
      data: {
        status: GenerationStatus.FAILED,
        errorMessage: params.errorMessage
      }
    });
  },

  async deleteGeneration(generationId: string) {
    return prisma.generation.delete({
      where: {
        id: generationId
      },
      select: {
        id: true
      }
    });
  }
};

export async function getGenerationHistory(
  params: GetGenerationHistoryParams = {}
): Promise<GenerationHistoryResult> {
  const user = await userService.getCurrentUser();

  return generationService.getGenerationHistory(user.id, params);
}
