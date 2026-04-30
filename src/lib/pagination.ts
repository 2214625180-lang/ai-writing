export interface NormalizePaginationInput {
  page?: string | number;
  pageSize?: string | number;
  defaultPage?: number;
  defaultPageSize?: number;
  maxPageSize?: number;
}

export interface NormalizedPagination {
  page: number;
  pageSize: number;
}

export function parsePositiveInteger(
  value: string | number | undefined,
  fallback: number
): number {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsedValue));
}

export function normalizePaginationParams(
  input: NormalizePaginationInput = {}
): NormalizedPagination {
  const defaultPage = input.defaultPage ?? 1;
  const defaultPageSize = input.defaultPageSize ?? 20;
  const maxPageSize = input.maxPageSize ?? 100;
  const page = parsePositiveInteger(input.page, defaultPage);
  const pageSize = Math.min(
    parsePositiveInteger(input.pageSize, defaultPageSize),
    maxPageSize
  );

  return {
    page,
    pageSize
  };
}

