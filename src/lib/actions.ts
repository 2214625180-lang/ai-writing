export type ActionState<TData, TError extends string = string> =
  | {
      success: true;
      data: TData;
      error: null;
    }
  | {
      success: false;
      data: null;
      error: TError;
    };

export function createActionSuccess<TData>(data: TData): ActionState<TData> {
  return {
    success: true,
    data,
    error: null
  };
}

export function createActionError<TError extends string>(
  error: TError
): ActionState<never, TError> {
  return {
    success: false,
    data: null,
    error
  };
}
