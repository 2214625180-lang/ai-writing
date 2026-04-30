import "server-only";

import { Plan, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";

import { logger } from "@/lib/logger";
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

const BLOCKING_LOCAL_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE
];

const BLOCKING_STRIPE_SUBSCRIPTION_STATUSES: Stripe.Subscription.Status[] = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused"
];

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
    status === SubscriptionStatus.INCOMPLETE ||
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
  try {
    const customer = await stripe.customers.create(
      {
        email: user.email,
        name: user.name ?? undefined,
        metadata: {
          userId: user.id,
          clerkUserId: user.clerkUserId
        }
      },
      {
        idempotencyKey: `customer:create:${user.id}`
      }
    );

    await updateUserStripeCustomerId({
      userId: user.id,
      stripeCustomerId: customer.id
    });

    logger.info({
      event: "stripe_customer_created",
      message: "Created Stripe customer for local user.",
      context: {
        userId: user.id,
        stripeCustomerId: customer.id
      }
    });

    return customer.id;
  } catch (error) {
    logger.error({
      event: "stripe_customer_create_failed",
      message: "Failed to create Stripe customer.",
      context: {
        userId: user.id
      },
      error
    });

    throw error;
  }
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

function assertSubscriptionPaymentIntentClientSecret(
  subscription: Stripe.Subscription
): string {
  const latestInvoice = subscription.latest_invoice;

  if (!latestInvoice || typeof latestInvoice === "string") {
    throw new StripeSessionError(
      "Stripe subscription did not return an expanded latest invoice."
    );
  }

  const paymentIntent = latestInvoice.payment_intent;

  if (!paymentIntent || typeof paymentIntent === "string") {
    throw new StripeSessionError(
      "Stripe subscription did not return an expanded payment intent."
    );
  }

  if (!paymentIntent.client_secret) {
    throw new StripeSessionError(
      "Stripe payment intent did not return a client secret."
    );
  }

  return paymentIntent.client_secret;
}

function getUpgradeIdempotencyKey(params: {
  mode: "checkout" | "payment-element";
  userId: string;
  plan: CheckoutPlan;
  priceId: string;
}): string {
  return `billing:${params.mode}:${params.userId}:${params.plan}:${params.priceId}`;
}

function isStripeSubscriptionForPrice(
  subscription: Stripe.Subscription,
  priceId: string
): boolean {
  return getPrimaryPriceId(subscription) === priceId;
}

async function assertNoLocalBlockingSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: BLOCKING_LOCAL_SUBSCRIPTION_STATUSES
      }
    },
    select: {
      stripeSubscriptionId: true,
      status: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (subscription) {
    logger.warn({
      event: "stripe_subscription_local_duplicate_blocked",
      message: "Blocked subscription creation because local blocking subscription exists.",
      context: {
        userId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        status: subscription.status
      }
    });

    throw new StripeSessionError(
      `User already has a ${subscription.status.toLowerCase()} subscription. Use the customer portal to manage it.`
    );
  }
}

async function getReusableLocalIncompleteSubscription(params: {
  userId: string;
  priceId: string;
}): Promise<Stripe.Response<Stripe.Subscription> | null> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: params.userId,
      stripePriceId: params.priceId,
      status: SubscriptionStatus.INCOMPLETE
    },
    select: {
      stripeSubscriptionId: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (!subscription) {
    return null;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
    {
      expand: ["latest_invoice.payment_intent"]
    }
  );

  if (
    stripeSubscription.status === "incomplete" &&
    isStripeSubscriptionForPrice(stripeSubscription, params.priceId)
  ) {
    return stripeSubscription;
  }

  return null;
}

async function getCustomerSubscriptions(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
    expand: ["data.latest_invoice.payment_intent"]
  });

  return subscriptions.data;
}

function findRemoteBlockingSubscription(
  subscriptions: Stripe.Subscription[]
): Stripe.Subscription | null {
  return (
    subscriptions.find((subscription) =>
      BLOCKING_STRIPE_SUBSCRIPTION_STATUSES.includes(subscription.status)
    ) ?? null
  );
}

