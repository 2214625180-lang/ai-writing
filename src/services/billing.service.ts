import { prisma } from "@/lib/prisma";

export const billingService = {
  async getSubscriptionByUserId(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
};
