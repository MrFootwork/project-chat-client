export type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  avatarUrl: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserSignUp = Pick<User, 'email' | 'name' | 'password'>;

export type RoomMember = Omit<User, 'password' | 'createdAt' | 'updatedAt'> & {
  avatarUrl: string;
  isAdmin: boolean;
  userLeft: boolean;
};

export type MessageAuthor = Pick<
  RoomMember,
  'id' | 'name' | 'avatarUrl' | 'isDeleted'
>;
