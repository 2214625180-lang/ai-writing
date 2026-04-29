import "server-only";

import { GenerationStatus, type Plan, type Template } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  GenerationHistoryResult,
  GetGenerationHistoryParams
} from "@/types/generation";

const DEFAULT_GENERATION_MODEL = "gpt-4.1-mini";

export interface CreatePendingGenerationParams {
  userId: string;
  input: string;
  templateId?: string;
  model?: string;
}

export type GenerationTemplateAccessSnapshot = Pick<
  Template,
  "id" | "isActive" | "isPremium"
>;

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
        isPremium: true
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
    return prisma.generation.create({
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
