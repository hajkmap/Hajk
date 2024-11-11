export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface LocalUserPayload {
  fullName: string;
  email: string;
  password: string;
  user: object;
}

export interface Role {
  id: string;
  code: string;
  title: string;
  description: string;
}

export interface UsersApiResponse {
  users: User[];
  count?: number;
  error: string;
  errorId: string;
}

export interface UserRolesApiResponse {
  roles: Role[];
  count?: number;
  error: string;
  errorId: string;
}
