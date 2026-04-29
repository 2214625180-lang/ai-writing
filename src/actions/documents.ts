"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createErrorResult, createSuccessResult } from "@/lib/actions";
import { AuthError } from "@/lib/auth";
import {
  DocumentForbiddenError,
  documentService,
  DocumentLimitExceededError,
  DocumentNotFoundError,
  getRecentDocuments,
  SourceGenerationNotFoundError
} from "@/services/document.service";
import { userService } from "@/services/user.service";
import type {
  CreateDocumentInput,
  CreateDocumentResult,
  DeleteDocumentResult,
  UpdateDocumentInput,
  UpdateDocumentResult
} from "@/types/document";

const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(100),
  content: z.string().trim().min(1).max(50_000),
  generationId: z.string().trim().min(1).optional()
});

const updateDocumentSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1).max(100).optional(),
    content: z.string().trim().min(1).max(50_000).optional(),
    isFavorite: z.boolean().optional()
  })
  .refine(
    (input) =>
      input.title !== undefined ||
      input.content !== undefined ||
      input.isFavorite !== undefined,
    {
      message: "At least one field is required to update."
    }
  );

const documentIdSchema = z.string().trim().min(1);

export async function createDocumentAction(input: CreateDocumentInput) {
  try {
    const parsedInput = createDocumentSchema.parse(input);
    const user = await userService.getCurrentUser();

    const document = await documentService.createDocument({
      userId: user.id,
      plan: user.plan,
      title: parsedInput.title,
      content: parsedInput.content,
      generationId: parsedInput.generationId
    });

    return createSuccessResult<CreateDocumentResult>(document);
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof z.ZodError) {
      return createErrorResult("Invalid document input.", "VALIDATION_ERROR");
    }

    if (error instanceof DocumentLimitExceededError) {
      return createErrorResult("Document limit exceeded.", "USAGE_LIMIT_EXCEEDED");
    }

    if (error instanceof SourceGenerationNotFoundError) {
      return createErrorResult("Source generation not found.", "NOT_FOUND");
    }

    throw error;
  }
}

export async function updateDocumentAction(input: UpdateDocumentInput) {
  try {
    const parsedInput = updateDocumentSchema.parse(input);
    const user = await userService.getCurrentUser();

    const document = await documentService.updateDocument({
      userId: user.id,
      id: parsedInput.id,
      title: parsedInput.title,
      content: parsedInput.content,
      isFavorite: parsedInput.isFavorite
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/${document.id}`);

    return createSuccessResult<UpdateDocumentResult>(document);
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof z.ZodError) {
      return createErrorResult("Invalid document input.", "VALIDATION_ERROR");
    }

    if (error instanceof DocumentNotFoundError) {
      return createErrorResult("Document not found.", "NOT_FOUND");
    }

    if (error instanceof DocumentForbiddenError) {
      return createErrorResult("Forbidden.", "FORBIDDEN");
    }

    throw error;
  }
}

export async function deleteDocumentAction(documentId: string) {
  try {
    const parsedDocumentId = documentIdSchema.parse(documentId);
    const user = await userService.getCurrentUser();

    await documentService.deleteDocument({
      documentId: parsedDocumentId,
      userId: user.id
    });

    revalidatePath("/documents");

    return createSuccessResult<DeleteDocumentResult>({
      deleted: true
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    if (error instanceof z.ZodError) {
      return createErrorResult("Invalid document id.", "VALIDATION_ERROR");
    }

    if (error instanceof DocumentNotFoundError) {
      return createErrorResult("Document not found.", "NOT_FOUND");
    }

    if (error instanceof DocumentForbiddenError) {
      return createErrorResult("Forbidden.", "FORBIDDEN");
    }

    throw error;
  }
}

export async function getRecentDocumentsAction() {
  try {
    const documents = await getRecentDocuments();

    return createSuccessResult(documents);
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResult("Unauthorized.", "UNAUTHORIZED");
    }

    return createErrorResult("Failed to load recent documents.");
  }
}
