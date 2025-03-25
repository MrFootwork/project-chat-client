import { MessageAuthor } from './user';

export type Message = {
  id: string;
  content: string;
  edited: boolean;
  readBy: MessageAuthor[];
  roomId: string;
  createdAt: string;
  updatedAt: string;
  author: MessageAuthor;
};
