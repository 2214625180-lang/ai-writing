export type AsyncActionResult<TData, TError extends string = string> = Promise<
  | {
      success: true;
      data: TData;
      error: null;
    }
  | {
      success: false;
      data: null;
      error: TError;
    }
>;
