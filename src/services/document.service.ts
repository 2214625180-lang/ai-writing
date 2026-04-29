import { prisma } from "@/lib/prisma";

export const documentService = {
  async listRecentByUser(userId: string, limit = 5) {
    return prisma.document.findMany({
      where: {
        userId
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: limit
    });
  }
};
