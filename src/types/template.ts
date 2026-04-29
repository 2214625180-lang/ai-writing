export interface GetTemplatesParams {
  category?: string;
  keyword?: string;
  includePremium?: boolean;
}

export interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: unknown;
  isPremium: boolean;
}

export interface TemplateDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  fields: unknown;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGenerationFromTemplateInput {
  templateId: string;
  values: Record<string, string>;
}

export interface CreateGenerationFromTemplateResult {
  generationId: string;
}
