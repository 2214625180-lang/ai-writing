import Link from "next/link";

interface GenerationHistoryPaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

function buildHistoryPageHref(params: {
  page: number;
  pageSize: number;
}): string {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize)
  });

  return `/history?${searchParams.toString()}`;
}

export function GenerationHistoryPagination({
  page,
  pageSize,
  total
}: GenerationHistoryPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <nav className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        第 {page} / {totalPages} 页，共 {total} 条生成记录
      </p>

      <div className="flex gap-2">
        {hasPreviousPage ? (
          <Link
            href={buildHistoryPageHref({
              page: page - 1,
              pageSize
            })}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            上一页
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400">
            上一页
          </span>
        )}

        {hasNextPage ? (
          <Link
            href={buildHistoryPageHref({
              page: page + 1,
              pageSize
            })}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            下一页
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400">
            下一页
          </span>
        )}
      </div>
    </nav>
  );
}

