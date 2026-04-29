import "server-only";

interface BuildWritingPromptInput {
  input: string;
  templatePrompt?: string | null;
  tone?: string;
  language?: string;
  audience?: string;
  requirements?: string;
}

export function buildWritingPrompt({
  input,
  templatePrompt,
  tone,
  language,
  audience,
  requirements
}: BuildWritingPromptInput): string {
  const sections = [
    "You are an AI writing assistant.",
    templatePrompt ? `Template instructions: ${templatePrompt.trim()}` : null,
    `Task: ${input.trim()}`,
    tone ? `Tone: ${tone.trim()}` : null,
    language ? `Language: ${language.trim()}` : null,
    audience ? `Audience: ${audience.trim()}` : null,
    requirements ? `Requirements: ${requirements.trim()}` : null
  ].filter(Boolean);

  return sections.join("\n");
}
