export type GenerationStatus = "queued" | "completed" | "failed";

export interface GenerationRecord {
  id: string;
  userId: string;
  title: string | null;
  prompt: string;
  content: string;
  model: string;
  status: GenerationStatus;
  tokensUsed: number;
  createdAt: Date;
  updatedAt: Date;
}
