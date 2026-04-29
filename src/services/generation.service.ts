import { prisma } from "@/lib/prisma";

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
  }
};