function findReusableRemoteIncompleteSubscription(params: {
  subscriptions: Stripe.Subscription[];
  priceId: string;
}): Stripe.Subscription | null {
  return (
    params.subscriptions.find(
      (subscription) =>
        subscription.status === "incomplete" &&
        isStripeSubscriptionForPrice(subscription, params.priceId)
    ) ?? null
  );
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
    await assertNoLocalBlockingSubscription(params.userId);

    const remoteBlockingSubscription = findRemoteBlockingSubscription(
      await getCustomerSubscriptions(customerId)
    );

    if (remoteBlockingSubscription) {
      await this.syncSubscriptionFromStripe(remoteBlockingSubscription);
      logger.warn({
        event: "stripe_checkout_duplicate_blocked",
        message: "Blocked Checkout Session creation because Stripe has a blocking subscription.",
        context: {
          userId: params.userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: remoteBlockingSubscription.id,
          stripeStatus: remoteBlockingSubscription.status
        }
      });
      throw new StripeSessionError(
        "User already has an active subscription. Use the customer portal to manage it."
      );
    }

    try {
      const session = await stripe.checkout.sessions.create(
        {
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
        },
        {
          idempotencyKey: getUpgradeIdempotencyKey({
            mode: "checkout",
            userId: params.userId,
            plan: params.plan,
            priceId
          })
        }
      );

      logger.info({
        event: "stripe_checkout_session_created",
        message: "Created Stripe Checkout Session.",
        context: {
          userId: params.userId,
          stripeCustomerId: customerId,
          plan: params.plan
        }
      });

      return {
        url: assertCheckoutSessionUrl(session)
      };
    } catch (error) {
      logger.error({
        event: "stripe_checkout_session_create_failed",
        message: "Failed to create Stripe Checkout Session.",
        context: {
          userId: params.userId,
          stripeCustomerId: customerId,
          plan: params.plan
        },
        error
      });

      throw error;
    }
  },

  async createPaymentElementSubscription(params: {
    userId: string;
    plan: CheckoutPlan;
  }): Promise<{ clientSecret: string; subscriptionId: string }> {
    const priceId = getPriceIdForPlan(params.plan);
    const customerId = await getOrCreateStripeCustomerId(params.userId);
    await assertNoLocalBlockingSubscription(params.userId);

    const localIncompleteSubscription =
      await getReusableLocalIncompleteSubscription({
        userId: params.userId,
        priceId
      });

    if (localIncompleteSubscription) {
      logger.info({
        event: "stripe_subscription_local_incomplete_reused",
        message: "Reused local incomplete subscription for Payment Element.",
        context: {
          userId: params.userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: localIncompleteSubscription.id,
          plan: params.plan
        }
      });

      return {
        clientSecret:
          assertSubscriptionPaymentIntentClientSecret(localIncompleteSubscription),
        subscriptionId: localIncompleteSubscription.id
      };
    }

    const customerSubscriptions = await getCustomerSubscriptions(customerId);
    const remoteBlockingSubscription =
      findRemoteBlockingSubscription(customerSubscriptions);

    if (remoteBlockingSubscription) {
      await this.syncSubscriptionFromStripe(remoteBlockingSubscription);
      logger.warn({
        event: "stripe_subscription_duplicate_blocked",
        message: "Blocked Payment Element subscription creation because Stripe has a blocking subscription.",
        context: {
          userId: params.userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: remoteBlockingSubscription.id,
          stripeStatus: remoteBlockingSubscription.status
        }
      });
      throw new StripeSessionError(
        "User already has an active subscription. Use the customer portal to manage it."
      );
    }

    const reusableRemoteIncompleteSubscription =
      findReusableRemoteIncompleteSubscription({
        subscriptions: customerSubscriptions,
        priceId
      });

    if (reusableRemoteIncompleteSubscription) {
      await this.syncSubscriptionFromStripe(reusableRemoteIncompleteSubscription);
      logger.info({
        event: "stripe_subscription_remote_incomplete_reused",
        message: "Reused remote incomplete subscription for Payment Element.",
        context: {
          userId: params.userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: reusableRemoteIncompleteSubscription.id,
          plan: params.plan
        }
      });

      return {
        clientSecret: assertSubscriptionPaymentIntentClientSecret(
          reusableRemoteIncompleteSubscription
        ),
        subscriptionId: reusableRemoteIncompleteSubscription.id
      };
    }

    try {
      const subscription = await stripe.subscriptions.create(
        {
          customer: customerId,
          items: [
            {
              price: priceId
            }
          ],
          payment_behavior: "default_incomplete",
          payment_settings: {
            save_default_payment_method: "on_subscription"
          },
          metadata: {
            userId: params.userId,
            plan: params.plan
          },
          expand: ["latest_invoice.payment_intent"]
        },
        {
          idempotencyKey: getUpgradeIdempotencyKey({
            mode: "payment-element",
            userId: params.userId,
            plan: params.plan,
            priceId
          })
        }
      );

      await this.syncSubscriptionFromStripe(subscription);

      logger.info({
        event: "stripe_subscription_created",
        message: "Created Stripe subscription for Payment Element.",
        context: {
          userId: params.userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripeStatus: subscription.status,
          plan: params.plan
        }
      });

      return {
        clientSecret: assertSubscriptionPaymentIntentClientSecret(subscription),
        subscriptionId: subscription.id
      };
    } catch (error) {
      logger.error({
        event: "stripe_subscription_create_failed",
        message: "Failed to create Stripe subscription for Payment Element.",
        context: {
          userId: params.userId,
          stripeCustomerId: customerId,
          plan: params.plan
        },
        error
      });

      throw error;
    }
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
    try {
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
            currentPeriodEnd: toDateFromUnixSeconds(
              subscription.current_period_end
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          },
          update: {
            userId,
            stripePriceId,
            status,
            currentPeriodStart: toDateFromUnixSeconds(
              subscription.current_period_start
            ),
            currentPeriodEnd: toDateFromUnixSeconds(
              subscription.current_period_end
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        })
      ]);

      logger.info({
        event: "stripe_subscription_synced",
        message: "Synced Stripe subscription into local database.",
        context: {
          userId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          stripeStatus: subscription.status,
          localStatus: status,
          plan: nextPlan
        }
      });
    } catch (error) {
      logger.error({
        event: "stripe_subscription_sync_failed",
        message: "Failed to sync Stripe subscription into local database.",
        context: {
          stripeSubscriptionId: subscription.id,
          stripeStatus: subscription.status,
          fallbackUserId: subscription.metadata.userId ?? null,
          stripeCustomerId: getStringId(subscription.customer)
        },
        error
      });

      throw error;
    }
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
    try {
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
            currentPeriodEnd: toDateFromUnixSeconds(
              subscription.current_period_end
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          },
          update: {
            status: SubscriptionStatus.CANCELED,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        })
      ]);

      logger.info({
        event: "stripe_subscription_deleted_synced",
        message: "Downgraded user after Stripe subscription deletion.",
        context: {
          userId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id
        }
      });
    } catch (error) {
      logger.error({
        event: "stripe_subscription_deleted_sync_failed",
        message: "Failed to sync Stripe subscription deletion.",
        context: {
          stripeSubscriptionId: subscription.id,
          stripeStatus: subscription.status,
          fallbackUserId: subscription.metadata.userId ?? null,
          stripeCustomerId: getStringId(subscription.customer)
        },
        error
      });

      throw error;
    }
  },

  async confirmInvoiceSubscription(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = getStringId(invoice.subscription);

    if (!stripeSubscriptionId) {
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    await this.syncSubscriptionFromStripe(subscription);
    logger.info({
      event: "stripe_invoice_payment_succeeded_synced",
      message: "Synced subscription after successful invoice payment.",
      context: {
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId
      }
    });
  },

  async markInvoiceSubscriptionPastDue(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = getStringId(invoice.subscription);

    if (!stripeSubscriptionId) {
      return;
    }

    try {
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

      logger.warn({
        event: "stripe_invoice_payment_failed_marked_past_due",
        message: "Marked subscription as past due after failed invoice payment.",
        context: {
          userId,
          stripeCustomerId,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId
        }
      });
    } catch (error) {
      logger.error({
        event: "stripe_invoice_payment_failed_sync_failed",
        message: "Failed to mark subscription past due after invoice payment failure.",
        context: {
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId
        },
        error
      });

      throw error;
    }
  }
};
