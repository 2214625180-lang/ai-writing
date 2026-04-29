import "server-only";

import OpenAI from "openai";

const DEFAULT_OPENAI_TIMEOUT_MS = 45_000;

function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  return apiKey;
}

function getOpenAIBaseUrl(): string | undefined {
  const baseUrl = process.env.OPENAI_BASE_URL?.trim();

  return baseUrl || undefined;
}

export const openai = new OpenAI({
  apiKey: getOpenAIApiKey(),
  baseURL: getOpenAIBaseUrl(),
  maxRetries: 1,
  timeout: DEFAULT_OPENAI_TIMEOUT_MS
});
