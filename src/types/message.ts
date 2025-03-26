import { MessageAuthor } from './user';

export type Message = {
  id: string;
  content: string;
  edited: boolean;
  readers: MessageAuthor[];
  roomId: string;
  createdAt: string;
  updatedAt: string;
  author: MessageAuthor;
};
