export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "USAGE_LIMIT_EXCEEDED"
  | "PREMIUM_REQUIRED"
  | "VALIDATION_ERROR"
  | "AI_GENERATION_FAILED"
  | "STRIPE_ERROR";

export type ActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      code?: ActionErrorCode;
    };
