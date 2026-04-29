"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";

import { rerunGenerationAction } from "@/actions/generation";

interface RerunGenerationButtonProps {
  generationId: string;
}

export function RerunGenerationButton({
  generationId
}: RerunGenerationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleRerun() {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await rerunGenerationAction(generationId);

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      router.push(`/generate?generationId=${result.data.generationId}`);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRerun}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {isPending ? "创建中" : "重新生成"}
      </button>

      {errorMessage ? (
        <div className="flex max-w-56 gap-2 text-right text-xs leading-5 text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
