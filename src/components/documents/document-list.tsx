import Link from "next/link";
import { FileText, Star } from "lucide-react";

import type { DocumentListItem } from "@/types/document";

interface DocumentListProps {
  documents: DocumentListItem[];
}

function formatUpdatedAt(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <FileText className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-slate-950">还没有文档</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          点击顶部“新建文档”保存第一篇文章、文案或邮件草稿。
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {documents.map((document) => (
        <Link
          key={document.id}
          href={`/documents/${document.id}`}
          className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-slate-950">
                  {document.title}
                </h2>
                {document.isFavorite ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    收藏
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {document.contentPreview || "暂无正文预览。"}
              </p>
            </div>

            <div className="hidden shrink-0 rounded-2xl bg-slate-50 px-3 py-2 text-right sm:block">
              <p className="text-xs font-medium text-slate-400">更新时间</p>
              <p className="mt-1 text-sm text-slate-700">
                {formatUpdatedAt(document.updatedAt)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 sm:hidden">
            <span>更新时间</span>
            <span>{formatUpdatedAt(document.updatedAt)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
