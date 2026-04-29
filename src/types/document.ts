export interface CreateDocumentInput {
  title: string;
  content: string;
  generationId?: string;
}

export interface CreateDocumentResult {
  id: string;
  title: string;
}

export interface UpdateDocumentInput {
  id: string;
  title?: string;
  content?: string;
  isFavorite?: boolean;
}

export interface UpdateDocumentResult {
  id: string;
  updatedAt: Date;
}

export interface DeleteDocumentResult {
  deleted: true;
}

export interface GetDocumentsParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  favoriteOnly?: boolean;
}

export interface DocumentListItem {
  id: string;
  title: string;
  contentPreview: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentDetail {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetDocumentsResult {
  items: DocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
}
