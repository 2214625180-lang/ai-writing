"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Save, Star } from "lucide-react";

import { updateDocumentAction } from "@/actions/documents";
import type { DocumentDetail } from "@/types/document";

interface DocumentEditorProps {
  document: DocumentDetail;
}

interface DocumentEditorState {
  title: string;
  content: string;
  isFavorite: boolean;
}

function getInitialEditorState(document: DocumentDetail): DocumentEditorState {
  return {
    title: document.title,
    content: document.content,
    isFavorite: document.isFavorite
  };
}

export function DocumentEditor({ document }: DocumentEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<DocumentEditorState>(
    getInitialEditorState(document)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function updateField<Key extends keyof DocumentEditorState>(
    key: Key,
    value: DocumentEditorState[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
    setSuccessMessage(null);
  }

  function submitUpdate(nextState: DocumentEditorState) {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await updateDocumentAction({
        id: document.id,
        title: nextState.title,
        content: nextState.content,
        isFavorite: nextState.isFavorite
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      setSuccessMessage("文档已更新。");
      router.refresh();
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitUpdate(formState);
  }

  function toggleFavorite() {
    const nextState = {
      ...formState,
      isFavorite: !formState.isFavorite
    };

    setFormState(nextState);
    submitUpdate(nextState);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <label htmlFor="document-title" className="text-sm font-medium text-slate-500">
              文档标题
            </label>
            <input
              id="document-title"
              value={formState.title}
              onChange={(event) => updateField("title", event.target.value)}
              required
              maxLength={100}
              className="mt-2 w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-2xl font-semibold tracking-tight text-slate-950 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={toggleFavorite}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Star
              className={
                formState.isFavorite
                  ? "h-4 w-4 fill-amber-400 text-amber-500"
                  : "h-4 w-4"
              }
            />
            {formState.isFavorite ? "已收藏" : "收藏"}
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="document-content" className="text-sm font-medium text-slate-500">
            文档内容
          </label>
          <textarea
            id="document-content"
            value={formState.content}
            onChange={(event) => updateField("content", event.target.value)}
            required
            maxLength={50_000}
            rows={20}
            className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400"
          />
        </div>

        {errorMessage ? (
          <div className="mt-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-5 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            最多 100 字标题，正文最多 50000 字。保存后会刷新当前页面数据。
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存修改
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
