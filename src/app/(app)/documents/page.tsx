import { CreateDocumentForm } from "@/components/documents/create-document-form";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentPagination } from "@/components/documents/document-pagination";
import { getDocuments } from "@/services/document.service";

interface DocumentsPageProps {
  searchParams?: {
    keyword?: string;
    favoriteOnly?: string;
    page?: string;
    pageSize?: string;
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsedValue));
}

function parseFavoriteOnly(value: string | undefined): boolean {
  return value === "true";
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const keyword = searchParams?.keyword?.trim() || undefined;
  const favoriteOnly = parseFavoriteOnly(searchParams?.favoriteOnly);
  const page = parsePositiveInteger(searchParams?.page, 1);
  const pageSize = Math.min(parsePositiveInteger(searchParams?.pageSize, 20), 100);
  const documents = await getDocuments({
    keyword,
    favoriteOnly,
    page,
    pageSize
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Documents</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            文档
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            管理保存的文章、文案和邮件。支持关键词搜索、收藏筛选和分页浏览。
          </p>
        </div>
        <CreateDocumentForm />
      </div>

      <DocumentFilters keyword={keyword} favoriteOnly={favoriteOnly} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">当前加载</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {documents.items.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">全部文档</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {documents.total}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">收藏文档</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {documents.items.filter((document) => document.isFavorite).length}
          </p>
        </div>
      </div>

      <DocumentList documents={documents.items} />
      <DocumentPagination
        page={documents.page}
        pageSize={documents.pageSize}
        total={documents.total}
        keyword={keyword}
        favoriteOnly={favoriteOnly}
      />
    </div>
  );
}
