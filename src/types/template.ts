export interface TemplateRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  promptTemplate: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}
