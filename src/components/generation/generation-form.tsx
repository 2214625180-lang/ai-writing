"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  Loader2,
  SendHorizonal,
  Square
} from "lucide-react";

import { createDocumentAction } from "@/actions/documents";
import { createGenerationAction } from "@/actions/generation";
import type { CreateGenerationInput } from "@/types/generation";

interface GenerationFormState {
  input: string;
  type: string;
  tone: string;
  language: string;
  audience: string;
  requirements: string;
}

interface GenerationFormProps {
  initialGenerationId?: string;
}

const initialFormState: GenerationFormState = {
  input: "",
  type: "",
  tone: "",
  language: "中文",
  audience: "",
  requirements: ""
};

function toGenerationInput(formState: GenerationFormState): CreateGenerationInput {
  return {
    input: formState.input,
    type: formState.type || undefined,
    tone: formState.tone || undefined,
    language: formState.language || undefined,
    audience: formState.audience || undefined,
    requirements: formState.requirements || undefined
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function readResponseError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    return payload?.error || "生成失败，请稍后重试。";
  }

  const text = await response.text().catch(() => "");

  return text || "生成失败，请稍后重试。";
}

async function readStream(
  response: Response,
  signal: AbortSignal,
  onChunk: (chunk: string) => void
) {
  if (!response.body) {
    throw new Error("当前浏览器不支持流式读取。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    if (signal.aborted) {
      throw new DOMException("Generation was aborted.", "AbortError");
    }

    const { done, value } = await reader.read();

    if (done) {
      const remainingText = decoder.decode();

      if (remainingText) {
        onChunk(remainingText);
      }

      break;
    }

    onChunk(decoder.decode(value, { stream: true }));
  }
}

