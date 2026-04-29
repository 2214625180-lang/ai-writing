import type { ActionErrorCode, ActionResult } from "@/types/action";

export function createSuccessResult<T>(data: T): ActionResult<T> {
  return {
    success: true,
    data
  };
}

export function createErrorResult(
  error: string,
  code?: ActionErrorCode
): ActionResult<never> {
  return {
    success: false,
    error,
    code
  };
}
