"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { createPaymentElementSubscriptionAction } from "@/actions/billing";
import type { CheckoutPlan } from "@/types/billing";

interface CheckoutButtonProps {
  plan: CheckoutPlan;
  disabled?: boolean;
}

interface PaymentElementFormProps {
  plan: CheckoutPlan;
}

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function getElementsOptions(clientSecret: string): StripeElementsOptions {
  return {
    clientSecret,
    locale: "zh",
    appearance: {
      theme: "stripe",
      variables: {
        borderRadius: "14px",
        colorPrimary: "#0f172a",
        colorText: "#0f172a",
        colorTextSecondary: "#64748b",
        fontFamily: "ui-sans-serif, system-ui, sans-serif"
      }
    }
  };
}

function PaymentElementForm({ plan }: PaymentElementFormProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage("Stripe Payment Element is still loading.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/billing?payment=success&plan=${plan}`
      },
      redirect: "if_required"
    });

    if (result.error) {
      setErrorMessage(result.error.message ?? "Payment confirmation failed.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("支付已提交，订阅状态会通过 Stripe Webhook 同步。");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "accordion",
          paymentMethodOrder: ["alipay", "card", "wechat_pay"]
        }}
      />

      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            确认支付中
          </>
        ) : (
          `确认订阅 ${plan}`
        )}
      </button>

      {errorMessage ? (
        <div className="flex gap-2 text-xs leading-5 text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex gap-2 text-xs leading-5 text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}
    </form>
  );
}

export function CheckoutButton({ plan, disabled = false }: CheckoutButtonProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreatePaymentElement() {
    if (!stripePublishableKey || !stripePromise) {
      setErrorMessage(
        "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable."
      );
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    setClientSecret(null);

    const result = await createPaymentElementSubscriptionAction({
      plan
    });

    if (!result.success) {
      setErrorMessage(result.error);
      setIsCreating(false);
      return;
    }

    setClientSecret(result.data.clientSecret);
    setIsCreating(false);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleCreatePaymentElement}
        disabled={disabled || isCreating}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            创建支付
          </>
        ) : (
          `升级到 ${plan}`
        )}
      </button>

      {errorMessage ? (
        <div className="flex gap-2 text-xs leading-5 text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {clientSecret && stripePromise ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs leading-5 text-slate-500">
            支付宝、微信支付、银行卡等方式由 Stripe 根据账户启用状态、币种和订阅兼容性动态展示。
          </p>
          <Elements
            stripe={stripePromise}
            options={getElementsOptions(clientSecret)}
          >
            <PaymentElementForm plan={plan} />
          </Elements>
        </div>
      ) : null}
    </div>
  );
}
