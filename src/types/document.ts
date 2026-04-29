export interface CreateDocumentInput {
  title: string;
  content?: string;
  isFavorite?: boolean;
}

export interface UpdateDocumentInput {
  documentId: string;
  title?: string;
  content?: string;
  isFavorite?: boolean;
}

export interface GetDocumentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isFavorite?: boolean;
  sortBy?: "updatedAt" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";
}
