import { FileClock } from "lucide-react";

import { DeleteGenerationButton } from "@/components/history/delete-generation-button";
import { RerunGenerationButton } from "@/components/history/rerun-generation-button";
import type {
  GenerationHistoryItem,
  GenerationHistoryResult,
  GenerationStatus
} from "@/types/generation";

const statusLabels: Record<GenerationStatus, string> = {
  PENDING: "等待中",
  STREAMING: "生成中",
  COMPLETED: "已完成",
  FAILED: "失败"
};

const statusClasses: Record<GenerationStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  STREAMING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700"
};

interface GenerationHistoryListProps {
  history: GenerationHistoryResult;
}

function createSummary(value: string | null, fallback: string): string {
  if (!value?.trim()) {
    return fallback;
  }

  return value.trim().length > 160 ? `${value.trim().slice(0, 160)}...` : value.trim();
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function GenerationHistoryCard({ item }: { item: GenerationHistoryItem }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[item.status]}`}
            >
              {statusLabels[item.status]}
            </span>
            <span className="text-xs text-slate-500">{item.model}</span>
            <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
          </div>

          <h2 className="mt-4 text-sm font-semibold text-slate-950">输入摘要</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {createSummary(item.input, "无输入内容")}
          </p>

          <h3 className="mt-4 text-sm font-semibold text-slate-950">输出摘要</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {createSummary(item.output, "暂无输出内容")}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-xs text-slate-500">Tokens</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {item.totalTokens ?? 0}
            </p>
          </div>
          <RerunGenerationButton generationId={item.id} />
          <DeleteGenerationButton generationId={item.id} />
        </div>
      </div>
    </article>
  );
}

export function GenerationHistoryList({ history }: GenerationHistoryListProps) {
  if (history.items.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <FileClock className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">暂无生成历史</h2>
        <p className="mt-2 text-sm text-slate-500">
          完成一次 AI 写作后，生成记录会显示在这里。
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          共 {history.total} 条记录，当前显示第 {history.page} 页
        </p>
        <p className="text-sm text-slate-500">每页 {history.pageSize} 条</p>
      </div>

      <div className="space-y-4">
        {history.items.map((item) => (
          <GenerationHistoryCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
