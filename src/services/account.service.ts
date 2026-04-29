import "server-only";

import { SubscriptionStatus, type Plan } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { usageService } from "@/services/usage.service";
import { userService } from "@/services/user.service";

export interface AccountInfo {
  user: {
    email: string;
    name: string | null;
    imageUrl: string | null;
  };
  subscription: {
    plan: Plan;
    status: SubscriptionStatus | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    used: number;
    limit: number;
    remaining: number;
  };
}

const PRIORITY_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.INCOMPLETE
];

async function getCurrentOrLatestSubscription(userId: string) {
  const prioritySubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: PRIORITY_SUBSCRIPTION_STATUSES
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    select: {
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true
    }
  });

  if (prioritySubscription) {
    return prioritySubscription;
  }

  return prisma.subscription.findFirst({
    where: {
      userId
    },
    orderBy: {
      updatedAt: "desc"
    },
    select: {
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true
    }
  });
}

export async function getAccountInfo(): Promise<AccountInfo> {
  const currentUser = await userService.getCurrentUser();
  const [subscription, usage] = await Promise.all([
    getCurrentOrLatestSubscription(currentUser.id),
    usageService.getCurrentUsage()
  ]);

  return {
    user: {
      email: currentUser.email,
      name: currentUser.name,
      imageUrl: currentUser.imageUrl
    },
    subscription: {
      plan: currentUser.plan,
      status: subscription?.status ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false
    },
    usage: {
      used: usage.used,
      limit: usage.limit,
      remaining: usage.remaining
    }
  };
}
