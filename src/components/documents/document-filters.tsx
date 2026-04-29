"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface DocumentFiltersProps {
  keyword?: string;
  favoriteOnly: boolean;
}

export function DocumentFilters({
  keyword = "",
  favoriteOnly
}: DocumentFiltersProps) {
  const router = useRouter();
  const [keywordValue, setKeywordValue] = useState(keyword);
  const [favoriteOnlyValue, setFavoriteOnlyValue] = useState(favoriteOnly);

  function buildUrl(nextKeyword: string, nextFavoriteOnly: boolean): string {
    const searchParams = new URLSearchParams();
    const normalizedKeyword = nextKeyword.trim();

    if (normalizedKeyword) {
      searchParams.set("keyword", normalizedKeyword);
    }

    if (nextFavoriteOnly) {
      searchParams.set("favoriteOnly", "true");
    }

    searchParams.set("page", "1");

    const queryString = searchParams.toString();

    return queryString ? `/documents?${queryString}` : "/documents";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildUrl(keywordValue, favoriteOnlyValue));
  }

  function handleReset() {
    setKeywordValue("");
    setFavoriteOnlyValue(false);
    router.push("/documents");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <div>
          <label htmlFor="document-keyword" className="text-sm font-medium text-slate-900">
            搜索文档
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="document-keyword"
              value={keywordValue}
              onChange={(event) => setKeywordValue(event.target.value)}
              placeholder="搜索标题或正文"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={favoriteOnlyValue}
            onChange={(event) => setFavoriteOnlyValue(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          仅看收藏
        </label>

        <div className="grid gap-2 sm:grid-cols-2 lg:flex">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            筛选
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            重置
          </button>
        </div>
      </div>
    </form>
  );
}
