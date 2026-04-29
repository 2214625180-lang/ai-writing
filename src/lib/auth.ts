import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CurrentUserProfile {
  clerkUserId: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
}

export async function requireAuth(): Promise<{ clerkUserId: string }> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized request. Missing authenticated user.");
  }

  return { clerkUserId: userId };
}

export async function requireDatabaseUserId(): Promise<string> {
  const { clerkUserId } = await requireAuth();

  const databaseUser = await prisma.user.findUnique({
    where: {
      clerkUserId
    },
    select: {
      id: true
    }
  });

  if (!databaseUser) {
    throw new Error("Authenticated user does not exist in the database.");
  }

  return databaseUser.id;
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  return {
    clerkUserId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    fullName:
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.username ||
      "Anonymous User",
    avatarUrl: user.imageUrl
  };
}
