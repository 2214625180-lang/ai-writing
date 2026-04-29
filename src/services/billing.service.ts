import "server-only";

import { Plan, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { CheckoutPlan } from "@/types/billing";

const STRIPE_PRICE_ID_BY_PLAN: Record<CheckoutPlan, string | undefined> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID,
  TEAM: process.env.STRIPE_TEAM_PRICE_ID
};

const PLAN_BY_STRIPE_PRICE_ID = new Map<string, Plan>(
  Object.entries(STRIPE_PRICE_ID_BY_PLAN)
    .filter((entry): entry is [CheckoutPlan, string] => Boolean(entry[1]))
    .map(([plan, priceId]) => [priceId, plan])
);

export class BillingUserNotFoundError extends Error {
  constructor() {
    super("Billing user not found.");
    this.name = "BillingUserNotFoundError";
  }
}

export class StripeCustomerMissingError extends Error {
  constructor() {
    super("Stripe customer is missing.");
    this.name = "StripeCustomerMissingError";
  }
}

export class StripeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeConfigurationError";
  }
}

export class StripeSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeSessionError";
  }
}

interface CurrentBillingUser {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
}

function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!appUrl) {
    throw new StripeConfigurationError(
      "Missing NEXT_PUBLIC_APP_URL environment variable."
    );
  }

  return appUrl.replace(/\/$/, "");
}

function getPriceIdForPlan(plan: CheckoutPlan): string {
  const priceId = STRIPE_PRICE_ID_BY_PLAN[plan]?.trim();

  if (!priceId) {
    throw new StripeConfigurationError(
      `Missing Stripe price id for ${plan} plan.`
    );
  }

  return priceId;
}

function getPlanByPriceId(priceId: string): Plan | null {
  return PLAN_BY_STRIPE_PRICE_ID.get(priceId) ?? null;
}

function getStringId(value: string | { id: string } | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id;
}

function toDateFromUnixSeconds(value: number): Date {
  return new Date(value * 1000);
}

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "incomplete":
      return SubscriptionStatus.INCOMPLETE;
    case "incomplete_expired":
      return SubscriptionStatus.INCOMPLETE_EXPIRED;
    case "unpaid":
      return SubscriptionStatus.PAST_DUE;
    case "paused":
      return SubscriptionStatus.PAST_DUE;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

function getPrimaryPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price.id ?? null;
}

function shouldDowngradeForStatus(status: SubscriptionStatus): boolean {
  return (
    status === SubscriptionStatus.CANCELED ||
    status === SubscriptionStatus.INCOMPLETE_EXPIRED
  );
}

async function getBillingUser(userId: string): Promise<CurrentBillingUser> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      name: true,
      stripeCustomerId: true
    }
  });

  if (!user) {
    throw new BillingUserNotFoundError();
  }

  return user;
}

async function findUserIdForStripeCustomer(params: {
  stripeCustomerId: string;
  fallbackUserId?: string | null;
}): Promise<string | null> {
  if (params.fallbackUserId) {
    const user = await prisma.user.findUnique({
      where: {
        id: params.fallbackUserId
      },
      select: {
        id: true
      }
    });

    if (user) {
      return user.id;
    }
  }

  const user = await prisma.user.findUnique({
    where: {
      stripeCustomerId: params.stripeCustomerId
    },
    select: {
      id: true
    }
  });

  return user?.id ?? null;
}

async function updateUserStripeCustomerId(params: {
  userId: string;
  stripeCustomerId: string;
}) {
  return prisma.user.update({
    where: {
      id: params.userId
    },
    data: {
      stripeCustomerId: params.stripeCustomerId
    },
    select: {
      stripeCustomerId: true
    }
  });
}

async function createStripeCustomer(user: CurrentBillingUser): Promise<string> {
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: {
      userId: user.id,
      clerkUserId: user.clerkUserId
    }
  });

  await updateUserStripeCustomerId({
    userId: user.id,
    stripeCustomerId: customer.id
  });

  return customer.id;
}

async function getOrCreateStripeCustomerId(userId: string): Promise<string> {
  const user = await getBillingUser(userId);

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  return createStripeCustomer(user);
}

function assertCheckoutSessionUrl(
  session: Stripe.Response<Stripe.Checkout.Session>
): string {
  if (!session.url) {
    throw new StripeSessionError("Stripe Checkout Session did not return a URL.");
  }

  return session.url;
}

