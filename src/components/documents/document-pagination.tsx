import Link from "next/link";

interface DocumentPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  keyword?: string;
  favoriteOnly: boolean;
}

function buildPageHref(params: {
  page: number;
  pageSize: number;
  keyword?: string;
  favoriteOnly: boolean;
}): string {
  const searchParams = new URLSearchParams();

  if (params.keyword?.trim()) {
    searchParams.set("keyword", params.keyword.trim());
  }

  if (params.favoriteOnly) {
    searchParams.set("favoriteOnly", "true");
  }

  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));

  return `/documents?${searchParams.toString()}`;
}

export function DocumentPagination({
  page,
  pageSize,
  total,
  keyword,
  favoriteOnly
}: DocumentPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <nav className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        第 {page} / {totalPages} 页，共 {total} 篇文档
      </p>

      <div className="flex gap-2">
        {hasPreviousPage ? (
          <Link
            href={buildPageHref({
              page: page - 1,
              pageSize,
              keyword,
              favoriteOnly
            })}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            上一页
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400">
            上一页
          </span>
        )}

        {hasNextPage ? (
          <Link
            href={buildPageHref({
              page: page + 1,
              pageSize,
              keyword,
              favoriteOnly
            })}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            下一页
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400">
            下一页
          </span>
        )}
      </div>
    </nav>
  );
}
