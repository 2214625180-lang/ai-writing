import "server-only";

import { Plan, Prisma, type User } from "@prisma/client";

import { getAuthenticatedClerkUserProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CurrentUser {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  stripeCustomerId: string | null;
  plan: Plan;
}

export class UserEmailConflictError extends Error {
  constructor() {
    super("A different Clerk user already owns this email address.");
    this.name = "UserEmailConflictError";
  }
}

async function findUserByClerkUserId(clerkUserId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: {
      clerkUserId
    }
  });
}

async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: {
      email
    }
  });
}

async function createUserFromClerkProfile(params: {
  clerkUserId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  imageUrl: string | null;
}): Promise<User> {
  return prisma.user.create({
    data: {
      clerkUserId: params.clerkUserId,
      email: params.email,
      name: params.name,
      imageVersion: 1,
      imageUrl: params.imageUrl,
      plan: Plan.FREE
    }
  });
}

async function updateUserFromClerkProfile(params: {
  id: string;
  clerkUserId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  imageUrl: string | null;
}): Promise<User> {
  const emailOwner = await findUserByEmail(params.email);

  if (emailOwner && emailOwner.id !== params.id) {
    console.warn("Blocked Clerk email sync because the email is already owned.", {
      currentUserId: params.id,
      currentClerkUserId: params.clerkUserId,
      conflictingUserId: emailOwner.id,
      email: params.email,
      emailVerified: params.emailVerified
    });

    throw new UserEmailConflictError();
  }

  // 先查出旧用户，以便比较 imageUrl
  const oldUser = await prisma.user.findUnique({ where: { id: params.id } });
  const imageVersion = (oldUser && oldUser.imageUrl !== params.imageUrl) 
    ? (oldUser.imageVersion + 1) 
    : (oldUser?.imageVersion ?? 0);
  return prisma.user.update({
    where: {
      id: params.id
    },
    data: {
      clerkUserId: params.clerkUserId,
      email: params.email,
      name: params.name,
      imageUrl: params.imageUrl,
      imageVersion
    }
  });
}

async function createUserIfMissing(params: {
  clerkUserId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  imageUrl: string | null;
}): Promise<User> {
  const existingUser = await findUserByClerkUserId(params.clerkUserId);

  if (existingUser) {
    return existingUser;
  }

  try {
    return await createUserFromClerkProfile(params);
  } catch (error) {
    // Another request may have created the user between the lookup and create.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrentUser = await findUserByClerkUserId(params.clerkUserId);

      if (concurrentUser) {
        return concurrentUser;
      }

      const emailOwner = await findUserByEmail(params.email);

      if (emailOwner) {
        console.warn("Blocked Clerk account creation because email is already owned.", {
          attemptedClerkUserId: params.clerkUserId,
          conflictingUserId: emailOwner.id,
          conflictingClerkUserId: emailOwner.clerkUserId,
          email: params.email,
          emailVerified: params.emailVerified
        });

        throw new UserEmailConflictError();
      }
    }

    throw error;
  }
}

function mapUserToCurrentUser(user: User): CurrentUser {
  const imageUrlWithVersion = user.imageUrl 
    ? `${user.imageUrl}?v=${user.imageVersion}`
    : null;
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    imageUrl: imageUrlWithVersion,
    stripeCustomerId: user.stripeCustomerId,
    plan: user.plan
  };
}

export const userService = {
  async getCurrentUser(): Promise<CurrentUser> {
    const clerkProfile = await getAuthenticatedClerkUserProfile();
    const existingUser = await findUserByClerkUserId(clerkProfile.clerkUserId);

    if (!existingUser) {
      const createdUser = await createUserIfMissing(clerkProfile);

      return mapUserToCurrentUser(createdUser);
    }

    const requiresSync =
      existingUser.clerkUserId !== clerkProfile.clerkUserId ||
      existingUser.email !== clerkProfile.email ||
      existingUser.name !== clerkProfile.name ||
      existingUser.imageUrl !== clerkProfile.imageUrl;

    if (!requiresSync) {
      return mapUserToCurrentUser(existingUser);
    }

    const updatedUser = await updateUserFromClerkProfile({
      id: existingUser.id,
      clerkUserId: clerkProfile.clerkUserId,
      email: clerkProfile.email,
      emailVerified: clerkProfile.emailVerified,
      name: clerkProfile.name,
      imageUrl: clerkProfile.imageUrl
    });

    return mapUserToCurrentUser(updatedUser);
  }
};
