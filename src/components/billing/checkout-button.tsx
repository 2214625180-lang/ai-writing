"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { createCheckoutSessionAction } from "@/actions/billing";
import type { CheckoutPlan } from "@/types/billing";

interface CheckoutButtonProps {
  plan: CheckoutPlan;
  disabled?: boolean;
}

export function CheckoutButton({ plan, disabled = false }: CheckoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleCheckout() {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await createCheckoutSessionAction({
        plan
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      window.location.href = result.data.url;
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            跳转中
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
    </div>
  );
}
