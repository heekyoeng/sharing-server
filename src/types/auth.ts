export type UserRole = 'ADMIN' | 'USER';

export interface RegisterRequest {
  name: string;
  username: string;
  email?: string;
  password: string;
  role?: UserRole;
}

export interface UserPublic {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  createdAt: string;
}