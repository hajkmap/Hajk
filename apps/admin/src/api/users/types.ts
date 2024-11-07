export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface UsersApiResponse {
  users: User[];
  count?: number;
  error: string;
  errorId: string;
}
