export interface GetTemplatesParams {
  category?: string;
  isPremium?: boolean;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateGenerationFromTemplateInput {
  templateId: string;
  model: string;
  fieldValues: Record<string, string | number | boolean | null>;
  title?: string;
  documentId?: string;
}
