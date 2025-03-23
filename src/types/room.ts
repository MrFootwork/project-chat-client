export type Room = {
  id: string;
  name: string;
  private: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  Users: {
    userId: string;
    isAdmin: boolean;
  }[];
};
