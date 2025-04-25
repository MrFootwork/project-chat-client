import { MessageAuthor } from './user';

export type Message = {
  id: string;
  content: string;
  edited: boolean;
  deleted: boolean;
  readers: MessageAuthor[];
  roomId: string;
  createdAt: string;
  updatedAt: string;
  author: MessageAuthor;
};
