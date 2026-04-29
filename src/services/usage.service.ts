import "server-only";

import { UsageType, type Plan } from "@prisma/client";

import { getPlanGenerationLimit } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/usage";
import { userService } from "@/services/user.service";

export interface CurrentUsage {
  plan: Plan;
  period: string;
  used: number;
  limit: number;
  remaining: number;
}

export const usageService = {
  async recordGenerationUsage(params: {
    userId: string;
    generationId: string;
    tokens?: number;
  }) {
    return prisma.usageRecord.create({
      data: {
        userId: params.userId,
        generationId: params.generationId,
        type: UsageType.GENERATION,
        count: 1,
        tokens: params.tokens,
        period: getCurrentPeriod()
      }
    });
  },

  async checkUsageLimit(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        plan: true
      }
    });

    if (!user) {
      return false;
    }

    const period = getCurrentPeriod();
    const usageAggregate = await prisma.usageRecord.aggregate({
      where: {
        userId,
        period,
        type: UsageType.GENERATION
      },
      _sum: {
        count: true
      }
    });

    const used = usageAggregate._sum.count ?? 0;
    const limit = getPlanGenerationLimit(user.plan);

    return used < limit;
  },

  async getCurrentUsage(): Promise<CurrentUsage> {
    const currentUser = await userService.getCurrentUser();
    const period = getCurrentPeriod();

    const usageAggregate = await prisma.usageRecord.aggregate({
      where: {
        userId: currentUser.id,
        period,
        type: UsageType.GENERATION
      },
      _sum: {
        count: true
      }
    });

    const used = usageAggregate._sum.count ?? 0;
    const limit = getPlanGenerationLimit(currentUser.plan);
    const remaining = Math.max(limit - used, 0);

    return {
      plan: currentUser.plan,
      period,
      used,
      limit,
      remaining
    };
  },

  async getCurrentMonthUsage(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [generationCount, tokenUsage] = await Promise.all([
      prisma.generation.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      prisma.generation.aggregate({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          totalTokens: true
        }
      })
    ]);

    return {
      generationCount,
      tokensUsed: tokenUsage._sum.totalTokens ?? 0
    };
  }
};
