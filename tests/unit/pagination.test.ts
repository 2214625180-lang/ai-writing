import { describe, expect, it } from "vitest";

import { normalizePaginationParams, parsePositiveInteger } from "@/lib/pagination";

describe("pagination helpers", () => {
  it("normalizes invalid page params to safe defaults", () => {
    expect(parsePositiveInteger("abc", 1)).toBe(1);
    expect(parsePositiveInteger("-10", 1)).toBe(1);
    expect(parsePositiveInteger("2.9", 1)).toBe(2);
  });

  it("caps page size at the configured maximum", () => {
    expect(
      normalizePaginationParams({
        page: "3",
        pageSize: "500",
        maxPageSize: 100
      })
    ).toEqual({
      page: 3,
      pageSize: 100
    });
  });
});

