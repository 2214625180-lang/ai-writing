"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";

import { createDocumentAction } from "@/actions/documents";

interface CreateDocumentFormState {
  title: string;
  content: string;
}

const initialFormState: CreateDocumentFormState = {
  title: "",
  content: ""
};

export function CreateDocumentForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<CreateDocumentFormState>(
    initialFormState
  );

  function updateField<Key extends keyof CreateDocumentFormState>(
    key: Key,
    value: CreateDocumentFormState[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function closeForm() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await createDocumentAction({
        title: formState.title,
        content: formState.content
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      setFormState(initialFormState);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "创建文档失败，请稍后重试。"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        新建文档
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">新建文档</h2>
          <p className="mt-1 text-sm text-slate-500">
            先保存标题和正文，后续会补充富文本编辑和 AI 结果导入。
          </p>
        </div>
        <button
          type="button"
          onClick={closeForm}
          disabled={isSubmitting}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="关闭新建文档表单"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        <div>
          <label htmlFor="document-title" className="text-sm font-medium text-slate-900">
            标题
          </label>
          <input
            id="document-title"
            value={formState.title}
            onChange={(event) => updateField("title", event.target.value)}
            required
            maxLength={100}
            placeholder="例如：产品发布博客草稿"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
          />
        </div>

        <div>
          <label htmlFor="document-content" className="text-sm font-medium text-slate-900">
            正文
          </label>
          <textarea
            id="document-content"
            value={formState.content}
            onChange={(event) => updateField("content", event.target.value)}
            required
            maxLength={50_000}
            rows={7}
            placeholder="输入文档正文内容。"
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={closeForm}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              创建中
            </>
          ) : (
            "创建文档"
          )}
        </button>
      </div>
    </form>
  );
}
