"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, Loader2, SendHorizonal } from "lucide-react";

import { createGenerationAction } from "@/actions/generation";
import type { CreateGenerationInput } from "@/types/generation";

const defaultModel = "gpt-4.1-mini";

interface GenerationFormState {
  input: string;
  type: string;
  tone: string;
  language: string;
  audience: string;
  requirements: string;
  model: string;
}

const initialFormState: GenerationFormState = {
  input: "",
  type: "",
  tone: "",
  language: "中文",
  audience: "",
  requirements: "",
  model: defaultModel
};

function toGenerationInput(formState: GenerationFormState): CreateGenerationInput {
  return {
    input: formState.input,
    type: formState.type || undefined,
    tone: formState.tone || undefined,
    language: formState.language || undefined,
    audience: formState.audience || undefined,
    requirements: formState.requirements || undefined,
    model: formState.model || defaultModel
  };
}

async function readStream(response: Response, onChunk: (chunk: string) => void) {
  if (!response.body) {
    throw new Error("当前浏览器不支持流式读取。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    onChunk(decoder.decode(value, { stream: true }));
  }
}

export function GenerationForm() {
  const [formState, setFormState] = useState<GenerationFormState>(initialFormState);
  const [output, setOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function updateField<Key extends keyof GenerationFormState>(
    key: Key,
    value: GenerationFormState[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setOutput("");
    setIsGenerating(true);

    try {
      const actionResult = await createGenerationAction(toGenerationInput(formState));

      if (!actionResult.success) {
        setErrorMessage(actionResult.error);
        return;
      }

      const response = await fetch(
        `/api/generate/stream?generationId=${actionResult.data.generationId}`
      );

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        setErrorMessage(errorPayload?.error ?? "生成失败，请稍后重试。");
        return;
      }

      await readStream(response, (chunk) => {
        setOutput((current) => `${current}${chunk}`);
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
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

        <button
          type="submit"
          disabled={isGenerating}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
              Streaming
            </span>
          ) : null}
        </div>

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
