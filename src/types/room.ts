import { Message } from './message';
import { RoomMember } from './user';

export type Room = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
  members: RoomMember[];
  messages: Message[];
};
