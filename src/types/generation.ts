export type GenerationStatus =
  | "PENDING"
  | "STREAMING"
  | "COMPLETED"
  | "FAILED";

export interface CreateGenerationInput {
  input: string;
  templateId?: string;
  type?: string;
  tone?: string;
  language?: string;
  audience?: string;
  requirements?: string;
  model?: string;
}

export interface CreateGenerationResult {
  generationId: string;
}

export interface GetGenerationHistoryParams {
  page?: number;
  pageSize?: number;
}

export interface GenerationHistoryItem {
  id: string;
  input: string;
  output: string | null;
  model: string;
  status: GenerationStatus;
  totalTokens: number | null;
  createdAt: Date;
}

export interface GenerationHistoryResult {
  items: GenerationHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeleteGenerationResult {
  deleted: true;
}

export interface RerunGenerationResult {
  generationId: string;
}
