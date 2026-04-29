import { prisma } from "@/lib/prisma";

export const templateService = {
  async listActiveTemplates(limit = 6) {
    return prisma.template.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        {
          isSystem: "desc"
        },
        {
          createdAt: "desc"
        }
      ],
      take: limit
    });
  }
};
