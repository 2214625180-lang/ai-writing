import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

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

    return createWebhookErrorResponse(message);
  }

  try {
    await handleStripeEvent(event);

    return NextResponse.json({
      received: true
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process Stripe webhook.";

    return createWebhookErrorResponse(message, 500);
  }
}
