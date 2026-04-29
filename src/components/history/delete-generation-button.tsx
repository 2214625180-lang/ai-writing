"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteGenerationAction } from "@/actions/generation";

interface DeleteGenerationButtonProps {
  generationId: string;
}

export function DeleteGenerationButton({
  generationId
}: DeleteGenerationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleDelete() {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await deleteGenerationAction(generationId);

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? "删除中" : "删除"}
      </button>
      {errorMessage ? (
        <p className="max-w-48 text-right text-xs leading-5 text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