function assertPortalSessionUrl(
  session: Stripe.Response<Stripe.BillingPortal.Session>
): string {
  if (!session.url) {
    throw new StripeSessionError("Stripe Customer Portal Session did not return a URL.");
  }

  return session.url;
}

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
  },

  async createCheckoutSession(params: {
    userId: string;
    plan: CheckoutPlan;
  }): Promise<{ url: string }> {
    const priceId = getPriceIdForPlan(params.plan);
    const customerId = await getOrCreateStripeCustomerId(params.userId);
    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${appUrl}/billing?checkout=success`,
      cancel_url: `${appUrl}/billing?checkout=cancel`,
      metadata: {
        userId: params.userId,
        plan: params.plan
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          plan: params.plan
        }
      }
    });

    return {
      url: assertCheckoutSessionUrl(session)
    };
  },

  async createCustomerPortalSession(userId: string): Promise<{ url: string }> {
    const user = await getBillingUser(userId);

    if (!user.stripeCustomerId) {
      throw new StripeCustomerMissingError();
    }

    const appUrl = getAppUrl();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/billing`
    });

    return {
      url: assertPortalSessionUrl(session)
    };
  },

  async bindStripeCustomerToUser(params: {
    userId: string;
    stripeCustomerId: string;
  }) {
    return updateUserStripeCustomerId(params);
  },

  async syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
    const stripeCustomerId = getStringId(subscription.customer);

    if (!stripeCustomerId) {
      throw new StripeSessionError("Stripe subscription is missing customer id.");
    }

    const userId = await findUserIdForStripeCustomer({
      stripeCustomerId,
      fallbackUserId: subscription.metadata.userId
    });

    if (!userId) {
      throw new BillingUserNotFoundError();
    }

    const stripePriceId = getPrimaryPriceId(subscription);

    if (!stripePriceId) {
      throw new StripeSessionError("Stripe subscription is missing price id.");
    }

    const status = mapStripeSubscriptionStatus(subscription.status);
    const mappedPlan = getPlanByPriceId(stripePriceId);
    const nextPlan = shouldDowngradeForStatus(status)
      ? Plan.FREE
      : mappedPlan ?? Plan.FREE;

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: userId
        },
        data: {
          stripeCustomerId,
          plan: nextPlan
        }
      }),
      prisma.subscription.upsert({
        where: {
          stripeSubscriptionId: subscription.id
        },
        create: {
          userId,
          stripeSubscriptionId: subscription.id,
          stripePriceId,
          status,
          currentPeriodStart: toDateFromUnixSeconds(
            subscription.current_period_start
          ),
          currentPeriodEnd: toDateFromUnixSeconds(subscription.current_period_end),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        },
        update: {
          userId,
          stripePriceId,
          status,
          currentPeriodStart: toDateFromUnixSeconds(
            subscription.current_period_start
          ),
          currentPeriodEnd: toDateFromUnixSeconds(subscription.current_period_end),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      })
    ]);
  },

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const stripeCustomerId = getStringId(session.customer);
    const stripeSubscriptionId = getStringId(session.subscription);
    const userId = session.metadata?.userId ?? null;

    if (!stripeCustomerId || !stripeSubscriptionId || !userId) {
      throw new StripeSessionError(
        "Checkout session is missing customer, subscription, or user metadata."
      );
    }

    await this.bindStripeCustomerToUser({
      userId,
      stripeCustomerId
    });

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    await this.syncSubscriptionFromStripe(subscription);
  },

  async downgradeUserForDeletedSubscription(subscription: Stripe.Subscription) {
    const stripeCustomerId = getStringId(subscription.customer);

    if (!stripeCustomerId) {
      throw new StripeSessionError("Stripe subscription is missing customer id.");
    }

    const userId = await findUserIdForStripeCustomer({
      stripeCustomerId,
      fallbackUserId: subscription.metadata.userId
    });

    if (!userId) {
      throw new BillingUserNotFoundError();
    }

    const stripePriceId = getPrimaryPriceId(subscription) ?? "";

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: userId
        },
        data: {
          plan: Plan.FREE
        }
      }),
      prisma.subscription.upsert({
        where: {
          stripeSubscriptionId: subscription.id
        },
        create: {
          userId,
          stripeSubscriptionId: subscription.id,
          stripePriceId,
          status: SubscriptionStatus.CANCELED,
          currentPeriodStart: toDateFromUnixSeconds(
            subscription.current_period_start
          ),
          currentPeriodEnd: toDateFromUnixSeconds(subscription.current_period_end),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        },
        update: {
          status: SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      })
    ]);
  },

  async confirmInvoiceSubscription(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = getStringId(invoice.subscription);

    if (!stripeSubscriptionId) {
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    await this.syncSubscriptionFromStripe(subscription);
  },

  async markInvoiceSubscriptionPastDue(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = getStringId(invoice.subscription);

    if (!stripeSubscriptionId) {
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const stripeCustomerId = getStringId(subscription.customer);

    if (!stripeCustomerId) {
      throw new StripeSessionError("Stripe subscription is missing customer id.");
    }

    const userId = await findUserIdForStripeCustomer({
      stripeCustomerId,
      fallbackUserId: subscription.metadata.userId
    });

    if (!userId) {
      throw new BillingUserNotFoundError();
    }

    await this.syncSubscriptionFromStripe(subscription);

    await prisma.subscription.update({
      where: {
        stripeSubscriptionId
      },
      data: {
        status: SubscriptionStatus.PAST_DUE
      }
    });
  }
};
