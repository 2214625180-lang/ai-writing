import "server-only";

import { type Plan, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { userService } from "@/services/user.service";
import type {
  CreateDocumentInput,
  DocumentDetail,
  DocumentListItem,
  GetDocumentsParams,
  GetDocumentsResult,
  UpdateDocumentInput
} from "@/types/document";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const CONTENT_PREVIEW_LENGTH = 180;

const DOCUMENT_LIMITS: Record<Plan, number> = {
  FREE: 50,
  PRO: 1000,
  TEAM: 5000
};

export class DocumentLimitExceededError extends Error {
  constructor() {
    super("Document limit exceeded.");
    this.name = "DocumentLimitExceededError";
  }
}

export class SourceGenerationNotFoundError extends Error {
  constructor() {
    super("Source generation not found.");
    this.name = "SourceGenerationNotFoundError";
  }
}

export class DocumentNotFoundError extends Error {
  constructor() {
    super("Document not found.");
    this.name = "DocumentNotFoundError";
  }
}

export class DocumentForbiddenError extends Error {
  constructor() {
    super("Forbidden.");
    this.name = "DocumentForbiddenError";
  }
}

export interface CreateDocumentParams extends CreateDocumentInput {
  userId: string;
  plan: Plan;
}

export interface UpdateDocumentParams extends UpdateDocumentInput {
  userId: string;
}

function normalizePagination(params: GetDocumentsParams) {
  const page = Math.max(DEFAULT_PAGE, Math.floor(params.page ?? DEFAULT_PAGE));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(params.pageSize ?? DEFAULT_PAGE_SIZE))
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize
  };
}

function normalizeKeyword(keyword?: string): string | undefined {
  const normalizedKeyword = keyword?.trim();

  return normalizedKeyword ? normalizedKeyword : undefined;
}

function buildDocumentWhereInput(
  userId: string,
  params: GetDocumentsParams
): Prisma.DocumentWhereInput {
  const keyword = normalizeKeyword(params.keyword);

  return {
    userId,
    ...(params.favoriteOnly ? { isFavorite: true } : {}),
    ...(keyword
      ? {
          OR: [
            {
              title: {
                contains: keyword,
                mode: "insensitive"
              }
            },
            {
              content: {
                contains: keyword,
                mode: "insensitive"
              }
            }
          ]
        }
      : {})
  };
}

function toDocumentListItem(document: {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}): DocumentListItem {
  return {
    id: document.id,
    title: document.title,
    contentPreview: document.content.slice(0, CONTENT_PREVIEW_LENGTH),
    isFavorite: document.isFavorite,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

function toDocumentDetail(document: {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}): DocumentDetail {
  return {
    id: document.id,
    title: document.title,
    content: document.content,
    isFavorite: document.isFavorite,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

async function assertCanCreateDocument(params: {
  userId: string;
  plan: Plan;
}) {
  const documentCount = await prisma.document.count({
    where: {
      userId: params.userId
    }
  });

  if (documentCount >= DOCUMENT_LIMITS[params.plan]) {
    throw new DocumentLimitExceededError();
  }
}

async function assertSourceGenerationBelongsToUser(params: {
  userId: string;
  generationId?: string;
}) {
  if (!params.generationId) {
    return;
  }

  const generation = await prisma.generation.findFirst({
    where: {
      id: params.generationId,
      userId: params.userId
    },
    select: {
      id: true
    }
  });

  if (!generation) {
    throw new SourceGenerationNotFoundError();
  }
}

async function getDocumentOwnerSnapshot(documentId: string) {
  const document = await prisma.document.findUnique({
    where: {
      id: documentId
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (!document) {
    throw new DocumentNotFoundError();
  }

  return document;
}

async function assertDocumentBelongsToUser(params: {
  documentId: string;
  userId: string;
}) {
  const document = await getDocumentOwnerSnapshot(params.documentId);

  if (document.userId !== params.userId) {
    throw new DocumentForbiddenError();
  }

  return document;
}

export const documentService = {
  async listRecentByUser(userId: string, limit = 5) {
    return prisma.document.findMany({
      where: {
        userId
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: limit
    });
  },

  async createDocument(params: CreateDocumentParams) {
    await assertCanCreateDocument({
      userId: params.userId,
      plan: params.plan
    });
    await assertSourceGenerationBelongsToUser({
      userId: params.userId,
      generationId: params.generationId
    });

    return prisma.document.create({
      data: {
        userId: params.userId,
        title: params.title,
        content: params.content
      },
      select: {
        id: true,
        title: true
      }
    });
  },

  async getDocumentByIdForUser(
    documentId: string,
    userId: string
  ): Promise<DocumentDetail> {
    const document = await prisma.document.findUnique({
      where: {
        id: documentId
      },
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!document) {
      throw new DocumentNotFoundError();
    }

    if (document.userId !== userId) {
      throw new DocumentForbiddenError();
    }

    return toDocumentDetail(document);
  },

  async updateDocument(params: UpdateDocumentParams) {
    await assertDocumentBelongsToUser({
      documentId: params.id,
      userId: params.userId
    });

    return prisma.document.update({
      where: {
        id: params.id
      },
      data: {
        ...(params.title !== undefined ? { title: params.title } : {}),
        ...(params.content !== undefined ? { content: params.content } : {}),
        ...(params.isFavorite !== undefined
          ? { isFavorite: params.isFavorite }
          : {})
      },
      select: {
        id: true,
        updatedAt: true
      }
    });
  },

  async deleteDocument(params: { documentId: string; userId: string }) {
    await assertDocumentBelongsToUser(params);

    return prisma.document.delete({
      where: {
        id: params.documentId
      },
      select: {
        id: true
      }
    });
  },

  async listDocumentsByUser(
    userId: string,
    params: GetDocumentsParams = {}
  ): Promise<GetDocumentsResult> {
    const { page, pageSize, skip } = normalizePagination(params);
    const where = buildDocumentWhereInput(userId, params);

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: {
          updatedAt: "desc"
        },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          content: true,
          isFavorite: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.document.count({
        where
      })
    ]);

    return {
      items: documents.map(toDocumentListItem),
      total,
      page,
      pageSize
    };
  }
};

export async function getDocuments(
  params: GetDocumentsParams = {}
): Promise<GetDocumentsResult> {
  const user = await userService.getCurrentUser();

  return documentService.listDocumentsByUser(user.id, params);
}

export async function getDocumentById(documentId: string): Promise<DocumentDetail> {
  const user = await userService.getCurrentUser();

  return documentService.getDocumentByIdForUser(documentId, user.id);
}

export async function getRecentDocuments(limit = 5) {
  const user = await userService.getCurrentUser();

  return documentService.listRecentByUser(user.id, limit);
}
