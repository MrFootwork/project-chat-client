import { MessageAuthor } from './user';

export type Message = {
  id: string;
  content: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
  user: MessageAuthor;
};
