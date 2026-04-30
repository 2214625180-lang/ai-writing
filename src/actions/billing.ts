"use server";

import { z } from "zod";
import Stripe from "stripe";

import { createErrorResult, createSuccessResult } from "@/lib/actions";
import { AuthError } from "@/lib/auth";
import {
  billingService,
  BillingUserNotFoundError,
  StripeConfigurationError,
  StripeCustomerMissingError,
  StripeSessionError
} from "@/services/billing.service";
import { userService } from "@/services/user.service";
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  CreatePaymentElementSubscriptionInput,
  CreatePaymentElementSubscriptionResult,
  CreateCustomerPortalResult
} from "@/types/billing";

const createCheckoutSessionSchema = z.object({
  plan: z.enum(["PRO", "TEAM"])
});

function toStripeErrorMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    return "Stripe secret key is invalid. Please update STRIPE_SECRET_KEY in your environment variables.";
  }

  if (error instanceof Stripe.errors.StripeError) {
    return error.message.replace(/sk_(test|live)_[A-Za-z0-9_*]+/g, "sk_$1_***");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Stripe request failed.";
}

export async function createCheckoutSessionAction(
  input: CreateCheckoutSessionInput
) {
  try {
    const parsedInput = createCheckoutSessionSchema.parse(input);
    const user = await userService.getCurrentUser();
    const session = await billingService.createCheckoutSession({
      userId: user.id,
      plan: parsedInput.plan
    });

    return createSuccessResult<CreateCheckoutSessionResult>(session);
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof z.ZodError) {
      return createErrorResult("Invalid checkout session input.", "VALIDATION_ERROR");
    }

    if (error instanceof BillingUserNotFoundError) {
      return createErrorResult("User not found.", "NOT_FOUND");
    }

    if (
      error instanceof StripeConfigurationError ||
      error instanceof StripeSessionError
    ) {
      return createErrorResult(error.message, "STRIPE_ERROR");
    }

    return createErrorResult(toStripeErrorMessage(error), "STRIPE_ERROR");
  }
}

export async function createPaymentElementSubscriptionAction(
  input: CreatePaymentElementSubscriptionInput
) {
  try {
    const parsedInput = createCheckoutSessionSchema.parse(input);
    const user = await userService.getCurrentUser();
    const subscription = await billingService.createPaymentElementSubscription({
      userId: user.id,
      plan: parsedInput.plan
    });

    return createSuccessResult<CreatePaymentElementSubscriptionResult>(
      subscription
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof z.ZodError) {
      return createErrorResult("Invalid subscription input.", "VALIDATION_ERROR");
    }

    if (error instanceof BillingUserNotFoundError) {
      return createErrorResult("User not found.", "NOT_FOUND");
    }

    if (
      error instanceof StripeConfigurationError ||
      error instanceof StripeSessionError
    ) {
      return createErrorResult(error.message, "STRIPE_ERROR");
    }

    return createErrorResult(toStripeErrorMessage(error), "STRIPE_ERROR");
  }
}

export async function createCustomerPortalAction() {
  try {
    const user = await userService.getCurrentUser();
    const session = await billingService.createCustomerPortalSession(user.id);

    return createSuccessResult<CreateCustomerPortalResult>(session);
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof BillingUserNotFoundError) {
      return createErrorResult("User not found.", "NOT_FOUND");
    }

    if (
      error instanceof StripeCustomerMissingError ||
      error instanceof StripeConfigurationError ||
      error instanceof StripeSessionError
    ) {
      return createErrorResult(error.message, "STRIPE_ERROR");
    }

    return createErrorResult(toStripeErrorMessage(error), "STRIPE_ERROR");
  }
}

export async function getCurrentSubscriptionAction() {
  try {
    const user = await userService.getCurrentUser();
    const subscription = await billingService.getSubscriptionByUserId(user.id);

    return createSuccessResult(subscription);
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    return createErrorResult("Failed to load current subscription.");
  }
}
