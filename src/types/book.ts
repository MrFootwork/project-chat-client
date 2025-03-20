export type Book = {
  id: string;
  title: string;
  year: number;
  summary?: string | null;
  test: string;
  quantity: number;
  genre: string[];
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
};
