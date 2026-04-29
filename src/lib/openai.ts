import OpenAI from "openai";

function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  return apiKey;
}

export const openai = new OpenAI({
  apiKey: getOpenAIApiKey()
});
