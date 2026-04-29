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

export interface UsageLimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  reason?: "USAGE_LIMIT_EXCEEDED";
}

export interface RecordUsageInput {
  userId: string;
  generationId?: string;
  type: UsageType;
  count?: number;
  tokens?: number;
}

async function getUsageSummaryForUser(params: {
  userId: string;
  plan: Plan;
  period?: string;
}) {
  const period = params.period ?? getCurrentPeriod();
  const usageAggregate = await prisma.usageRecord.aggregate({
    where: {
      userId: params.userId,
      period,
      type: UsageType.GENERATION
    },
    _sum: {
      count: true
    }
  });
  const used = usageAggregate._sum.count ?? 0;
  const limit = getPlanGenerationLimit(params.plan);
  const remaining = Math.max(limit - used, 0);

  return {
    period,
    used,
    limit,
    remaining
  };
}

export const usageService = {
  async recordUsage(params: RecordUsageInput) {
    return prisma.usageRecord.create({
      data: {
        userId: params.userId,
        generationId: params.generationId,
        type: params.type,
        count: params.count ?? 1,
        tokens: params.tokens,
        period: getCurrentPeriod()
      }
    });
  },

  async recordGenerationUsage(params: {
    userId: string;
    generationId: string;
    tokens?: number;
  }) {
    return this.recordUsage({
      userId: params.userId,
      generationId: params.generationId,
      type: UsageType.GENERATION,
      count: 1,
      tokens: params.tokens
    });
  },

  async checkUsageLimit(userId: string): Promise<UsageLimitResult> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        plan: true
      }
    });

    if (!user) {
      return {
        allowed: false,
        used: 0,
        limit: 0,
        remaining: 0,
        reason: "USAGE_LIMIT_EXCEEDED"
      };
    }

    const usageSummary = await getUsageSummaryForUser({
      userId,
      plan: user.plan
    });
    const allowed = usageSummary.used < usageSummary.limit;

    return {
      allowed,
      used: usageSummary.used,
      limit: usageSummary.limit,
      remaining: usageSummary.remaining,
      reason: allowed ? undefined : "USAGE_LIMIT_EXCEEDED"
    };
  },

  async getCurrentUsage(): Promise<CurrentUsage> {
    const currentUser = await userService.getCurrentUser();
    const period = getCurrentPeriod();

    const usageSummary = await getUsageSummaryForUser({
      userId: currentUser.id,
      plan: currentUser.plan,
      period
    });

    return {
      plan: currentUser.plan,
      period: usageSummary.period,
      used: usageSummary.used,
      limit: usageSummary.limit,
      remaining: usageSummary.remaining
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
  },

  async getCurrentUserMonthUsage() {
    const currentUser = await userService.getCurrentUser();

    return this.getCurrentMonthUsage(currentUser.id);
  }
};
