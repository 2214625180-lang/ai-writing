import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { DocumentEditor } from "@/components/documents/document-editor";
import {
  DocumentForbiddenError,
  DocumentNotFoundError,
  getDocumentById
} from "@/services/document.service";

interface DocumentDetailPageProps {
  params: {
    id: string;
  };
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

async function loadDocument(documentId: string) {
  try {
    return await getDocumentById(documentId);
  } catch (error) {
    if (
      error instanceof DocumentNotFoundError ||
      error instanceof DocumentForbiddenError
    ) {
      notFound();
    }

    throw error;
  }
}

export default async function DocumentDetailPage({
  params
}: DocumentDetailPageProps) {
  const document = await loadDocument(params.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            返回文档列表
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {document.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            创建于 {formatDateTime(document.createdAt)}，最后更新于{" "}
            {formatDateTime(document.updatedAt)}
          </p>
        </div>

        <DeleteDocumentButton documentId={document.id} />
      </div>

      <DocumentEditor document={document} />
    </div>
  );
}
