"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Trash2 } from "lucide-react";

import { deleteDocumentAction } from "@/actions/documents";

interface DeleteDocumentButtonProps {
  documentId: string;
}

export function DeleteDocumentButton({ documentId }: DeleteDocumentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm("确定要删除这篇文档吗？删除后无法恢复。");

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const result = await deleteDocumentAction(documentId);

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      router.push("/documents");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? "删除中" : "删除文档"}
      </button>

      {errorMessage ? (
        <div className="flex max-w-sm gap-2 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
