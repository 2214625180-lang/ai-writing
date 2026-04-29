import { prisma } from "@/lib/prisma";

export const usageService = {
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
          tokensUsed: true
        }
      })
    ]);

    return {
      generationCount,
      tokensUsed: tokenUsage._sum.tokensUsed ?? 0
    };
  }
};
