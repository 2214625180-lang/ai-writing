import { prisma } from "@/lib/prisma";

export const userService = {
  async ensureUser(params: {
    clerkUserId: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  }) {
    return prisma.user.upsert({
      where: {
        clerkUserId: params.clerkUserId
      },
      create: {
        clerkUserId: params.clerkUserId,
        email: params.email,
        fullName: params.fullName,
        avatarUrl: params.avatarUrl
      },
      update: {
        email: params.email,
        fullName: params.fullName,
        avatarUrl: params.avatarUrl
      }
    });
  },

  async getByClerkUserId(clerkUserId: string) {
    return prisma.user.findUnique({
      where: {
        clerkUserId
      }
    });
  }
};
