export interface DocumentRecord {
  id: string;
  userId: string;
  title: string;
  content: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}
