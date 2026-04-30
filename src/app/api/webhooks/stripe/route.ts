import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";
import { billingService } from "@/services/billing.service";

export const runtime = "nodejs";

function getStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
  }

  return webhookSecret;
}

function createWebhookErrorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      error: message
    },
    {
      status
    }
  );
}

function constructStripeEvent(params: {
  rawBody: string;
  signature: string;
}): Stripe.Event {
  return stripe.webhooks.constructEvent(
    params.rawBody,
    params.signature,
    getStripeWebhookSecret()
  );
}

async function handleStripeEvent(event: Stripe.Event) {
  logger.info({
    event: "stripe_webhook_received",
    message: "Received Stripe webhook event.",
    context: {
      stripeEventId: event.id,
      stripeEventType: event.type
    }
  });

  switch (event.type) {
    case "checkout.session.completed":
      await billingService.handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await billingService.syncSubscriptionFromStripe(
        event.data.object as Stripe.Subscription
      );
      break;

    case "customer.subscription.deleted":
      await billingService.downgradeUserForDeletedSubscription(
        event.data.object as Stripe.Subscription
      );
      break;

    case "invoice.payment_succeeded":
      await billingService.confirmInvoiceSubscription(
        event.data.object as Stripe.Invoice
      );
      break;

    case "invoice.payment_failed":
      await billingService.markInvoiceSubscriptionPastDue(
        event.data.object as Stripe.Invoice
      );
      break;

    default:
      break;
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    logger.warn({
      event: "stripe_webhook_signature_missing",
      message: "Stripe webhook request is missing signature header."
    });

    return createWebhookErrorResponse("Missing Stripe signature.");
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();

    event = constructStripeEvent({
      rawBody,
      signature
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid Stripe webhook signature.";

    logger.error({
      event: "stripe_webhook_signature_verification_failed",
      message: "Failed to verify Stripe webhook signature.",
      error
    });

    return createWebhookErrorResponse(message);
  }

  try {
    await handleStripeEvent(event);

    logger.info({
      event: "stripe_webhook_processed",
      message: "Processed Stripe webhook event.",
      context: {
        stripeEventId: event.id,
        stripeEventType: event.type
      }
    });

    return NextResponse.json({
      received: true
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process Stripe webhook.";

    logger.error({
      event: "stripe_webhook_processing_failed",
      message: "Failed to process Stripe webhook event.",
      context: {
        stripeEventId: event.id,
        stripeEventType: event.type
      },
      error
    });

    return createWebhookErrorResponse(message, 500);
  }
}
