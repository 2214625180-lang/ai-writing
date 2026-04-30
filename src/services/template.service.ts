import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildPromptFromTemplateValues,
  TemplateFieldValidationError
} from "@/lib/template-fields";
import type {
  GetTemplatesParams,
  TemplateDetail,
  TemplateListItem
} from "@/types/template";

export class TemplateNotFoundError extends Error {
  constructor() {
    super("Template not found.");
    this.name = "TemplateNotFoundError";
  }
}

export {
  buildPromptFromTemplateValues,
  TemplateFieldValidationError as TemplateValidationError
};

function normalizeText(value?: string): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function buildTemplateWhereInput(
  params: GetTemplatesParams = {}
): Prisma.TemplateWhereInput {
  const category = normalizeText(params.category);
  const keyword = normalizeText(params.keyword);

  return {
    isActive: true,
    ...(category ? { category } : {}),
    ...(params.includePremium === false ? { isPremium: false } : {}),
    ...(keyword
      ? {
          OR: [
            {
              name: {
                contains: keyword,
                mode: "insensitive"
              }
            },
            {
              description: {
                contains: keyword,
                mode: "insensitive"
              }
            }
          ]
        }
      : {})
  };
}

function toTemplateListItem(template: {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: Prisma.JsonValue;
  isPremium: boolean;
}): TemplateListItem {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    fields: template.fields,
    isPremium: template.isPremium
  };
}

function toTemplateDetail(template: {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  fields: Prisma.JsonValue;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TemplateDetail {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    prompt: template.prompt,
    fields: template.fields,
    isPremium: template.isPremium,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
}

export const templateService = {
  async listActiveTemplates(limit = 6) {
    return prisma.template.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
  },

  async getTemplates(
    params: GetTemplatesParams = {}
  ): Promise<TemplateListItem[]> {
    const templates = await prisma.template.findMany({
      where: buildTemplateWhereInput(params),
      orderBy: [
        {
          isPremium: "asc"
        },
        {
          createdAt: "desc"
        }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        fields: true,
        isPremium: true
      }
    });

    return templates.map(toTemplateListItem);
  },

  async getTemplateById(templateId: string): Promise<TemplateDetail> {
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        prompt: true,
        fields: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!template) {
      throw new TemplateNotFoundError();
    }

    return toTemplateDetail(template);
  }
};

export async function getTemplates(
  params: GetTemplatesParams = {}
): Promise<TemplateListItem[]> {
  return templateService.getTemplates(params);
}

export async function getTemplateById(
  templateId: string
): Promise<TemplateDetail> {
  return templateService.getTemplateById(templateId);
}
