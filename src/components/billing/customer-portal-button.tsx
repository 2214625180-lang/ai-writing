"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";

import { createCustomerPortalAction } from "@/actions/billing";

export function CustomerPortalButton() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleOpenPortal() {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await createCustomerPortalAction();

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
        onClick={handleOpenPortal}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            打开中
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            管理订阅
          </>
        )}
      </button>

      {errorMessage ? (
        <div className="flex max-w-md gap-2 text-xs leading-5 text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
