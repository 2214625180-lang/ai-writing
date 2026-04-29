import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

export class AuthError extends Error {
  readonly code: "UNAUTHORIZED";

  constructor(message = "Authentication is required to access this resource.") {
    super(message);
    this.name = "AuthError";
    this.code = "UNAUTHORIZED";
  }
}

export interface AuthContext {
  clerkUserId: string;
}

export interface AuthenticatedClerkUserProfile {
  clerkUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

export async function requireAuth(): Promise<AuthContext> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError();
  }

  return {
    clerkUserId: userId
  };
}

export async function getAuthenticatedClerkUserProfile(): Promise<AuthenticatedClerkUserProfile> {
  const { clerkUserId } = await requireAuth();
  const user = await currentUser();

  if (!user) {
    throw new AuthError("Authenticated Clerk user could not be loaded.");
  }

  const primaryEmailAddress = user.primaryEmailAddress?.emailAddress?.trim();

  if (!primaryEmailAddress) {
    throw new Error("Authenticated Clerk user is missing a primary email address.");
  }

  const normalizedName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    null;

  return {
    clerkUserId,
    email: primaryEmailAddress,
    name: normalizedName,
    imageUrl: user.imageUrl ?? null
  };
}