export function GenerationForm({ initialGenerationId }: GenerationFormProps) {
  const [formState, setFormState] = useState<GenerationFormState>(initialFormState);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(
    initialGenerationId ?? null
  );
  const [output, setOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoStartedGenerationIdRef = useRef<string | null>(null);

  function updateField<Key extends keyof GenerationFormState>(
    key: Key,
    value: GenerationFormState[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function stopGeneration() {
    abortControllerRef.current?.abort();
    setErrorMessage("已停止生成。");
    setIsGenerating(false);
  }

  function createDocumentTitle(): string {
    const sourceTitle = formState.input.trim() || output.trim();
    const normalizedTitle = sourceTitle.replace(/\s+/g, " ").slice(0, 80);

    return normalizedTitle || "AI 生成文档";
  }

  async function streamGeneration(generationId: string) {
    setErrorMessage(null);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);
    setOutput("");
    setActiveGenerationId(generationId);
    setIsGenerating(true);

    const abortController = new AbortController();
    let accumulatedOutput = "";

    abortControllerRef.current = abortController;

    try {
      const response = await fetch(
        `/api/generate/stream?generationId=${generationId}`,
        {
          signal: abortController.signal
        }
      );

      if (!response.ok) {
        setErrorMessage(await readResponseError(response));
        return;
      }

      await readStream(response, abortController.signal, (chunk) => {
        accumulatedOutput += chunk;
        setOutput(accumulatedOutput);
      });

      if (!accumulatedOutput.trim()) {
        setErrorMessage("AI 没有返回内容，请检查模型配置后重试。");
      }
    } catch (error) {
      if (isAbortError(error)) {
        setErrorMessage("已停止生成。");
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "生成失败，请稍后重试。");
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    setErrorMessage(null);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);
    setOutput("");
    setActiveGenerationId(null);
    setIsGenerating(true);

    try {
      const actionResult = await createGenerationAction(toGenerationInput(formState));

      if (!actionResult.success) {
        setErrorMessage(actionResult.error);
        return;
      }

      await streamGeneration(actionResult.data.generationId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    if (!initialGenerationId) {
      return;
    }

    if (autoStartedGenerationIdRef.current === initialGenerationId) {
      return;
    }

    autoStartedGenerationIdRef.current = initialGenerationId;
    void streamGeneration(initialGenerationId);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [initialGenerationId]);

  async function handleSaveAsDocument() {
    if (!output.trim() || !activeGenerationId) {
      setSaveErrorMessage("没有可保存的生成内容。");
      return;
    }

    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);
    setIsSavingDocument(true);

    try {
      const result = await createDocumentAction({
        title: createDocumentTitle(),
        content: output,
        generationId: activeGenerationId
      });

      if (!result.success) {
        setSaveErrorMessage(result.error);
        return;
      }

      setSaveSuccessMessage(`已保存为文档：${result.data.title}`);
    } catch (error) {
      setSaveErrorMessage(
        error instanceof Error ? error.message : "保存文档失败，请稍后重试。"
      );
    } finally {
      setIsSavingDocument(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
      >
        <div>
          <label htmlFor="input" className="text-sm font-medium text-slate-900">
            写作需求
          </label>
          <textarea
            id="input"
            value={formState.input}
            onChange={(event) => updateField("input", event.target.value)}
            required
            minLength={1}
            maxLength={10_000}
            rows={8}
            placeholder="例如：写一篇介绍 AI 写作工具的产品博客，强调效率、质量和团队协作。"
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="text-sm font-medium text-slate-900">
              写作类型
            </label>
            <input
              id="type"
              value={formState.type}
              onChange={(event) => updateField("type", event.target.value)}
              placeholder="博客 / SEO / 广告文案"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <div>
            <label htmlFor="tone" className="text-sm font-medium text-slate-900">
              语气
            </label>
            <input
              id="tone"
              value={formState.tone}
              onChange={(event) => updateField("tone", event.target.value)}
              placeholder="专业 / 轻松 / 有说服力"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <div>
            <label htmlFor="language" className="text-sm font-medium text-slate-900">
              输出语言
            </label>
            <input
              id="language"
              value={formState.language}
              onChange={(event) => updateField("language", event.target.value)}
              placeholder="中文"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <div>
            <label htmlFor="audience" className="text-sm font-medium text-slate-900">
              目标读者
            </label>
            <input
              id="audience"
              value={formState.audience}
              onChange={(event) => updateField("audience", event.target.value)}
              placeholder="创业者 / 市场团队 / 开发者"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="requirements" className="text-sm font-medium text-slate-900">
            额外要求
          </label>
          <textarea
            id="requirements"
            value={formState.requirements}
            onChange={(event) => updateField("requirements", event.target.value)}
            rows={4}
            placeholder="例如：控制在 800 字以内，包含小标题，避免夸张承诺。"
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
          />
        </div>

        {errorMessage ? (
          <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            type="submit"
            disabled={isGenerating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中
              </>
            ) : (
              <>
                <SendHorizonal className="h-4 w-4" />
                开始生成
              </>
            )}
          </button>

          {isGenerating ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Square className="h-4 w-4" />
              停止
            </button>
          ) : null}
        </div>
      </form>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">生成结果</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isGenerating ? "内容正在实时返回" : "生成完成后会保留在这里"}
            </p>
          </div>
          {isGenerating ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              生成中
            </span>
          ) : null}
        </div>

        {output.trim() && !isGenerating ? (
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">保存生成结果</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                将当前 AI 输出保存到文档库，后续可在文档详情中编辑。
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveAsDocument}
              disabled={isSavingDocument}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingDocument ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中
                </>
              ) : (
                <>
                  <FilePlus2 className="h-4 w-4" />
                  保存为文档
                </>
              )}
            </button>
          </div>
        ) : null}

        {saveErrorMessage ? (
          <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{saveErrorMessage}</span>
          </div>
        ) : null}

        {saveSuccessMessage ? (
          <div className="mt-4 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        ) : null}

        <div className="mt-5 min-h-[420px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800">
          {output || (
            <span className="text-slate-400">
              还没有生成内容。填写左侧表单后点击“开始生成”。
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
