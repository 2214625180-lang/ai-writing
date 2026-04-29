import { prisma } from "@/lib/prisma";

export const billingService = {
  async getSubscriptionByUserId(userId: string) {
    return prisma.subscription.findUnique({
      where: {
        userId
      }
    });
  }
};
