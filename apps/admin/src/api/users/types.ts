export interface User {
  id: string;
  fullName: string;
  email: string;
  roles: Role[];
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
  systemCriticalRole: boolean;
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
