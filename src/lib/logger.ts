import "server-only";

type LogLevel = "info" | "warn" | "error";

export type LogContext = Record<
  string,
  string | number | boolean | null | undefined
>;

interface LogParams {
  event: string;
  message: string;
  context?: LogContext;
  error?: unknown;
}

function redactSensitiveValue(value: string): string {
  return value.replace(
    /(sk|pk|whsec)_(test|live)?_?[A-Za-z0-9_*]+/g,
    "$1_$2_***"
  );
}

function serializeError(error: unknown) {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactSensitiveValue(error.message),
      stack:
        process.env.NODE_ENV === "development"
          ? redactSensitiveValue(error.stack ?? "")
          : undefined
    };
  }

  return {
    message: redactSensitiveValue(String(error))
  };
}

function writeLog(level: LogLevel, params: LogParams) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event: params.event,
    message: params.message,
    context: params.context,
    error: serializeError(params.error)
  };
  const serializedPayload = JSON.stringify(payload);

  if (level === "error") {
    console.error(serializedPayload);
    return;
  }

  if (level === "warn") {
    console.warn(serializedPayload);
    return;
  }

  console.info(serializedPayload);
}

export const logger = {
  info(params: LogParams) {
    writeLog("info", params);
  },

  warn(params: LogParams) {
    writeLog("warn", params);
  },

  error(params: LogParams) {
    writeLog("error", params);
  }
};

